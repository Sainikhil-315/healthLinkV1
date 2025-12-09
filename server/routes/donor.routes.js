const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { donorOnly, adminOnly } = require('../middleware/roleCheck.js');
const { validate, registerDonorSchema, updateDonorAvailabilitySchema } = require('../utils/validators.js');
const {
  validateObjectId,
  validateLocation,
  validateBloodGroup,
  sanitizeInput
} = require('../middleware/validator.js');

const {
  registerDonor,
  getDonorProfile,
  updateDonorProfile,
  updateDonorLocation,
  updateDonorStatus,
  getDonationHistory,
  acceptDonationRequest,
  declineDonationRequest,
  completeDonation,
  checkEligibility,
  getDonorStats,
  findCompatibleDonors
} = require('../controllers/donorController.js');

const router = express.Router();

/**
 * @route   POST /api/v1/donors/register
 * @desc    Register as blood donor
 * @access  Public
 */
router.post(
  '/register',
  sanitizeInput,
  validate(registerDonorSchema),
  registerDonor
);

/**
 * @route   GET /api/v1/donors/profile
 * @desc    Get donor profile
 * @access  Private (Donor)
 */
router.get(
  '/profile',
  authenticate,
  donorOnly,
  getDonorProfile
);

/**
 * @route   GET /api/v1/donors/:id
 * @desc    Get donor by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getDonorProfile
);

/**
 * @route   PUT /api/v1/donors/profile
 * @desc    Update donor profile
 * @access  Private (Donor)
 */
router.put(
  '/profile',
  authenticate,
  donorOnly,
  sanitizeInput,
  updateDonorProfile
);

/**
 * @route   PUT /api/v1/donors/location
 * @desc    Update donor location
 * @access  Private (Donor)
 */
router.put(
  '/location',
  authenticate,
  donorOnly,
  validateLocation,
  updateDonorLocation
);

/**
 * @route   PUT /api/v1/donors/status
 * @desc    Update donor availability status
 * @access  Private (Donor)
 */
router.put(
  '/status',
  authenticate,
  donorOnly,
  validate(updateDonorAvailabilitySchema),
  updateDonorStatus
);

/**
 * @route   GET /api/v1/donors/eligibility
 * @desc    Check donation eligibility
 * @access  Private (Donor)
 */
router.get(
  '/eligibility',
  authenticate,
  donorOnly,
  checkEligibility
);

/**
 * @route   GET /api/v1/donors/history
 * @desc    Get donation history
 * @access  Private (Donor)
 */
router.get(
  '/history',
  authenticate,
  donorOnly,
  getDonationHistory
);

/**
 * @route   POST /api/v1/donors/request/:incidentId/accept
 * @desc    Accept donation request
 * @access  Private (Donor)
 */
router.post(
  '/request/:incidentId/accept',
  authenticate,
  donorOnly,
  validateObjectId('incidentId'),
  acceptDonationRequest
);

/**
 * @route   POST /api/v1/donors/request/:incidentId/decline
 * @desc    Decline donation request
 * @access  Private (Donor)
 */
router.post(
  '/request/:incidentId/decline',
  authenticate,
  donorOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  declineDonationRequest
);

/**
 * @route   POST /api/v1/donors/request/:incidentId/complete
 * @desc    Complete donation
 * @access  Private (Donor)
 */
router.post(
  '/request/:incidentId/complete',
  authenticate,
  donorOnly,
  validateObjectId('incidentId'),
  sanitizeInput,
  completeDonation
);

/**
 * @route   GET /api/v1/donors/stats
 * @desc    Get donor statistics
 * @access  Private (Donor)
 */
router.get(
  '/stats',
  authenticate,
  donorOnly,
  getDonorStats
);

/**
 * @route   GET /api/v1/donors/find/compatible
 * @desc    Find compatible donors for blood group
 * @access  Private (Hospital/Admin)
 */
router.get(
  '/find/compatible',
  authenticate,
  validateBloodGroup,
  validateLocation,
  findCompatibleDonors
);

module.exports = router;