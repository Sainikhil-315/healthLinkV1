const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.js');
const { validate, registerSchema, loginSchema } = require('../utils/validators.js');
const { 
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput
} = require('../middleware/validator.js');

const {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (any role)
 * @access  Public
 */
router.post(
  '/register',
  sanitizeInput,
  validate(registerSchema),
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  sanitizeInput,
  validate(loginSchema),
  login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP for verification
 * @access  Private
 */
router.post(
  '/send-otp',
  authenticate,
  validatePhone,
  sendOTP
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP
 * @access  Private
 */
router.post(
  '/verify-otp',
  authenticate,
  verifyOTP
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset link
 * @access  Public
 */
router.post(
  '/forgot-password',
  sanitizeInput,
  validateEmail,
  forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password/:token',
  sanitizeInput,
  validatePassword,
  resetPassword
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password (logged in user)
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  sanitizeInput,
  validatePassword,
  changePassword
);

module.exports = router;