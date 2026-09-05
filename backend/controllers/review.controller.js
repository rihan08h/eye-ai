const mongoose = require('mongoose');
const ClinicianReview = require('../models/ClinicianReview');
const { computeIsOverride } = require('../models/ClinicianReview');
const Screening = require('../models/Screening');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const SEVERITY_ORDER = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];

const DECISIONS_REQUIRING_ASSESSMENT = ['confirmed', 'modified'];

/**
 * POST /api/reviews
 * Record a clinician's assessment of a screening. Doctors only.
 *
 * This never modifies the screening's AI fields. It writes a ClinicianReview
 * and updates two derived flags on the screening so the review queue can be
 * queried without a join.
 */
const createReview = asyncHandler(async (req, res, next) => {
  const {
    screeningId,
    decision,
    clinicalAssessment,
    notes = '',
    referralRecommended = false,
    followUpMonths = null,
  } = req.body;

  if (!screeningId) {
    return next(new ApiError(400, 'screeningId is required.'));
  }

  if (!decision) {
    return next(new ApiError(400, 'A review decision is required.'));
  }

  if (DECISIONS_REQUIRING_ASSESSMENT.includes(decision) && !clinicalAssessment) {
    return next(
      new ApiError(400, `A clinical assessment is required when the decision is "${decision}".`)
    );
  }

  if (clinicalAssessment && !SEVERITY_ORDER.includes(clinicalAssessment)) {
    return next(
      new ApiError(400, `clinicalAssessment must be one of: ${SEVERITY_ORDER.join(', ')}.`)
    );
  }

  if (mongoose.connection.readyState !== 1) {
    return next(
      new ApiError(503, 'Clinician review requires a database connection and is unavailable in dev-store mode.')
    );
  }

  const screening = await Screening.findOne({ _id: screeningId, screenedBy: req.user._id });
  if (!screening) {
    return next(new ApiError(404, 'Screening not found.'));
  }

  if (screening.isMock) {
    return next(
      new ApiError(
        409,
        'This screening was produced by the development stub and contains no real analysis. It cannot be clinically reviewed.'
      )
    );
  }

  // A 'confirmed' decision on a screening with no AI prediction is incoherent
  // — there is nothing to confirm.
  if (decision === 'confirmed' && !screening.prediction) {
    return next(
      new ApiError(
        400,
        'This screening has no AI prediction to confirm. Use "modified" to record your own assessment, or "recapture_requested".'
      )
    );
  }

  const review = await ClinicianReview.create({
    screening: screening._id,
    patient: screening.patient,
    reviewer: req.user._id,
    decision,
    clinicalAssessment: clinicalAssessment || null,
    aiSnapshot: {
      prediction: screening.prediction,
      confidence: screening.confidence,
      modelVersion: screening.modelVersion,
      uncertaintyLevel: screening.uncertainty?.level ?? null,
      analysisStatus: screening.analysisStatus,
    },
    // Computed server-side from the AI snapshot — never read from req.body.
    isOverride: computeIsOverride(decision, clinicalAssessment || null, screening.prediction),
    notes,
    referralRecommended: Boolean(referralRecommended),
    followUpMonths: followUpMonths === null ? null : Number(followUpMonths),
  });

  // Retire any earlier review. The old document is kept intact — only its
  // isCurrent flag changes, so the history of what was decided when survives.
  await ClinicianReview.updateMany(
    { screening: screening._id, _id: { $ne: review._id }, isCurrent: true },
    { $set: { isCurrent: false, supersededBy: review._id } }
  );

  // Derived flags only. The AI prediction, probabilities and confidence on the
  // screening document are untouched.
  screening.reviewStatus = 'reviewed';
  screening.currentReview = review._id;
  await screening.save();

  const populated = await ClinicianReview.findById(review._id)
    .populate('reviewer', 'name role organization')
    .populate('patient', 'patientId name');

  res.status(201).json({
    success: true,
    message:
      review.isOverride
        ? 'Review recorded. Your assessment differs from the AI result; both are retained.'
        : 'Review recorded.',
    review: populated,
  });
});

/**
 * GET /api/reviews/queue
 * Screenings awaiting clinician review, most clinically urgent first.
 */
const getReviewQueue = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({ success: true, total: 0, screenings: [], degraded: true });
  }

  const query = {
    reviewStatus: { $ne: 'reviewed' },
    isMock: { $ne: true },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Screening.countDocuments(query);

  // Ordering reflects clinical urgency rather than arrival time:
  // critical risk first, then cases the model itself flagged as uncertain
  // (a borderline Proliferative/Severe split is exactly what a human should
  // look at), then oldest first so nothing is starved.
  const RISK_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

  const screenings = await Screening.find(query)
    .populate('patient', 'patientId name age gender village phone')
    .populate('screenedBy', 'name role')
    .lean();

  screenings.sort((a, b) => {
    const risk = (RISK_RANK[a.riskLevel] ?? 9) - (RISK_RANK[b.riskLevel] ?? 9);
    if (risk !== 0) return risk;

    const aFlagged = a.uncertainty?.reviewRequired ? 0 : 1;
    const bFlagged = b.uncertainty?.reviewRequired ? 0 : 1;
    if (aFlagged !== bFlagged) return aFlagged - bFlagged;

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    screenings: screenings.slice(skip, skip + Number(limit)),
  });
});

/**
 * GET /api/reviews/screening/:screeningId
 * Full review history for one screening, newest first.
 */
const getReviewsForScreening = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({ success: true, reviews: [], degraded: true });
  }

  const screening = await Screening.findOne({ _id: req.params.screeningId, screenedBy: req.user._id });
  if (!screening) {
    return next(new ApiError(404, 'Screening record not found'));
  }

  const reviews = await ClinicianReview.find({ screening: req.params.screeningId })
    .sort({ createdAt: -1 })
    .populate('reviewer', 'name role organization');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

/**
 * GET /api/reviews/agreement
 * Override statistics — how often clinicians disagree with the model.
 *
 * This is a monitoring signal, not a performance metric. It measures
 * disagreement, not model accuracy: a clinician can be wrong too, and neither
 * party here is ground truth.
 */
const getAgreementStats = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({ success: true, degraded: true });
  }

  const reviews = await ClinicianReview.find({ isCurrent: true }).lean();
  const graded = reviews.filter((r) => r.aiSnapshot?.prediction && r.clinicalAssessment);

  const matrix = {};
  let agreements = 0;

  for (const r of graded) {
    const ai = r.aiSnapshot.prediction;
    const clinician = r.clinicalAssessment;
    matrix[ai] = matrix[ai] || {};
    matrix[ai][clinician] = (matrix[ai][clinician] || 0) + 1;
    if (ai === clinician) agreements += 1;
  }

  res.status(200).json({
    success: true,
    totalReviews: reviews.length,
    comparableReviews: graded.length,
    agreements,
    overrides: graded.length - agreements,
    agreementRate: graded.length ? agreements / graded.length : null,
    confusionMatrix: matrix,
    note: 'Measures clinician-AI disagreement. Neither party is ground truth, so this is not a measure of model accuracy.',
  });
});

module.exports = {
  createReview,
  getReviewQueue,
  getReviewsForScreening,
  getAgreementStats,
};
