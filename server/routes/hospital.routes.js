const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { hospitalOnly } = require('../middleware/roleCheck.js');
const { validate, registerHospitalSchema, updateHospitalBedsSchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  sanitizeInput,
} = require('../middleware/validator.js');

const {
  registerHospital,
  getHospitalProfile,
  updateHospitalProfile,
  updateBedAvailability,
  getIncomingPatients,
  confirmPatientArrival,
  getAvailableHospitals,
  searchHospitals,
  getHospitalStats,
  getPatientHistory,
} = require('../controllers/hospitalController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/hospitals/register
 * @desc    Register new hospital
 * @access  Public
 */
router.post(
  '/register',
  sanitizeInput,
  validate(registerHospitalSchema),
  registerHospital,
);

/**
 * @route   GET /api/v1/hospitals/profile
 * @desc    Get hospital profile
 * @access  Private (Hospital)
 */
router.get('/profile', authenticate, hospitalOnly, getHospitalProfile);

/**
 * @route   PUT /api/v1/hospitals/profile
 * @desc    Update hospital profile
 * @access  Private (Hospital)
 */
router.put(
  '/profile',
  authenticate,
  hospitalOnly,
  sanitizeInput,
  updateHospitalProfile,
);

/**
 * @route   PUT /api/v1/hospitals/beds
 * @desc    Update bed availability
 * @access  Private (Hospital)
 */
router.put(
  '/beds',
  authenticate,
  hospitalOnly,
  sanitizeInput,
  validate(updateHospitalBedsSchema),
  updateBedAvailability,
);

/**
 * @route   GET /api/v1/hospitals/stats
 * @desc    Get hospital statistics
 * @access  Private (Hospital)
 * @note    MUST be before /:id route to avoid matching "stats" as an ID
 */
router.get('/stats', authenticate, hospitalOnly, getHospitalStats);

/**
 * @route   GET /api/v1/hospitals/patient-history
 * @desc    Get patient history with date filtering
 * @access  Private (Hospital)
 * @note    MUST be before /:id route to avoid matching "patient-history" as an ID
 */
router.get('/patient-history', authenticate, hospitalOnly, getPatientHistory);

/**
 * @route   GET /api/v1/hospitals/patients/incoming
 * @desc    Get incoming patients (assigned ambulances)
 * @access  Private (Hospital)
 * @note    MUST be before /:id route to avoid matching "patients" as an ID
 */
router.get(
  '/patients/incoming',
  authenticate,
  hospitalOnly,
  getIncomingPatients,
);

/**
 * @route   POST /api/v1/hospitals/patients/:incidentId/arrived
 * @desc    Confirm patient arrival
 * @access  Private (Hospital)
 */
router.post(
  '/patients/:incidentId/arrived',
  authenticate,
  hospitalOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  confirmPatientArrival,
);

/**
 * @route   GET /api/v1/hospitals/available/nearby
 * @desc    Get available hospitals nearby
 * @access  Private
 * @note    MUST be before /:id route to avoid matching "available" as an ID
 */
router.get(
  '/available/nearby',
  authenticate,
  validateLocation,
  getAvailableHospitals,
);

/**
 * @route   GET /api/v1/hospitals/search
 * @desc    Search hospitals by name/location
 * @access  Private
 * @note    MUST be before /:id route to avoid matching "search" as an ID
 */
router.get('/search', authenticate, searchHospitals);

/**
 * @route   GET /api/v1/hospitals/:id
 * @desc    Get hospital by ID
 * @access  Private
 * @note    MUST be LAST among GET routes to avoid catching specific paths
 */
router.get('/:id', authenticate, validateObjectId('id'), getHospitalProfile);

module.exports = router;