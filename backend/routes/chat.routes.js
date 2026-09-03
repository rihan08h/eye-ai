const express = require('express');
const router = express.Router();

const { handleChat } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', handleChat);

module.exports = router;
