const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const devStore = require('../utils/devStore');
const { isDevStoreAllowed } = require('../config/env');

/**
 * Generates a signed JWT token.
 */
const signToken = (userId) => {
  // No fallback secret. The previous default, 'dev_secret_key_123', is in this
  // repository's public history — signing with it lets anyone forge any token,
  // including an admin one. config/env.js refuses to start without a real
  // JWT_SECRET, so reaching this line without one is a bug worth crashing on.
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured; refusing to sign a token.');
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Sets the JWT as an httpOnly cookie and returns user info.
 */
const sendTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    // The SPA is typically served from a different origin than the API in
    // production, and 'lax' cookies are not sent on cross-site XHR — login
    // would appear to succeed and then every subsequent request would 401.
    // 'none' requires Secure, which is why it is tied to the same flag.
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie('token', token, cookieOptions);
};

/**
 * Verifies the JWT from the httpOnly cookie.
 * Attaches req.user if valid.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(new ApiError(401, 'You are not logged in. Please log in to continue.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Your session has expired. Please log in again.'));
      }
      return next(new ApiError(401, 'Invalid authentication token. Please log in again.'));
    }

    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id);
    } else if (isDevStoreAllowed()) {
      user = devStore.users.find((u) => String(u._id) === String(decoded.id));
    } else {
      // Production with no database. Authenticating against the seeded
      // in-memory accounts here would mean a database outage silently grants
      // anyone admin access with a published password. Fail closed instead.
      return next(
        new ApiError(503, 'The service is temporarily unavailable. Please try again shortly.')
      );
    }

    if (!user || user.isActive === false) {
      return next(new ApiError(401, 'Account no longer exists or has been deactivated.'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { signToken, sendTokenCookie, protect };
