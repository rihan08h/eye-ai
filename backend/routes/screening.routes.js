const express = require('express');
const router = express.Router();

const {
  createScreening,
  getScreenings,
  getScreeningById,
  getPatientScreenings,
} = require('../controllers/screening.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router
  .route('/')
  .post(upload.single('image'), createScreening)
  .get(getScreenings);

router.route('/:id').get(getScreeningById);

router.route('/patient/:patientId').get(getPatientScreenings);

module.exports = router;
