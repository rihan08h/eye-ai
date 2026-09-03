const mongoose = require('mongoose');
const Referral = require('../models/Referral');
const Screening = require('../models/Screening');
const devStore = require('../utils/devStore');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const createReferral = asyncHandler(async (req, res, next) => {
  const { patient, screening, priority = 'HIGH', hospitalName, appointmentDate, notes, assignedDoctor } = req.body;

  if (!patient || !screening) {
    return next(new ApiError(400, 'Patient and Screening IDs are required'));
  }

  if (mongoose.connection.readyState === 1) {
    const existing = await Referral.findOne({
      screening,
      status: { $in: ['Pending', 'Under Review', 'Appointment Scheduled'] },
    });
    if (existing) return next(new ApiError(409, 'An active referral already exists for this screening'));

    const referral = await Referral.create({
      patient,
      screening,
      createdBy: req.user._id,
      assignedDoctor,
      priority,
      hospitalName,
      appointmentDate,
      notes,
    });

    await Screening.findByIdAndUpdate(screening, { referralCreated: true });

    const populated = await Referral.findById(referral._id)
      .populate('patient')
      .populate('screening')
      .populate('createdBy', 'name role')
      .populate('assignedDoctor', 'name role organization');

    return res.status(201).json({ success: true, message: 'Referral created', referral: populated });
  }

  // Dev Store
  const patObj = devStore.patients.find((p) => p._id === patient || p.patientId === patient);
  const scrObj = devStore.screenings.find((s) => s._id === screening);

  // Previously this defaulted a missing screening to { prediction: 'Severe' },
  // which meant a referral for a screening that does not exist was created
  // carrying an invented sight-threatening diagnosis. Fail instead.
  if (!patObj) {
    return next(new ApiError(404, 'Patient not found.'));
  }
  if (!scrObj) {
    return next(new ApiError(404, 'Screening not found. A referral must reference a real screening.'));
  }

  scrObj.referralCreated = true;

  const newRef = {
    _id: 'dev_ref_' + Date.now(),
    patient: patObj,
    screening: scrObj,
    createdBy: req.user,
    assignedDoctor: devStore.users.find((u) => u.role === 'doctor') || req.user,
    priority,
    status: 'Pending',
    hospitalName: hospitalName || 'District Eye Hospital',
    appointmentDate: appointmentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notes,
    createdAt: new Date(),
  };

  devStore.referrals.unshift(newRef);

  res.status(201).json({ success: true, message: 'Referral created (Dev Mode)', referral: newRef });
});

const getReferrals = asyncHandler(async (req, res) => {
  const { status, priority, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState === 1) {
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Referral.countDocuments(query);
    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('patient')
      .populate('screening')
      .populate('createdBy', 'name role')
      .populate('assignedDoctor', 'name role organization');

    return res.status(200).json({ success: true, total, page: Number(page), referrals });
  }

  // Dev Store
  let filtered = [...devStore.referrals];
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (priority) filtered = filtered.filter((r) => r.priority === priority);

  res.status(200).json({
    success: true,
    total: filtered.length,
    page: 1,
    totalPages: 1,
    referrals: filtered,
  });
});

const getReferralById = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    const referral = await Referral.findById(req.params.id)
      .populate('patient')
      .populate('screening')
      .populate('createdBy', 'name role')
      .populate('assignedDoctor', 'name role organization');
    if (!referral) return next(new ApiError(404, 'Referral not found'));
    return res.status(200).json({ success: true, referral });
  }

  const referral = devStore.referrals.find((r) => r._id === req.params.id);
  if (!referral) return next(new ApiError(404, 'Referral not found'));
  res.status(200).json({ success: true, referral });
});

const updateReferralStatus = asyncHandler(async (req, res, next) => {
  const { status, doctorFeedback, finalDiagnosis } = req.body;

  if (mongoose.connection.readyState === 1) {
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { status, doctorFeedback, finalDiagnosis },
      { new: true }
    )
      .populate('patient')
      .populate('screening');
    if (!referral) return next(new ApiError(404, 'Referral not found'));
    return res.status(200).json({ success: true, message: 'Status updated', referral });
  }

  const ref = devStore.referrals.find((r) => r._id === req.params.id);
  if (!ref) return next(new ApiError(404, 'Referral not found'));

  if (status) ref.status = status;
  if (doctorFeedback) ref.doctorFeedback = doctorFeedback;
  if (finalDiagnosis) ref.finalDiagnosis = finalDiagnosis;
  ref.updatedAt = new Date();

  res.status(200).json({ success: true, message: 'Status updated (Dev Mode)', referral: ref });
});

module.exports = {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferralStatus,
};
