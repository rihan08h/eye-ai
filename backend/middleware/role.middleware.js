const ApiError = require('../utils/apiError');

/**
 * Role-based access control middleware factory.
 * Usage: router.get('/admin', protect, allowRoles('admin'), handler)
 * @param {...string} roles - Allowed roles
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. This action requires one of these roles: ${roles.join(', ')}.`
        )
      );
    }
    next();
  };
};

module.exports = { allowRoles };
