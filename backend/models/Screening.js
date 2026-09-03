const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    screenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Screened by user reference is required'],
    },
    originalImageUrl: {
      type: String,
      required: [true, 'Original retinal image URL is required'],
    },
    heatmapImageUrl: {
      type: String,
      default: '',
    },
    // Null when the image was ungradable — an ungradable capture is a real
    // screening event with no prediction, not a failed one.
    prediction: {
      type: String,
      enum: ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR', null],
      default: null,
    },
    analysisStatus: {
      type: String,
      enum: ['ok', 'ungradable'],
      default: 'ok',
      index: true,
    },
    probabilities: {
      noDR: { type: Number, default: 0 },
      mild: { type: Number, default: 0 },
      moderate: { type: Number, default: 0 },
      severe: { type: Number, default: 0 },
      proliferative: { type: Number, default: 0 },
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    imageQuality: {
      status: {
        type: String,
        enum: ['good', 'adequate', 'poor', 'rejected'],
        default: 'good',
      },
      score: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      gradable: { type: Boolean, default: null },
      retinaPlausible: { type: Boolean, default: null },
      issues: [{ type: String }],
      metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Model confidence is not clinical certainty. Stored separately so the
    // UI can surface a low-margin prediction as needing review.
    uncertainty: {
      level: {
        type: String,
        enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL', null],
        default: null,
      },
      entropy: { type: Number, default: null },
      margin: { type: Number, default: null },
      isBorderline: { type: Boolean, default: false },
      reviewRequired: { type: Boolean, default: false },
      message: { type: String, default: '' },
    },

    explainability: {
      available: { type: Boolean, default: false },
      method: { type: String, default: '' },
      attentionScore: { type: Number, default: null },
      regions: { type: Array, default: [] },
    },

    // TRUE if this record was produced by the development stub rather than
    // the model. Persisted so a synthetic result can never be mistaken for a
    // real one later, and surfaced in the UI as a warning banner.
    isMock: {
      type: Boolean,
      default: false,
      index: true,
    },

    processingTimeMs: { type: Number, default: null },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'low',
    },
    referralRequired: {
      type: Boolean,
      default: false,
    },
    referralCreated: {
      type: Boolean,
      default: false,
    },
    // Read from the checkpoint at inference time — never hardcoded.
    modelVersion: {
      type: String,
      default: '',
    },
    // Derived pointer for queue filtering. The review's clinical content
    // lives in the ClinicianReview collection; nothing here is a clinical
    // finding, and the AI fields above are never modified by a review.
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed'],
      default: 'pending',
      index: true,
    },
    currentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicianReview',
      default: null,
    },

    screeningCamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
    },
    eyeSide: {
      type: String,
      enum: ['Left Eye (OS)', 'Right Eye (OD)', 'Both Eyes'],
      default: 'Right Eye (OD)',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

screeningSchema.index({ createdAt: -1 });
screeningSchema.index({ riskLevel: 1 });

const Screening = mongoose.model('Screening', screeningSchema);

module.exports = Screening;
