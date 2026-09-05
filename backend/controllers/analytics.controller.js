const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Screening = require('../models/Screening');
const Referral = require('../models/Referral');
const devStore = require('../utils/devStore');
const asyncHandler = require('../utils/asyncHandler');

function build7DayTrend(screenings) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayScreenings = screenings.filter((s) => {
      const created = new Date(s.createdAt);
      return created >= d && created < nextD;
    });

    const highRisk = dayScreenings.filter(
      (s) => s.riskLevel === 'high' || s.riskLevel === 'critical'
    ).length;

    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({
      date: label,
      screenings: dayScreenings.length,
      highRisk,
    });
  }
  return days;
}

function buildVillageDistribution(patients) {
  const map = {};
  patients.forEach((p) => {
    const v = p.village?.trim();
    if (v) {
      map[v] = (map[v] || 0) + 1;
    }
  });
  return Object.keys(map)
    .map((village) => ({ village, patients: map[village] }))
    .sort((a, b) => b.patients - a.patients)
    .slice(0, 10);
}

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (mongoose.connection.readyState === 1) {
    const userId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? new mongoose.Types.ObjectId(req.user._id)
      : req.user._id;

    const [
      totalPatients,
      totalScreenings,
      screeningsToday,
      highRiskCases,
      pendingReferrals,
      completedReferrals,
    ] = await Promise.all([
      Patient.countDocuments({ createdBy: req.user._id }),
      Screening.countDocuments({ screenedBy: req.user._id }),
      Screening.countDocuments({ screenedBy: req.user._id, createdAt: { $gte: todayStart } }),
      Screening.countDocuments({ screenedBy: req.user._id, riskLevel: { $in: ['high', 'critical'] } }),
      Referral.countDocuments({ createdBy: req.user._id, status: 'Pending' }),
      Referral.countDocuments({ createdBy: req.user._id, status: 'Completed' }),
    ]);

    const severityAggregation = await Screening.aggregate([
      { $match: { screenedBy: userId } },
      { $group: { _id: '$prediction', count: { $sum: 1 } } },
    ]);

    const severityMap = { 'No DR': 0, Mild: 0, Moderate: 0, Severe: 0, 'Proliferative DR': 0 };
    severityAggregation.forEach((item) => {
      if (item._id && severityMap[item._id] !== undefined) severityMap[item._id] = item.count;
    });

    const severityDistribution = Object.keys(severityMap).map((name) => ({
      name,
      count: severityMap[name],
      percentage: totalScreenings > 0 ? Math.round((severityMap[name] / totalScreenings) * 100) : 0,
    }));

    // Real 7-day trend from Mongo for this user
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDbScreenings = await Screening.find({
      screenedBy: req.user._id,
      createdAt: { $gte: sevenDaysAgo },
    });
    const screeningsOverTime = build7DayTrend(recentDbScreenings);

    // Real village distribution from Mongo for this user
    const villageAgg = await Patient.aggregate([
      { $match: { createdBy: userId, village: { $exists: true, $ne: '' } } },
      { $group: { _id: '$village', patients: { $sum: 1 } } },
      { $sort: { patients: -1 } },
      { $limit: 10 },
    ]);
    const villageDistribution = villageAgg.map((item) => ({
      village: item._id,
      patients: item.patients,
    }));

    const recentScreenings = await Screening.find({ screenedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient');

    const urgentCases = await Screening.find({
      screenedBy: req.user._id,
      riskLevel: { $in: ['high', 'critical'] },
      referralCreated: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient');

    return res.status(200).json({
      success: true,
      totalPatients,
      totalScreenings,
      screeningsToday,
      highRiskCases,
      pendingReferrals,
      completedReferrals,
      severityDistribution,
      screeningsOverTime,
      villageDistribution,
      referralDistribution: [
        { status: 'Pending', count: pendingReferrals },
        { status: 'Completed', count: completedReferrals },
      ],
      recentScreenings,
      urgentCases,
    });
  }

  // Dev Store — computed dynamically strictly for current authenticated user
  const userPatients = devStore.patients.filter(
    (p) => String(p.createdBy?._id || p.createdBy) === String(req.user._id)
  );
  const userScreenings = devStore.screenings.filter(
    (s) => String(s.screenedBy?._id || s.screenedBy) === String(req.user._id)
  );
  const userReferrals = devStore.referrals.filter(
    (r) => String(r.createdBy?._id || r.createdBy) === String(req.user._id)
  );

  const totalPatients = userPatients.length;
  const totalScreenings = userScreenings.length;
  const screeningsToday = userScreenings.filter((s) => new Date(s.createdAt) >= todayStart).length;
  const highRiskCases = userScreenings.filter(
    (s) => s.riskLevel === 'high' || s.riskLevel === 'critical'
  ).length;
  const pendingReferrals = userReferrals.filter((r) => r.status === 'Pending').length;
  const completedReferrals = userReferrals.filter((r) => r.status === 'Completed').length;

  const severityMap = { 'No DR': 0, Mild: 0, Moderate: 0, Severe: 0, 'Proliferative DR': 0 };
  userScreenings.forEach((s) => {
    if (s.prediction && severityMap[s.prediction] !== undefined) severityMap[s.prediction]++;
  });

  const severityDistribution = Object.keys(severityMap).map((name) => ({
    name,
    count: severityMap[name],
    percentage: totalScreenings > 0 ? Math.round((severityMap[name] / totalScreenings) * 100) : 0,
  }));

  const screeningsOverTime = build7DayTrend(userScreenings);
  const villageDistribution = buildVillageDistribution(userPatients);

  res.status(200).json({
    success: true,
    totalPatients,
    totalScreenings,
    screeningsToday,
    highRiskCases,
    pendingReferrals,
    completedReferrals,
    severityDistribution,
    screeningsOverTime,
    villageDistribution,
    referralDistribution: [
      { status: 'Pending', count: pendingReferrals },
      { status: 'Completed', count: completedReferrals },
    ],
    recentScreenings: userScreenings.slice(0, 5),
    urgentCases: userScreenings.filter(
      (s) => (s.riskLevel === 'high' || s.riskLevel === 'critical') && !s.referralCreated
    ),
  });
});

module.exports = {
  getDashboardAnalytics,
};
