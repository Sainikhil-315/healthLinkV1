const { AUTH_ERRORS, createError } = require('../utils/errorMessages.js');
const { USER_ROLES } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * Check if user has required role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {function} Express middleware
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      console.log('Checking user role:', req.user);
      if (!req.user) {
        return res.status(401).json(createError(AUTH_ERRORS.UNAUTHORIZED));
      }
      const userRole = req.user.role;

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Access denied: User ${req.user.email} (${userRole}) attempted to access ${allowedRoles.join(', ')} only route`);

        return res.status(403).json(createError(
          AUTH_ERRORS.UNAUTHORIZED,
          `Access denied. This resource requires one of these roles: ${allowedRoles.join(', ')}`
        ));
      }

      logger.debug(`Role check passed: ${userRole} accessing ${allowedRoles.join(', ')} route`);
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking user permissions'
      });
    }
  };
};

/**
 * Allow only users (end users, not service providers)
 */
const userOnly = checkRole([USER_ROLES.USER]);
/**
 * Allow only ambulance drivers
 */
const ambulanceOnly = checkRole([USER_ROLES.AMBULANCE]);

/**
 * Allow only hospitals
 */
const hospitalOnly = checkRole([USER_ROLES.HOSPITAL]);

/**
 * Allow only volunteers
 */
const volunteerOnly = checkRole([USER_ROLES.VOLUNTEER]);

/**
 * Allow only blood donors
 */
const donorOnly = checkRole([USER_ROLES.DONOR]);

/**
 * Allow only admins
 */
const adminOnly = checkRole([USER_ROLES.ADMIN]);

/**
 * Allow users and service providers (not admin)
 */
const notAdmin = checkRole([
  USER_ROLES.USER,
  USER_ROLES.AMBULANCE,
  USER_ROLES.HOSPITAL,
  USER_ROLES.VOLUNTEER,
  USER_ROLES.DONOR
]);

/**
 * Allow emergency responders (ambulance, volunteer, hospital)
 */
const responderOnly = checkRole([
  USER_ROLES.AMBULANCE,
  USER_ROLES.VOLUNTEER,
  USER_ROLES.HOSPITAL
]);

/**
 * Allow all authenticated users
 */
function anyAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json(createError(AUTH_ERRORS.UNAUTHORIZED));
  }
  next();
};

/**
 * Check if user is accessing their own resource
 * @param {string} paramName - Name of the parameter containing the user ID
 */
function checkOwnership(paramName = 'id') {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createError(AUTH_ERRORS.UNAUTHORIZED));
      }

      const requestedId = req.params[paramName];
      const userId = req.user.id;

      // Admin can access any resource
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      // Check if user is accessing their own resource
      if (requestedId !== userId) {
        logger.warn(`Ownership check failed: User ${userId} tried to access ${requestedId}`);

        return res.status(403).json(createError(
          AUTH_ERRORS.UNAUTHORIZED,
          'You can only access your own resources'
        ));
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Check if user has multiple possible roles
 * @param {string[]} roles - Array of acceptable roles
 */
function hasAnyRole(roles) {
  return checkRole(roles);
};

/**
 * Combine role check with ownership check
 * Allows admin OR resource owner to access
 */
function adminOrOwner(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createError(AUTH_ERRORS.UNAUTHORIZED));
    }

    // Admin can access anything
    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    // Otherwise check ownership
    const requestedId = req.params[paramName];
    const userId = req.user.id;

    if (requestedId !== userId) {
      return res.status(403).json(createError(
        AUTH_ERRORS.UNAUTHORIZED,
        'Access denied'
      ));
    }

    next();
  };
};

module.exports = {
  checkRole,
  userOnly,
  ambulanceOnly,
  hospitalOnly,
  volunteerOnly,
  donorOnly,
  adminOnly,
  notAdmin,
  responderOnly,
  anyAuthenticated,
  checkOwnership,
  hasAnyRole,
  adminOrOwner
};