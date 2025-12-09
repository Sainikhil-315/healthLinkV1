const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { ambulanceOnly, adminOnly } = require('../middleware/roleCheck.js');
const { validate, registerAmbulanceSchema, updateAmbulanceLocationSchema, updateAmbulanceStatusSchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  sanitizeInput
} = require('../middleware/validator.js');

const {
  registerAmbulance,
  getAmbulanceProfile,
  updateAmbulanceProfile,
  updateAmbulanceLocation,
  updateAmbulanceStatus,
  getAvailableAmbulances,
  getCurrentTrip,
  getTripHistory,
  acceptTrip,
  startTrip,
  completeTrip,
  getAmbulanceStats
} = require('../controllers/ambulanceController.js');


const router = express.Router();

/**
 * @route   POST /api/v1/ambulances/register
 * @desc    Register new ambulance
 * @access  Public
 */
router.post(
  '/register',
  sanitizeInput,
  validate(registerAmbulanceSchema),
  registerAmbulance
);

/**
 * @route   GET /api/v1/ambulances/profile
 * @desc    Get ambulance profile
 * @access  Private (Ambulance)
 */
router.get(
  '/profile',
  authenticate,
  ambulanceOnly,
  getAmbulanceProfile
);

/**
 * @route   GET /api/v1/ambulances/:id
 * @desc    Get ambulance by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getAmbulanceProfile
);

/**
 * @route   PUT /api/v1/ambulances/profile
 * @desc    Update ambulance profile
 * @access  Private (Ambulance)
 */
router.put(
  '/profile',
  authenticate,
  ambulanceOnly,
  sanitizeInput,
  updateAmbulanceProfile
);

/**
 * @route   PUT /api/v1/ambulances/location
 * @desc    Update ambulance location (real-time)
 * @access  Private (Ambulance)
 */
router.put(
  '/location',
  authenticate,
  ambulanceOnly,
  validate(updateAmbulanceLocationSchema),
  updateAmbulanceLocation
);

/**
 * @route   PUT /api/v1/ambulances/status
 * @desc    Update ambulance status
 * @access  Private (Ambulance)
 */
router.put(
  '/status',
  authenticate,
  ambulanceOnly,
  validate(updateAmbulanceStatusSchema),
  updateAmbulanceStatus
);

/**
 * @route   GET /api/v1/ambulances/available/nearby
 * @desc    Get available ambulances nearby
 * @access  Private
 */
router.get(
  '/available/nearby',
  authenticate,
  validateLocation,
  getAvailableAmbulances
);

/**
 * @route   GET /api/v1/ambulances/trip/current
 * @desc    Get current trip
 * @access  Private (Ambulance)
 */
router.get(
  '/trip/current',
  authenticate,
  ambulanceOnly,
  getCurrentTrip
);

/**
 * @route   GET /api/v1/ambulances/trip/history
 * @desc    Get trip history
 * @access  Private (Ambulance)
 */
router.get(
  '/trip/history',
  authenticate,
  ambulanceOnly,
  getTripHistory
);

/**
 * @route   POST /api/v1/ambulances/trip/:incidentId/accept
 * @desc    Accept trip request
 * @access  Private (Ambulance)
 */
router.post(
  '/trip/:incidentId/accept',
  authenticate,
  ambulanceOnly,
  validateObjectId('incidentId'),
  acceptTrip
);

/**
 * @route   POST /api/v1/ambulances/trip/:incidentId/start
 * @desc    Start trip (picked up patient)
 * @access  Private (Ambulance)
 */
router.post(
  '/trip/:incidentId/start',
  authenticate,
  ambulanceOnly,
  validateObjectId('incidentId'),
  startTrip
);

/**
 * @route   POST /api/v1/ambulances/trip/:incidentId/complete
 * @desc    Complete trip (reached hospital)
 * @access  Private (Ambulance)
 */
router.post(
  '/trip/:incidentId/complete',
  authenticate,
  ambulanceOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  completeTrip
);

/**
 * @route   GET /api/v1/ambulances/stats
 * @desc    Get ambulance statistics
 * @access  Private (Ambulance)
 */
router.get(
  '/stats',
  authenticate,
  ambulanceOnly,
  getAmbulanceStats
);

module.exports = router;