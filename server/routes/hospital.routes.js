const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { hospitalOnly, adminOnly } = require('../middleware/roleCheck.js');
const { validate, registerHospitalSchema, updateHospitalBedsSchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  sanitizeInput
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
  getHospitalStats
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
  registerHospital
);

/**
 * @route   GET /api/v1/hospitals/profile
 * @desc    Get hospital profile
 * @access  Private (Hospital)
 */
router.get(
  '/profile',
  authenticate,
  hospitalOnly,
  getHospitalProfile
);

/**
 * @route   GET /api/v1/hospitals/:id
 * @desc    Get hospital by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getHospitalProfile
);

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
  updateHospitalProfile
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
  validate(updateHospitalBedsSchema),
  updateBedAvailability
);

/**
 * @route   GET /api/v1/hospitals/patients/incoming
 * @desc    Get incoming patients (assigned ambulances)
 * @access  Private (Hospital)
 */
router.get(
  '/patients/incoming',
  authenticate,
  hospitalOnly,
  getIncomingPatients
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
  confirmPatientArrival
);

/**
 * @route   GET /api/v1/hospitals/available/nearby
 * @desc    Get available hospitals nearby
 * @access  Private
 */
router.get(
  '/available/nearby',
  authenticate,
  validateLocation,
  getAvailableHospitals
);

/**
 * @route   GET /api/v1/hospitals/search
 * @desc    Search hospitals by name/location
 * @access  Private
 */
router.get(
  '/search',
  authenticate,
  searchHospitals
);

/**
 * @route   GET /api/v1/hospitals/stats
 * @desc    Get hospital statistics
 * @access  Private (Hospital)
 */
router.get(
  '/stats',
  authenticate,
  hospitalOnly,
  getHospitalStats
);

module.exports = router;