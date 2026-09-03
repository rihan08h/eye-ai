const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    screening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screening',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'MODERATE', 'HIGH', 'URGENT'],
      required: true,
      default: 'HIGH',
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Appointment Scheduled', 'Completed', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    hospitalName: {
      type: String,
      trim: true,
      default: 'District Eye Hospital',
    },
    appointmentDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    doctorFeedback: {
      type: String,
      trim: true,
    },
    finalDiagnosis: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ priority: 1, status: 1 });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
