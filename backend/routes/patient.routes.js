const express = require('express');
const router = express.Router();

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  patientValidation,
  checkValidation,
} = require('../controllers/patient.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

// All patient endpoints require login
router.use(protect);

router
  .route('/')
  .post(patientValidation, checkValidation, createPatient)
  .get(getPatients);

router
  .route('/:id')
  .get(getPatientById)
  .put(patientValidation, checkValidation, updatePatient)
  .delete(deletePatient);

module.exports = router;
