const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  registerValidation,
  loginValidation,
  checkValidation,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', registerValidation, checkValidation, register);
router.post('/login', loginValidation, checkValidation, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
