const path = require('path');
const mongoose = require('mongoose');
const Screening = require('../models/Screening');
const Patient = require('../models/Patient');
const devStore = require('../utils/devStore');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { analyzeRetinalImage } = require('../services/mlService');
const { getRiskForPrediction } = require('../config/riskConfig');

const createScreening = asyncHandler(async (req, res, next) => {
  const { patientId, eyeSide, notes, screeningCamp } = req.body;

  // An actual uploaded file is required. The previous version accepted a
  // request without one and substituted a stock Unsplash photo as the
  // patient's retinal image.
  if (!req.file) {
    return next(new ApiError(400, 'Please upload a retinal fundus image.'));
  }

  if (!patientId) {
    return next(new ApiError(400, 'Patient ID is required for screening'));
  }

  const filePath = req.file.path;
  const relativeImageUrl = `/uploads/${req.file.filename}`;

  // Throws (503/502/504) if inference cannot run. Nothing is saved on failure.
  const mlResult = await analyzeRetinalImage(filePath);

  // Ungradable images get no prediction, so no risk level is derived from one.
  const isUngradable = mlResult.status === 'ungradable';
  const riskMeta = isUngradable
    ? { riskLevel: 'low', referralRequired: false, recaptureRequired: true }
    : getRiskForPrediction(mlResult.prediction);

  const analysisFields = {
    originalImageUrl: relativeImageUrl,
    heatmapImageUrl: mlResult.heatmapUrl || '',
    analysisStatus: mlResult.status,
    prediction: mlResult.prediction,
    probabilities: mlResult.probabilities || undefined,
    confidence: mlResult.confidence,
    imageQuality: mlResult.imageQuality,
    uncertainty: mlResult.uncertainty || undefined,
    explainability: mlResult.explainability || undefined,
    riskLevel: riskMeta.riskLevel,
    referralRequired: riskMeta.referralRequired,
    modelVersion: mlResult.modelVersion,
    processingTimeMs: mlResult.processingTimeMs,
    isMock: mlResult.isMock === true,
  };

  const responseMessage = isUngradable
    ? 'Image quality is insufficient for reliable AI analysis. Please capture another retinal image.'
    : 'Screening analyzed and saved successfully';

  // If MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientId });
    }

    if (!patient) return next(new ApiError(404, 'Patient not found.'));

    const screening = await Screening.create({
      patient: patient._id,
      screenedBy: req.user._id,
      ...analysisFields,
      eyeSide: eyeSide || 'Right Eye (OD)',
      screeningCamp: screeningCamp || patient.screeningCamp,
      notes,
    });

    const populated = await Screening.findById(screening._id)
      .populate('patient')
      .populate('screenedBy', 'name role organization');

    return res.status(201).json({
      success: true,
      message: responseMessage,
      screening: populated,
      riskMeta,
    });
  }

  // Dev Store
  const patient = devStore.patients.find((p) => p._id === patientId || p.patientId === patientId);
  if (!patient) return next(new ApiError(404, 'Patient not found.'));

  const newScreening = {
    _id: 'dev_screen_' + Date.now(),
    patient,
    screenedBy: req.user,
    ...analysisFields,
    referralCreated: false,
    eyeSide: eyeSide || 'Right Eye (OD)',
    screeningCamp: screeningCamp || patient.screeningCamp,
    notes,
    createdAt: new Date(),
  };

  devStore.screenings.unshift(newScreening);

  res.status(201).json({
    success: true,
    message: responseMessage,
    screening: newScreening,
    riskMeta,
  });
});

const getScreenings = asyncHandler(async (req, res) => {
  const { riskLevel, prediction, search, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState === 1) {
    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;
    if (prediction) query.prediction = prediction;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchedPatients = await Patient.find({
        $or: [{ name: searchRegex }, { patientId: searchRegex }, { phone: searchRegex }],
      }).select('_id');
      query.patient = { $in: matchedPatients.map((p) => p._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Screening.countDocuments(query);
    const screenings = await Screening.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('patient', 'patientId name age gender village phone')
      .populate('screenedBy', 'name role');

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      screenings,
    });
  }

  // Dev Store
  let filtered = [...devStore.screenings];
  if (riskLevel) filtered = filtered.filter((s) => s.riskLevel === riskLevel);
  if (prediction) filtered = filtered.filter((s) => s.prediction === prediction);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (sc) =>
        sc.patient?.name?.toLowerCase().includes(s) ||
        sc.patient?.patientId?.toLowerCase().includes(s)
    );
  }

  const total = filtered.length;
  const skip = (Number(page) - 1) * Number(limit);
  const screenings = filtered.slice(skip, skip + Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    screenings,
  });
});

const getScreeningById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (mongoose.connection.readyState === 1) {
    const screening = await Screening.findById(id)
      .populate('patient')
      .populate('screenedBy', 'name role organization phone')
      .populate('screeningCamp', 'name location village');

    if (!screening) return next(new ApiError(404, 'Screening record not found'));

    const riskMeta = getRiskForPrediction(screening.prediction);
    return res.status(200).json({ success: true, screening, riskMeta });
  }

  // Dev Store
  const screening = devStore.screenings.find((s) => s._id === id);
  if (!screening) return next(new ApiError(404, 'Screening record not found'));

  const riskMeta = getRiskForPrediction(screening.prediction);
  res.status(200).json({ success: true, screening, riskMeta });
});

const getPatientScreenings = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;

  if (mongoose.connection.readyState === 1) {
    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ patientId });
    }

    if (!patient) return next(new ApiError(404, 'Patient not found'));

    const screenings = await Screening.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .populate('screenedBy', 'name role');

    return res.status(200).json({ success: true, patient, screenings });
  }

  const patient = devStore.patients.find((p) => p._id === patientId || p.patientId === patientId);
  if (!patient) return next(new ApiError(404, 'Patient not found'));

  const screenings = devStore.screenings.filter(
    (s) => String(s.patient?._id || s.patient) === String(patient._id)
  );

  res.status(200).json({ success: true, patient, screenings });
});

module.exports = {
  createScreening,
  getScreenings,
  getScreeningById,
  getPatientScreenings,
};
