const express = require('express');
const router = express.Router();

const {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferralStatus,
} = require('../controllers/referral.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').post(createReferral).get(getReferrals);
router.route('/:id').get(getReferralById);
router.route('/:id/status').patch(updateReferralStatus);

module.exports = router;
