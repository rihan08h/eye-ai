const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const devStore = require('../utils/devStore');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, sendTokenCookie } = require('../middleware/auth.middleware');

// ─── Validation Rules ──────────────────────────────────────────────────────

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['healthworker', 'doctor', 'admin']).withMessage('Invalid role'),
  body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new ApiError(400, messages[0], errors.array()));
  }
  next();
};

// ─── Controllers ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'healthworker', phone, organization } = req.body;

  // If MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'An account with this email already exists.'));
    }

    const user = await User.create({ name, email, password, role, phone, organization });
    const token = signToken(user._id);
    sendTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  }

  // In-Memory Dev fallback
  const existingDevUser = devStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingDevUser) {
    return next(new ApiError(409, 'An account with this email already exists.'));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newDevUser = {
    _id: 'dev_user_' + Date.now(),
    name,
    email,
    password: passwordHash,
    role,
    phone,
    organization,
    isActive: true,
    createdAt: new Date(),
  };

  devStore.users.push(newDevUser);

  const token = signToken(newDevUser._id);
  sendTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully (In-Memory Dev Mode).',
    user: {
      _id: newDevUser._id,
      name: newDevUser.name,
      email: newDevUser.email,
      role: newDevUser.role,
      phone: newDevUser.phone,
      organization: newDevUser.organization,
      createdAt: newDevUser.createdAt,
    },
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // If MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    if (!user.isActive) {
      return next(new ApiError(401, 'Your account has been deactivated.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: user.organization,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  }

  // In-Memory Dev fallback
  const user = devStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password.'));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password.'));
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully (Dev Mode).',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
      lastLogin: new Date(),
      createdAt: user.createdAt,
    },
  });
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      organization: req.user.organization,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  registerValidation,
  loginValidation,
  checkValidation,
};
