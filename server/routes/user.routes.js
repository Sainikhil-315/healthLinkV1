const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { userOnly, adminOrOwner } = require('../middleware/roleCheck.js');
const { validate, updateProfileSchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  sanitizeInput,
} = require('../middleware/validator.js');
const {
  uploadSingle,
  imagesOnly,
} = require('../middleware/uploadMiddleware.js');

const {
  createUser,
  getUserProfile,
  updateUserProfile,
  updateLocation,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  updateHealthProfile,
  uploadProfilePicture,
  deleteAccount,
  getUserStats,
  getEmergencyContacts,
  getLocation,
  becomeDonor,
} = require('../controllers/userController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (admin creation via Postman)
 * @access  Public
 */
router.post('/', sanitizeInput, createUser);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, getUserProfile);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (User)
 */
router.get('/stats', authenticate, userOnly, getUserStats);

/**
 * @route   GET /api/v1/users/emergency-contacts
 * @desc    Get all emergency contacts
 * @access  Private (User)
 */
router.get('/emergency-contacts', authenticate, userOnly, getEmergencyContacts);

/**
 * @route   POST /api/v1/users/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private (User)
 */
router.post(
  '/emergency-contacts',
  authenticate,
  userOnly,
  sanitizeInput,
  addEmergencyContact,
);

/**
 * @route   PUT /api/v1/users/emergency-contacts/:contactId
 * @desc    Update emergency contact
 * @access  Private (User)
 */
router.put(
  '/emergency-contacts/:contactId',
  authenticate,
  userOnly,
  sanitizeInput,
  updateEmergencyContact,
);

/**
 * @route   DELETE /api/v1/users/emergency-contacts/:contactId
 * @desc    Delete emergency contact
 * @access  Private (User)
 */
router.delete(
  '/emergency-contacts/:contactId',
  authenticate,
  userOnly,
  deleteEmergencyContact,
);

/**
 * @route   PUT /api/v1/users/health-profile
 * @desc    Update health profile
 * @access  Private (User)
 */
router.put(
  '/health-profile',
  authenticate,
  userOnly,
  sanitizeInput,
  updateHealthProfile,
);

/**
 * @route   POST /api/v1/users/profile-picture
 * @desc    Upload profile picture
 * @access  Private (User)
 */
router.post(
  '/profile-picture',
  authenticate,
  userOnly,
  uploadSingle('photo'),
  imagesOnly,
  uploadProfilePicture,
);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private (User)
 */
router.delete('/account', authenticate, userOnly, deleteAccount);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, validateObjectId('id'), getUserProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private (User)
 */
router.put(
  '/profile',
  authenticate,
  userOnly,
  sanitizeInput,
  validate(updateProfileSchema),
  updateUserProfile,
);

/**
 * @route   PUT /api/v1/users/location
 * @desc    Update user location
 * @access  Private (User)
 */
router.put(
  '/location',
  authenticate,
  userOnly,
  validateLocation,
  sanitizeInput,
  updateLocation,
);

router.get('/location', authenticate, userOnly, getLocation);

/**
 * @route   PUT /api/v1/users/become-donor
 * @desc    Become a donor
 * @access  Private
 */
router.put('/become-donor', authenticate, becomeDonor);

module.exports = router;
