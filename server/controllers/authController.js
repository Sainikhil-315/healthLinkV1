const User = require('../models/User.js');
const Ambulance = require('../models/Ambulance.js');
const Hospital = require('../models/Hospital.js');
const Volunteer = require('../models/Volunteer.js');
const Donor = require('../models/Donor.js');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth.js');
const { sendVerificationEmail, sendPasswordResetEmail, sendUserWelcomeEmail } = require('../services/emailService.js');
const { AUTH_ERRORS, USER_ERRORS, createError } = require('../utils/errorMessages.js');
const { USER_ROLES } = require('../utils/constants.js');
const logger = require('../utils/logger.js');
const crypto = require('crypto');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
async function register(req, res) {
  try {
    console.log('Register request body:', req.body);
    const { name, email, phone, password, role, bloodGroup, emergencyContacts } = req.body;

    // Select model based on role
    let Model = User;
    let userData = { fullName: name, email, phone, password };

    switch (role) {
      case USER_ROLES.USER:
        if (bloodGroup) {
          userData.healthProfile = { bloodType: bloodGroup };
        }
        if (emergencyContacts) {
          userData.emergencyContacts = emergencyContacts;
        }
        break;

      case USER_ROLES.AMBULANCE:
        Model = Ambulance;
        // Ambulance registration handled separately
        return res.status(400).json({
          success: false,
          message: 'Please use /ambulances/register endpoint for ambulance registration'
        });

      case USER_ROLES.HOSPITAL:
        Model = Hospital;
        return res.status(400).json({
          success: false,
          message: 'Please use /hospitals/register endpoint for hospital registration'
        });

      case USER_ROLES.VOLUNTEER:
        Model = Volunteer;
        return res.status(400).json({
          success: false,
          message: 'Please use /volunteers/register endpoint for volunteer registration'
        });

      case USER_ROLES.DONOR:
        Model = Donor;
        return res.status(400).json({
          success: false,
          message: 'Please use /donors/register endpoint for donor registration'
        });

      default:
        Model = User;
    }

    // Check if user already exists
    const existingUser = await Model.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json(createError(USER_ERRORS.ALREADY_EXISTS));
      }
      return res.status(409).json(createError(USER_ERRORS.PHONE_EXISTS));
    }

    // Create user
    const user = await Model.create(userData);

    // Generate OTP for phone verification
    const otp = user.generateOTP();
    await user.save();

    // Send welcome email
    await sendUserWelcomeEmail(user, role || 'user');

    // Send verification email with OTP
    await sendVerificationEmail(user, otp);

    // Generate tokens
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: role || 'user'
    });
    const refreshToken = generateRefreshToken({ id: user._id });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your account.',
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          role: role || 'user',
          isVerified: false
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Try to find user in all models
    let user = null;
    let userRole = null;

    const models = [
      { Model: User, role: USER_ROLES.USER },
      { Model: Ambulance, role: USER_ROLES.AMBULANCE },
      { Model: Hospital, role: USER_ROLES.HOSPITAL },
      { Model: Volunteer, role: USER_ROLES.VOLUNTEER },
      { Model: Donor, role: USER_ROLES.DONOR }
    ];

    for (const { Model, role } of models) {
      user = await Model.findOne({ email }).select('+password');
      if (user) {
        // For User model, use user.role from DB (could be 'admin' or 'user')
        userRole = (Model === User) ? user.role : role;
        break;
      }
    }

    if (!user) {
      return res.status(401).json(createError(AUTH_ERRORS.INVALID_CREDENTIALS));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(createError(AUTH_ERRORS.INVALID_CREDENTIALS));
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json(createError(AUTH_ERRORS.ACCOUNT_SUSPENDED));
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: userRole
    });
    const refreshToken = generateRefreshToken({ id: user._id });

    logger.info(`User logged in: ${email} (${userRole})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.fullName || user.name,
          email: user.email,
          phone: user.phone,
          role: userRole,
          isVerified: user.isVerified || user.isPhoneVerified
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
async function logout(req, res) {
  try {
    // In a more advanced system, you'd invalidate the token here
    // For now, just return success (client removes token)

    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Select model based on role
    let Model = User;
    switch (userRole) {
      case USER_ROLES.AMBULANCE:
        Model = Ambulance;
        break;
      case USER_ROLES.HOSPITAL:
        Model = Hospital;
        break;
      case USER_ROLES.VOLUNTEER:
        Model = Volunteer;
        break;
      case USER_ROLES.DONOR:
        Model = Donor;
        break;
    }

    const user = await Model.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json(createError(AUTH_ERRORS.TOKEN_MISSING));
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Generate new access token
    const newToken = generateToken({
      id: user._id,
      email: user.email,
      role: 'user'
    });

    res.status(200).json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json(createError(AUTH_ERRORS.TOKEN_INVALID));
  }
};

/**
 * @desc    Send OTP for verification
 * @route   POST /api/v1/auth/send-otp
 * @access  Private
 */
async function sendOTP(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    await sendVerificationEmail(user, otp);

    logger.info(`OTP sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Private
 */
async function verifyOTP(req, res) {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark as verified
    user.isPhoneVerified = true;
    user.isEmailVerified = true;
    user.otp = undefined;
    await user.save();

    logger.info(`User verified: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully'
    });

  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
};

/**
 * @desc    Send password reset link
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`Password reset email sent to ${email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

/**
 * @desc    Change password (logged in user)
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  changePassword,
}