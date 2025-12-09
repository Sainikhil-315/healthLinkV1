const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { userOnly, responderOnly, adminOnly } = require('../middleware/roleCheck.js');
const { validate, createEmergencySchema } = require('../utils/validators.js');
const {
  validateLocation,
  validateTriage,
  validateObjectId,
  sanitizeInput
} = require('../middleware/validator.js');
const { uploadSingle, imagesOnly } = require('../middleware/uploadMiddleware.js');

const {
  createEmergency,
  getEmergency,
  getMyEmergencies,
  getAllEmergencies,
  updateEmergencyStatus,
  cancelEmergency,
  resolveEmergency,
  acceptEmergencyRequest,
  declineEmergencyRequest,
  getEmergencyTracking,
  getEmergencyTimeline,
  rateResponder,
  getNearbyEmergencies
} = require('../controllers/emergencyController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/emergency/create
 * @desc    Create emergency (SOS or Bystander)
 * @access  Private (User)
 */
router.post(
  '/create',
  authenticate,
  userOnly,
  uploadSingle('photo'),
  imagesOnly,
  sanitizeInput,
  validate(createEmergencySchema),
  createEmergency
);

/**
 * @route   GET /api/v1/emergency/:id
 * @desc    Get emergency details
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getEmergency
);

/**
 * @route   GET /api/v1/emergency/my/all
 * @desc    Get my emergencies (as patient or reporter)
 * @access  Private (User)
 */
router.get(
  '/my/all',
  authenticate,
  userOnly,
  getMyEmergencies
);

/**
 * @route   GET /api/v1/emergency
 * @desc    Get all emergencies (admin or responders)
 * @access  Private (Admin/Responders)
 */
router.get(
  '/',
  authenticate,
  getAllEmergencies
);

/**
 * @route   GET /api/v1/emergency/nearby/active
 * @desc    Get nearby active emergencies (for responders)
 * @access  Private (Responders)
 */
router.get(
  '/nearby/active',
  authenticate,
  responderOnly,
  validateLocation,
  getNearbyEmergencies
);

/**
 * @route   PUT /api/v1/emergency/:id/status
 * @desc    Update emergency status
 * @access  Private (Responders)
 */
router.put(
  '/:id/status',
  authenticate,
  responderOnly,
  validateObjectId('id'),
  sanitizeInput,
  updateEmergencyStatus
);

/**
 * @route   POST /api/v1/emergency/:id/cancel
 * @desc    Cancel emergency
 * @access  Private (User/Admin)
 */
router.post(
  '/:id/cancel',
  authenticate,
  validateObjectId('id'),
  sanitizeInput,
  cancelEmergency
);

/**
 * @route   POST /api/v1/emergency/:id/resolve
 * @desc    Mark emergency as resolved
 * @access  Private (Responders)
 */
router.post(
  '/:id/resolve',
  authenticate,
  responderOnly,
  validateObjectId('id'),
  sanitizeInput,
  resolveEmergency
);

/**
 * @route   POST /api/v1/emergency/:id/accept
 * @desc    Accept emergency request (for responders)
 * @access  Private (Responders)
 */
router.post(
  '/:id/accept',
  authenticate,
  responderOnly,
  validateObjectId('id'),
  acceptEmergencyRequest
);

/**
 * @route   POST /api/v1/emergency/:id/decline
 * @desc    Decline emergency request
 * @access  Private (Responders)
 */
router.post(
  '/:id/decline',
  authenticate,
  responderOnly,
  validateObjectId('id'),
  sanitizeInput,
  declineEmergencyRequest
);

/**
 * @route   GET /api/v1/emergency/:id/tracking
 * @desc    Get live tracking data for emergency
 * @access  Private
 */
router.get(
  '/:id/tracking',
  authenticate,
  validateObjectId('id'),
  getEmergencyTracking
);

/**
 * @route   GET /api/v1/emergency/:id/timeline
 * @desc    Get emergency timeline
 * @access  Private
 */
router.get(
  '/:id/timeline',
  authenticate,
  validateObjectId('id'),
  getEmergencyTimeline
);

/**
 * @route   POST /api/v1/emergency/:id/rate
 * @desc    Rate responder after emergency
 * @access  Private (User)
 */
router.post(
  '/:id/rate',
  authenticate,
  userOnly,
  validateObjectId('id'),
  sanitizeInput,
  rateResponder
);

module.exports = router;