const mongoose = require('mongoose');

// Auto-generate human-readable Patient ID (e.g. PAT-2026-0001)
const generatePatientId = async () => {
  const year = new Date().getFullYear();
  const count = await mongoose.model('Patient').countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `PAT-${year}-${sequence}`;
};

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [125, 'Please enter a valid age'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Please enter a valid 10-digit Indian mobile number',
      },
    },
    village: {
      type: String,
      required: [true, 'Village/Town is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Karnataka',
    },
    diabetesDuration: {
      type: String,
      enum: ['< 1 year', '1-5 years', '5-10 years', '10+ years', 'Unknown'],
      default: 'Unknown',
    },
    knownDiabetic: {
      type: Boolean,
      default: true,
    },
    previousEyeProblems: {
      type: String,
      trim: true,
      default: 'None',
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    screeningCamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate sequential patientId
patientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    this.patientId = await generatePatientId();
  }
  next();
});

// Full text index for search
patientSchema.index({ name: 'text', village: 'text', district: 'text', patientId: 'text' });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
