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
    const [
      totalPatients,
      totalScreenings,
      screeningsToday,
      highRiskCases,
      pendingReferrals,
      completedReferrals,
    ] = await Promise.all([
      Patient.countDocuments(),
      Screening.countDocuments(),
      Screening.countDocuments({ createdAt: { $gte: todayStart } }),
      Screening.countDocuments({ riskLevel: { $in: ['high', 'critical'] } }),
      Referral.countDocuments({ status: 'Pending' }),
      Referral.countDocuments({ status: 'Completed' }),
    ]);

    const severityAggregation = await Screening.aggregate([
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

    // Real 7-day trend from Mongo
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDbScreenings = await Screening.find({ createdAt: { $gte: sevenDaysAgo } });
    const screeningsOverTime = build7DayTrend(recentDbScreenings);

    // Real village distribution from Mongo
    const villageAgg = await Patient.aggregate([
      { $match: { village: { $exists: true, $ne: '' } } },
      { $group: { _id: '$village', patients: { $sum: 1 } } },
      { $sort: { patients: -1 } },
      { $limit: 10 },
    ]);
    const villageDistribution = villageAgg.map((item) => ({
      village: item._id,
      patients: item.patients,
    }));

    const recentScreenings = await Screening.find().sort({ createdAt: -1 }).limit(5).populate('patient');
    const urgentCases = await Screening.find({
      riskLevel: { $in: ['high', 'critical'] },
      referralCreated: false,
    }).sort({ createdAt: -1 }).limit(5).populate('patient');

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

  // Dev Store — 100% computed dynamically from actual created records
  const totalPatients = devStore.patients.length;
  const totalScreenings = devStore.screenings.length;
  const screeningsToday = devStore.screenings.filter((s) => new Date(s.createdAt) >= todayStart).length;
  const highRiskCases = devStore.screenings.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
  const pendingReferrals = devStore.referrals.filter((r) => r.status === 'Pending').length;
  const completedReferrals = devStore.referrals.filter((r) => r.status === 'Completed').length;

  const severityMap = { 'No DR': 0, Mild: 0, Moderate: 0, Severe: 0, 'Proliferative DR': 0 };
  devStore.screenings.forEach((s) => {
    if (s.prediction && severityMap[s.prediction] !== undefined) severityMap[s.prediction]++;
  });

  const severityDistribution = Object.keys(severityMap).map((name) => ({
    name,
    count: severityMap[name],
    percentage: totalScreenings > 0 ? Math.round((severityMap[name] / totalScreenings) * 100) : 0,
  }));

  const screeningsOverTime = build7DayTrend(devStore.screenings);
  const villageDistribution = buildVillageDistribution(devStore.patients);

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
    recentScreenings: devStore.screenings.slice(0, 5),
    urgentCases: devStore.screenings.filter((s) => (s.riskLevel === 'high' || s.riskLevel === 'critical') && !s.referralCreated),
  });
});

module.exports = {
  getDashboardAnalytics,
};
