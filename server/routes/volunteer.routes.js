const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { volunteerOnly, adminOnly } = require('../middleware/roleCheck.js');
const { validate, registerVolunteerSchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  sanitizeInput
} = require('../middleware/validator.js');
const { uploadSingle, pdfOnly } = require('../middleware/uploadMiddleware.js');

const {
  registerVolunteer,
  getVolunteerProfile,
  updateVolunteerProfile,
  updateVolunteerLocation,
  updateVolunteerStatus,
  getMissionHistory,
  getCurrentMission,
  acceptMission,
  arrivedAtScene,
  completeMission,
  declineMission,
  getVolunteerStats,
  uploadCertificate
} = require('../controllers/volunteerController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/volunteers/register
 * @desc    Register as volunteer
 * @access  Public
 */
router.post(
  '/register',
  sanitizeInput,
  validate(registerVolunteerSchema),
  registerVolunteer
);

/**
 * @route   GET /api/v1/volunteers/profile
 * @desc    Get volunteer profile
 * @access  Private (Volunteer)
 */
router.get(
  '/profile',
  authenticate,
  volunteerOnly,
  getVolunteerProfile
);

/**
 * @route   GET /api/v1/volunteers/:id
 * @desc    Get volunteer by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getVolunteerProfile
);

/**
 * @route   PUT /api/v1/volunteers/profile
 * @desc    Update volunteer profile
 * @access  Private (Volunteer)
 */
router.put(
  '/profile',
  authenticate,
  volunteerOnly,
  sanitizeInput,
  updateVolunteerProfile
);

/**
 * @route   PUT /api/v1/volunteers/location
 * @desc    Update volunteer location (real-time)
 * @access  Private (Volunteer)
 */
router.put(
  '/location',
  authenticate,
  volunteerOnly,
  validateLocation,
  updateVolunteerLocation
);

/**
 * @route   PUT /api/v1/volunteers/status
 * @desc    Update volunteer availability status
 * @access  Private (Volunteer)
 */
router.put(
  '/status',
  authenticate,
  volunteerOnly,
  sanitizeInput,
  updateVolunteerStatus
);

/**
 * @route   POST /api/v1/volunteers/certificate
 * @desc    Upload CPR certificate
 * @access  Private (Volunteer)
 */
router.post(
  '/certificate',
  authenticate,
  volunteerOnly,
  uploadSingle('certificate'),
  uploadCertificate
);

/**
 * @route   GET /api/v1/volunteers/mission/current
 * @desc    Get current mission
 * @access  Private (Volunteer)
 */
router.get(
  '/mission/current',
  authenticate,
  volunteerOnly,
  getCurrentMission
);

/**
 * @route   GET /api/v1/volunteers/mission/history
 * @desc    Get mission history
 * @access  Private (Volunteer)
 */
router.get(
  '/mission/history',
  authenticate,
  volunteerOnly,
  getMissionHistory
);

/**
 * @route   POST /api/v1/volunteers/mission/:incidentId/accept
 * @desc    Accept mission
 * @access  Private (Volunteer)
 */
router.post(
  '/mission/:incidentId/accept',
  authenticate,
  volunteerOnly,
  validateObjectId('incidentId'),
  acceptMission
);

/**
 * @route   POST /api/v1/volunteers/mission/:incidentId/arrived
 * @desc    Notify arrival at scene
 * @access  Private (Volunteer)
 */
router.post(
  '/mission/:incidentId/arrived',
  authenticate,
  volunteerOnly,
  validateObjectId('incidentId'),
  arrivedAtScene
);

/**
 * @route   POST /api/v1/volunteers/mission/:incidentId/complete
 * @desc    Complete mission
 * @access  Private (Volunteer)
 */
router.post(
  '/mission/:incidentId/complete',
  authenticate,
  volunteerOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  completeMission
);

/**
 * @route   POST /api/v1/volunteers/mission/:incidentId/decline
 * @desc    Decline mission
 * @access  Private (Volunteer)
 */
router.post(
  '/mission/:incidentId/decline',
  authenticate,
  volunteerOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  declineMission
);

/**
 * @route   GET /api/v1/volunteers/stats
 * @desc    Get volunteer statistics
 * @access  Private (Volunteer)
 */
router.get(
  '/stats',
  authenticate,
  volunteerOnly,
  getVolunteerStats
);

module.exports = router;