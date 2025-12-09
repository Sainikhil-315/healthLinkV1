// middleware/auth.js

const jwt = require('jsonwebtoken');
const { AUTH_ERRORS, createError } = require('../utils/errorMessages.js');
const logger = require('../utils/logger.js');

/**
 * Verify JWT token and attach user to request
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
async function authenticate(req, res, next) {
  try {
    console.log('Authenticating user...');
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createError(AUTH_ERRORS.TOKEN_MISSING));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createError(AUTH_ERRORS.TOKEN_MISSING));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    console.log('User authenticated:', req.user);
    logger.debug(`User authenticated: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(createError(AUTH_ERRORS.TOKEN_EXPIRED));
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(createError(AUTH_ERRORS.TOKEN_INVALID));
    }

    return res.status(401).json(createError(AUTH_ERRORS.TOKEN_INVALID));
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and guest users
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // If token is invalid, just treat as unauthenticated
    req.user = null;
    next();
  }
}

/**
 * Generate JWT token
 * @param {object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiry time
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Generate refresh token (longer expiry)
 * @param {object} payload - Token payload
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { 
    expiresIn: '30d' 
  });
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} Decoded token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
}

// ✅ CommonJS export
module.exports = {
  authenticate,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};
