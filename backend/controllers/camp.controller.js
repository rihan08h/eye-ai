const mongoose = require('mongoose');
const Camp = require('../models/Camp');
const Screening = require('../models/Screening');
const devStore = require('../utils/devStore');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const createCamp = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const camp = await Camp.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json({ success: true, message: 'Camp created', camp });
  }

  const newCamp = {
    _id: 'dev_camp_' + Date.now(),
    ...req.body,
    createdBy: req.user._id,
    createdAt: new Date(),
  };
  devStore.camps.unshift(newCamp);
  res.status(201).json({ success: true, message: 'Camp created (Dev Mode)', camp: newCamp });
});

const getCamps = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const camps = await Camp.find({ createdBy: req.user._id }).sort({ startDate: -1 }).populate('createdBy', 'name role');
    const campsWithStats = await Promise.all(
      camps.map(async (camp) => {
        const screenedCount = await Screening.countDocuments({ screeningCamp: camp._id, screenedBy: req.user._id });
        const urgentCount = await Screening.countDocuments({
          screeningCamp: camp._id,
          screenedBy: req.user._id,
          riskLevel: { $in: ['high', 'critical'] },
        });
        return { ...camp.toObject(), screenedCount, urgentCount };
      })
    );
    return res.status(200).json({ success: true, camps: campsWithStats });
  }

  const userCamps = devStore.camps.filter(
    (c) => String(c.createdBy?._id || c.createdBy) === String(req.user._id)
  );

  const campsWithStats = userCamps.map((camp) => {
    const screenings = devStore.screenings.filter(
      (s) =>
        String(s.screeningCamp?._id || s.screeningCamp) === String(camp._id) &&
        String(s.screenedBy?._id || s.screenedBy) === String(req.user._id)
    );
    const urgentCount = screenings.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
    return {
      ...camp,
      screenedCount: screenings.length,
      urgentCount,
    };
  });

  res.status(200).json({ success: true, camps: campsWithStats });
});

const getCampById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (mongoose.connection.readyState === 1) {
    const camp = await Camp.findOne({ _id: id, createdBy: req.user._id }).populate('createdBy', 'name role organization');
    if (!camp) return next(new ApiError(404, 'Camp not found'));

    const screenings = await Screening.find({ screeningCamp: camp._id, screenedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('patient', 'patientId name age gender village phone');

    const stats = {
      totalScreened: screenings.length,
      noDR: screenings.filter((s) => s.prediction === 'No DR').length,
      mild: screenings.filter((s) => s.prediction === 'Mild').length,
      moderate: screenings.filter((s) => s.prediction === 'Moderate').length,
      severe: screenings.filter((s) => s.prediction === 'Severe').length,
      pdr: screenings.filter((s) => s.prediction === 'Proliferative DR').length,
      urgentReferrals: screenings.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
    };

    return res.status(200).json({ success: true, camp, stats, recentScreenings: screenings.slice(0, 20) });
  }

  const camp = devStore.camps.find(
    (c) =>
      c._id === id &&
      String(c.createdBy?._id || c.createdBy) === String(req.user._id)
  );
  if (!camp) return next(new ApiError(404, 'Camp not found'));

  const screenings = devStore.screenings.filter(
    (s) =>
      String(s.screeningCamp?._id || s.screeningCamp) === String(camp._id) &&
      String(s.screenedBy?._id || s.screenedBy) === String(req.user._id)
  );

  const stats = {
    totalScreened: screenings.length,
    noDR: screenings.filter((s) => s.prediction === 'No DR').length,
    mild: screenings.filter((s) => s.prediction === 'Mild').length,
    moderate: screenings.filter((s) => s.prediction === 'Moderate').length,
    severe: screenings.filter((s) => s.prediction === 'Severe').length,
    pdr: screenings.filter((s) => s.prediction === 'Proliferative DR').length,
    urgentReferrals: screenings.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
  };

  res.status(200).json({ success: true, camp, stats, recentScreenings: screenings.slice(0, 20) });
});

const updateCamp = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    const camp = await Camp.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true });
    if (!camp) return next(new ApiError(404, 'Camp not found'));
    return res.status(200).json({ success: true, camp });
  }

  const idx = devStore.camps.findIndex(
    (c) =>
      c._id === req.params.id &&
      String(c.createdBy?._id || c.createdBy) === String(req.user._id)
  );
  if (idx === -1) return next(new ApiError(404, 'Camp not found'));

  devStore.camps[idx] = { ...devStore.camps[idx], ...req.body };
  res.status(200).json({ success: true, camp: devStore.camps[idx] });
});

module.exports = {
  createCamp,
  getCamps,
  getCampById,
  updateCamp,
};
