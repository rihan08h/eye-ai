const express = require('express');
const router = express.Router();

const { getDashboardAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);

module.exports = router;
