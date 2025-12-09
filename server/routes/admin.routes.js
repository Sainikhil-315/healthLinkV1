const express = require('express');
const { authenticate } = require('../middleware/auth.js');
const { adminOnly } = require('../middleware/roleCheck.js');
const {
  validateObjectId,
  validatePagination,
  sanitizeInput
} = require('../middleware/validator.js');

const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllAmbulances,
  verifyAmbulance,
  updateAmbulanceVerification,
  getAllHospitals,
  verifyHospital,
  updateHospitalVerification,
  getAllVolunteers,
  verifyVolunteer,
  rejectVolunteer,
  getAllDonors,
  getAllIncidents,
  getIncidentStats,
  cancelIncident,
  getSystemLogs,
  sendBulkNotification
} = require('../controllers/adminController.js');

const router = express.Router();

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get(
  '/dashboard',
  authenticate,
  adminOnly,
  getDashboardStats
);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination
 * @access  Private (Admin)
 */
router.get(
  '/users',
  authenticate,
  adminOnly,
  validatePagination,
  getAllUsers
);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get(
  '/users/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  getUserById
);

/**
 * @route   PUT /api/v1/admin/users/:id/status
 * @desc    Update user status (activate/suspend)
 * @access  Private (Admin)
 */
router.put(
  '/users/:id/status',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  sanitizeInput,
  updateUserStatus
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user account
 * @access  Private (Admin)
 */
router.delete(
  '/users/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  deleteUser
);

// ============================================
// AMBULANCE MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/ambulances
 * @desc    Get all ambulances
 * @access  Private (Admin)
 */
router.get(
  '/ambulances',
  authenticate,
  adminOnly,
  validatePagination,
  getAllAmbulances
);

/**
 * @route   PUT /api/v1/admin/ambulances/:id/verify
 * @desc    Verify ambulance registration
 * @access  Private (Admin)
 */
router.put(
  '/ambulances/:id/verify',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  verifyAmbulance
);

/**
 * @route   PUT /api/v1/admin/ambulances/:id/status
 * @desc    Update ambulance verification status
 * @access  Private (Admin)
 */
router.put(
  '/ambulances/:id/status',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  sanitizeInput,
  updateAmbulanceVerification
);

// ============================================
// HOSPITAL MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/hospitals
 * @desc    Get all hospitals
 * @access  Private (Admin)
 */
router.get(
  '/hospitals',
  authenticate,
  adminOnly,
  validatePagination,
  getAllHospitals
);

/**
 * @route   PUT /api/v1/admin/hospitals/:id/verify
 * @desc    Verify hospital registration
 * @access  Private (Admin)
 */
router.put(
  '/hospitals/:id/verify',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  verifyHospital
);

/**
 * @route   PUT /api/v1/admin/hospitals/:id/status
 * @desc    Update hospital verification status
 * @access  Private (Admin)
 */
router.put(
  '/hospitals/:id/status',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  sanitizeInput,
  updateHospitalVerification
);

// ============================================
// VOLUNTEER MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/volunteers
 * @desc    Get all volunteers
 * @access  Private (Admin)
 */
router.get(
  '/volunteers',
  authenticate,
  adminOnly,
  validatePagination,
  getAllVolunteers
);

/**
 * @route   PUT /api/v1/admin/volunteers/:id/verify
 * @desc    Verify volunteer (approve certification)
 * @access  Private (Admin)
 */
router.put(
  '/volunteers/:id/verify',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  verifyVolunteer
);

/**
 * @route   PUT /api/v1/admin/volunteers/:id/reject
 * @desc    Reject volunteer application
 * @access  Private (Admin)
 */
router.put(
  '/volunteers/:id/reject',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  sanitizeInput,
  rejectVolunteer
);

// ============================================
// DONOR MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/donors
 * @desc    Get all blood donors
 * @access  Private (Admin)
 */
router.get(
  '/donors',
  authenticate,
  adminOnly,
  validatePagination,
  getAllDonors
);

// ============================================
// INCIDENT MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/incidents
 * @desc    Get all incidents with filters
 * @access  Private (Admin)
 */
router.get(
  '/incidents',
  authenticate,
  adminOnly,
  validatePagination,
  getAllIncidents
);

/**
 * @route   GET /api/v1/admin/incidents/stats
 * @desc    Get incident statistics
 * @access  Private (Admin)
 */
router.get(
  '/incidents/stats',
  authenticate,
  adminOnly,
  getIncidentStats
);

/**
 * @route   PUT /api/v1/admin/incidents/:id/cancel
 * @desc    Cancel incident (admin override)
 * @access  Private (Admin)
 */
router.put(
  '/incidents/:id/cancel',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  sanitizeInput,
  cancelIncident
);

// ============================================
// SYSTEM MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/logs
 * @desc    Get system logs
 * @access  Private (Admin)
 */
router.get(
  '/logs',
  authenticate,
  adminOnly,
  validatePagination,
  getSystemLogs
);

/**
 * @route   POST /api/v1/admin/notifications/broadcast
 * @desc    Send bulk notification to users
 * @access  Private (Admin)
 */
router.post(
  '/notifications/broadcast',
  authenticate,
  adminOnly,
  sanitizeInput,
  sendBulkNotification
);

module.exports = router;