const express = require('express');
const router = express.Router();

const {
  createReview,
  getReviewQueue,
  getReviewsForScreening,
  getAgreementStats,
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);

// Recording a clinical assessment is restricted to clinicians. A health
// worker can capture and view screenings but cannot sign off on one.
router.post('/', allowRoles('doctor', 'admin'), createReview);

router.get('/queue', allowRoles('doctor', 'admin'), getReviewQueue);
router.get('/agreement', allowRoles('doctor', 'admin'), getAgreementStats);

// Readable by anyone authenticated who can already see the screening.
router.get('/screening/:screeningId', getReviewsForScreening);

module.exports = router;
