const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Screening = require('../models/Screening');
const devStore = require('../utils/devStore');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const patientValidation = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0, max: 125 }).withMessage('Valid age between 0 and 125 is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
  body('village').trim().notEmpty().withMessage('Village/Town is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new ApiError(400, messages[0], errors.array()));
  }
  next();
};

const createPatient = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    const patientData = {
      ...req.body,
      createdBy: req.user._id,
    };
    const patient = await Patient.create(patientData);
    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient,
    });
  }

  // Dev Store
  const year = new Date().getFullYear();
  const seq = String(devStore.patients.length + 1).padStart(4, '0');
  const patientId = `PAT-${year}-${seq}`;

  const newPatient = {
    _id: 'dev_pat_' + Date.now(),
    patientId,
    ...req.body,
    createdBy: req.user._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  devStore.patients.unshift(newPatient);

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully (Dev Mode)',
    patient: newPatient,
  });
});

const getPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState === 1) {
    const query = { createdBy: req.user._id };
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { patientId: searchRegex },
        { name: searchRegex },
        { phone: searchRegex },
        { village: searchRegex },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name role organization');

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      patients,
    });
  }

  // Dev Store search - strictly isolated to authenticated user
  let filtered = devStore.patients.filter(
    (p) => String(p.createdBy?._id || p.createdBy) === String(req.user._id)
  );
  if (search) {
    const s = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.patientId?.toLowerCase().includes(s) ||
        p.phone?.includes(s) ||
        p.village?.toLowerCase().includes(s)
    );
  }

  const total = filtered.length;
  const skip = (Number(page) - 1) * Number(limit);
  const patients = filtered.slice(skip, skip + Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    patients,
  });
});

const getPatientById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (mongoose.connection.readyState === 1) {
    let patient;
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
    if (isObjectId) {
      patient = await Patient.findOne({ _id: id, createdBy: req.user._id }).populate('createdBy', 'name role organization');
    } else {
      patient = await Patient.findOne({ patientId: id, createdBy: req.user._id }).populate('createdBy', 'name role organization');
    }

    if (!patient) return next(new ApiError(404, 'Patient not found'));

    const screenings = await Screening.find({ patient: patient._id, screenedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('screenedBy', 'name role');

    return res.status(200).json({
      success: true,
      patient,
      screenings,
    });
  }

  // Dev Store - strictly isolated to authenticated user
  const patient = devStore.patients.find(
    (p) =>
      (p._id === id || p.patientId === id) &&
      String(p.createdBy?._id || p.createdBy) === String(req.user._id)
  );
  if (!patient) return next(new ApiError(404, 'Patient not found'));

  const screenings = devStore.screenings.filter(
    (s) =>
      String(s.patient?._id || s.patient) === String(patient._id) &&
      String(s.screenedBy?._id || s.screenedBy) === String(req.user._id)
  );

  res.status(200).json({
    success: true,
    patient,
    screenings,
  });
});

const updatePatient = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!patient) return next(new ApiError(404, 'Patient not found'));
    return res.status(200).json({ success: true, patient });
  }

  const idx = devStore.patients.findIndex(
    (p) =>
      p._id === req.params.id &&
      String(p.createdBy?._id || p.createdBy) === String(req.user._id)
  );
  if (idx === -1) return next(new ApiError(404, 'Patient not found'));

  devStore.patients[idx] = { ...devStore.patients[idx], ...req.body, updatedAt: new Date() };
  res.status(200).json({ success: true, patient: devStore.patients[idx] });
});

const deletePatient = asyncHandler(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!patient) return next(new ApiError(404, 'Patient not found'));
    await Screening.deleteMany({ patient: patient._id, screenedBy: req.user._id });
    return res.status(200).json({ success: true, message: 'Patient record deleted' });
  }

  const idx = devStore.patients.findIndex(
    (p) =>
      p._id === req.params.id &&
      String(p.createdBy?._id || p.createdBy) === String(req.user._id)
  );
  if (idx === -1) return next(new ApiError(404, 'Patient not found'));

  devStore.patients.splice(idx, 1);
  devStore.screenings = devStore.screenings.filter(
    (s) =>
      !(
        String(s.screenedBy?._id || s.screenedBy) === String(req.user._id) &&
        String(s.patient?._id || s.patient) === String(req.params.id)
      )
  );
  res.status(200).json({ success: true, message: 'Patient record deleted' });
});

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  patientValidation,
  checkValidation,
};
