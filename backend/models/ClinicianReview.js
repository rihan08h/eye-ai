const mongoose = require('mongoose');

/**
 * A clinician's assessment of a screening.
 *
 * Stored in its own collection rather than as fields on Screening. The AI
 * prediction and the clinical decision are different claims by different
 * agents, and conflating them destroys the record of what the model actually
 * said — which is exactly what you need when auditing a missed case or
 * measuring how often clinicians disagree with the model.
 *
 * Nothing in this file writes to the Screening's prediction, probabilities,
 * or confidence. A review is additive.
 *
 * Reviews are append-only: correcting a review creates a new one that
 * supersedes the last, so the earlier judgement stays in the record.
 */
const clinicianReviewSchema = new mongoose.Schema(
  {
    screening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screening',
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    decision: {
      type: String,
      required: true,
      enum: [
        'confirmed', // agrees with the AI severity
        'modified', // assigns a different severity
        'recapture_requested', // image inadequate, screen again
        'inconclusive', // cannot determine from this image
      ],
    },

    /**
     * The clinician's severity assessment. Required for 'confirmed' and
     * 'modified'; absent for recapture and inconclusive, because no severity
     * was determined in those cases.
     */
    clinicalAssessment: {
      type: String,
      enum: ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR', null],
      default: null,
    },

    /**
     * Snapshot of what the AI said at the moment of review.
     *
     * Denormalised on purpose. If the model is later re-run, the record is
     * edited, or the model version changes, this preserves what the clinician
     * was actually looking at when they decided. Override-rate analysis is
     * meaningless without it.
     */
    aiSnapshot: {
      prediction: { type: String, default: null },
      confidence: { type: Number, default: null },
      modelVersion: { type: String, default: '' },
      uncertaintyLevel: { type: String, default: null },
      analysisStatus: { type: String, default: null },
    },

    /**
     * True when the clinician's assessment differs from the AI's. Computed on
     * save, not supplied by the client. Feeds override-rate monitoring.
     */
    isOverride: {
      type: Boolean,
      default: false,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [4000, 'Clinical notes cannot exceed 4000 characters'],
      default: '',
    },

    referralRecommended: {
      type: Boolean,
      default: false,
    },

    followUpMonths: {
      type: Number,
      min: 0,
      max: 60,
      default: null,
    },

    /**
     * Set to false when a later review replaces this one. The superseded
     * document is never deleted or edited.
     */
    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },
    supersededBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicianReview',
      default: null,
    },
  },
  { timestamps: true }
);

clinicianReviewSchema.index({ screening: 1, isCurrent: 1 });
clinicianReviewSchema.index({ createdAt: -1 });

/**
 * Derive whether a review contradicts the AI, rather than trusting the client.
 *
 * A plain function, not a Mongoose hook. Document middleware only fires on
 * save()/validate() — it is silently skipped by insertMany, updateOne and
 * findOneAndUpdate, which would leave isOverride at its default and quietly
 * corrupt override-rate monitoring. Exported so it can be called directly and
 * tested without a database.
 *
 * @param {string} decision
 * @param {string|null} clinicalAssessment
 * @param {string|null} aiPrediction
 * @returns {boolean}
 */
function computeIsOverride(decision, clinicalAssessment, aiPrediction) {
  const ai = aiPrediction ?? null;

  if (decision === 'confirmed') return false;
  if (decision === 'modified') return (clinicalAssessment ?? null) !== ai;

  // recapture_requested / inconclusive contradict any AI grade that exists.
  // If the AI produced no grade there is nothing to contradict.
  return ai !== null;
}

// Backstop for the ordinary create()/save() path. The controller sets the
// value explicitly; this makes it impossible for a caller to forge one.
clinicianReviewSchema.pre('save', function setOverride(next) {
  this.isOverride = computeIsOverride(
    this.decision,
    this.clinicalAssessment,
    this.aiSnapshot?.prediction
  );
  next();
});

const ClinicianReview = mongoose.model('ClinicianReview', clinicianReviewSchema);

module.exports = ClinicianReview;
module.exports.computeIsOverride = computeIsOverride;
