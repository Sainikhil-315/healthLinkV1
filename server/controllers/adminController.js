const User = require('../models/User.js');
const Ambulance = require('../models/Ambulance.js');
const Hospital = require('../models/Hospital.js');
const Volunteer = require('../models/Volunteer.js');
const Donor = require('../models/Donor.js');
const Incident = require('../models/Incident.js');
const { sendVerificationApprovedEmail } = require('../services/emailService.js');
const { broadcastToUsers } = require('../services/notificationService.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (Admin)
 */
async function getDashboardStats(req, res) {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: 'available', isActive: true });
    const totalHospitals = await Hospital.countDocuments({ isActive: true });
    const totalVolunteers = await Volunteer.countDocuments({ isActive: true });
    const verifiedVolunteers = await Volunteer.countDocuments({ verificationStatus: 'verified' });
    const totalDonors = await Donor.countDocuments({ isActive: true });

    // Incident statistics
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({
      status: { $in: ['pending', 'ambulance_dispatched', 'patient_picked_up', 'en_route_hospital'] }
    });
    const resolvedToday = await Incident.countDocuments({
      status: 'resolved',
      resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Verification pending
    const pendingVerifications = {
      ambulances: await Ambulance.countDocuments({ isVerified: false }),
      hospitals: await Hospital.countDocuments({ isVerified: false }),
      volunteers: await Volunteer.countDocuments({ verificationStatus: 'pending' })
    };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          ambulances: totalAmbulances,
          hospitals: totalHospitals,
          volunteers: totalVolunteers,
          donors: totalDonors
        },
        ambulances: {
          total: totalAmbulances,
          available: availableAmbulances,
          utilization: Math.round(((totalAmbulances - availableAmbulances) / totalAmbulances) * 100) || 0
        },
        incidents: {
          total: totalIncidents,
          active: activeIncidents,
          resolvedToday
        },
        verification: pendingVerifications
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @desc    Get all users with pagination
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin)
 */
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: { users }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Admin)
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's incident history
    const incidents = await Incident.find({
      $or: [{ reportedBy: id }, { 'patient.userId': id }]
    }).limit(10).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { user, incidents }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * @desc    Update user status (activate/suspend)
 * @route   PUT /api/v1/admin/users/:id/status
 * @access  Private (Admin)
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User ${id} status updated to ${isActive ? 'active' : 'suspended'} by admin`);

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.warn(`User ${id} deleted by admin`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ============================================
// AMBULANCE MANAGEMENT
// ============================================

/**
 * @desc    Get all ambulances
 * @route   GET /api/v1/admin/ambulances
 * @access  Private (Admin)
 */
async function getAllAmbulances(req, res) {
  try {
    const { page = 1, limit = 20, status, verified } = req.query;

    const query = {};

    if (status) query.status = status;
    if (verified !== undefined) query.isVerified = verified === 'true';

    const ambulances = await Ambulance.find(query)
      .select('-password')
      .populate('baseHospital', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ambulance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: ambulances.length,
      total,
      pages: Math.ceil(total / limit),
      data: { ambulances }
    });

  } catch (error) {
    logger.error('Get all ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulances',
      error: error.message
    });
  }
};

/**
 * @desc    Verify ambulance registration
 * @route   PUT /api/v1/admin/ambulances/:id/verify
 * @access  Private (Admin)
 */
async function verifyAmbulance(req, res) {
  try {
    const { id } = req.params;

    const ambulance = await Ambulance.findById(id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    ambulance.isVerified = true;
    await ambulance.save();

    // Send approval email
    await sendVerificationApprovedEmail(
      { email: ambulance.driver.email, fullName: ambulance.driver.name },
      'ambulance'
    );

    logger.info(`Ambulance ${id} verified by admin`);

    res.status(200).json({
      success: true,
      message: 'Ambulance verified successfully'
    });

  } catch (error) {
    logger.error('Verify ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify ambulance',
      error: error.message
    });
  }
};

/**
 * @desc    Update ambulance verification status
 * @route   PUT /api/v1/admin/ambulances/:id/status
 * @access  Private (Admin)
 */
async function updateAmbulanceVerification(req, res) {
  try {
    const { id } = req.params;
    const { isVerified, isActive } = req.body;

    const ambulance = await Ambulance.findById(id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    if (isVerified !== undefined) ambulance.isVerified = isVerified;
    if (isActive !== undefined) ambulance.isActive = isActive;

    await ambulance.save();

    logger.info(`Ambulance ${id} status updated by admin`);

    res.status(200).json({
      success: true,
      message: 'Ambulance status updated successfully'
    });

  } catch (error) {
    logger.error('Update ambulance verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance status',
      error: error.message
    });
  }
};

// ============================================
// HOSPITAL MANAGEMENT
// ============================================

/**
 * @desc    Get all hospitals
 * @route   GET /api/v1/admin/hospitals
 * @access  Private (Admin)
 */
async function getAllHospitals(req, res) {
  try {
    const { page = 1, limit = 20, verified } = req.query;

    const query = {};
    if (verified !== undefined) query.isVerified = verified === 'true';

    const hospitals = await Hospital.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Hospital.countDocuments(query);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      total,
      pages: Math.ceil(total / limit),
      data: { hospitals }
    });

  } catch (error) {
    logger.error('Get all hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospitals',
      error: error.message
    });
  }
};

/**
 * @desc    Verify hospital registration
 * @route   PUT /api/v1/admin/hospitals/:id/verify
 * @access  Private (Admin)
 */
async function verifyHospital(req, res) {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    hospital.isVerified = true;
    await hospital.save();

    // Send approval email
    await sendVerificationApprovedEmail(
      { email: hospital.email, fullName: hospital.name },
      'hospital'
    );

    logger.info(`Hospital ${id} verified by admin`);

    res.status(200).json({
      success: true,
      message: 'Hospital verified successfully'
    });

  } catch (error) {
    logger.error('Verify hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify hospital',
      error: error.message
    });
  }
};

/**
 * @desc    Update hospital verification status
 * @route   PUT /api/v1/admin/hospitals/:id/status
 * @access  Private (Admin)
 */
async function updateHospitalVerification(req, res) {
  try {
    const { id } = req.params;
    const { isVerified, isActive } = req.body;

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    if (isVerified !== undefined) hospital.isVerified = isVerified;
    if (isActive !== undefined) hospital.isActive = isActive;

    await hospital.save();

    logger.info(`Hospital ${id} status updated by admin`);

    res.status(200).json({
      success: true,
      message: 'Hospital status updated successfully'
    });

  } catch (error) {
    logger.error('Update hospital verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital status',
      error: error.message
    });
  }
};

// ============================================
// VOLUNTEER MANAGEMENT
// ============================================

/**
 * @desc    Get all volunteers
 * @route   GET /api/v1/admin/volunteers
 * @access  Private (Admin)
 */
async function getAllVolunteers(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.verificationStatus = status;

    const volunteers = await Volunteer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Volunteer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: volunteers.length,
      total,
      pages: Math.ceil(total / limit),
      data: { volunteers }
    });

  } catch (error) {
    logger.error('Get all volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteers',
      error: error.message
    });
  }
};

/**
 * @desc    Verify volunteer (approve certification)
 * @route   PUT /api/v1/admin/volunteers/:id/verify
 * @access  Private (Admin)
 */
async function verifyVolunteer(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const volunteer = await Volunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    volunteer.verifyCertification(adminId);
    await volunteer.save();

    // Send approval email
    await sendVerificationApprovedEmail(
      { email: volunteer.email, fullName: volunteer.fullName },
      'volunteer'
    );

    logger.info(`Volunteer ${id} verified by admin ${adminId}`);

    res.status(200).json({
      success: true,
      message: 'Volunteer verified successfully'
    });

  } catch (error) {
    logger.error('Verify volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify volunteer',
      error: error.message
    });
  }
};

/**
 * @desc    Reject volunteer application
 * @route   PUT /api/v1/admin/volunteers/:id/reject
 * @access  Private (Admin)
 */
async function rejectVolunteer(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const volunteer = await Volunteer.findById(id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    volunteer.rejectCertification(reason);
    await volunteer.save();

    logger.info(`Volunteer ${id} rejected by admin`);

    res.status(200).json({
      success: true,
      message: 'Volunteer application rejected'
    });

  } catch (error) {
    logger.error('Reject volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject volunteer',
      error: error.message
    });
  }
};

// ============================================
// DONOR MANAGEMENT
// ============================================

/**
 * @desc    Get all blood donors
 * @route   GET /api/v1/admin/donors
 * @access  Private (Admin)
 */
async function getAllDonors(req, res) {
  try {
    const { page = 1, limit = 20, bloodGroup, status } = req.query;

    const query = {};
    if (bloodGroup) query.bloodType = bloodGroup;
    if (status) query.status = status;

    const donors = await Donor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donor.countDocuments(query);

    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      pages: Math.ceil(total / limit),
      data: { donors }
    });

  } catch (error) {
    logger.error('Get all donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donors',
      error: error.message
    });
  }
};

// ============================================
// INCIDENT MANAGEMENT
// ============================================

/**
 * @desc    Get all incidents with filters
 * @route   GET /api/v1/admin/incidents
 * @access  Private (Admin)
 */
async function getAllIncidents(req, res) {
  try {
    const { page = 1, limit = 20, status, severity } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'fullName phone')
      .populate('ambulance', 'vehicleNumber')
      .populate('hospital', 'name')
      .populate('volunteer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments(query);

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      pages: Math.ceil(total / limit),
      data: { incidents }
    });

  } catch (error) {
    logger.error('Get all incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents',
      error: error.message
    });
  }
};

/**
 * @desc    Get incident statistics
 * @route   GET /api/v1/admin/incidents/stats
 * @access  Private (Admin)
 */
async function getIncidentStats(req, res) {
  try {
    const totalIncidents = await Incident.countDocuments();
    const bySeverity = await Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const byStatus = await Incident.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Average response times
    const avgResponseTime = await Incident.aggregate([
      { $match: { 'responseTimes.totalResponseTime': { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$responseTimes.totalResponseTime' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalIncidents,
        bySeverity,
        byStatus,
        averageResponseTime: avgResponseTime[0]?.avg || 0
      }
    });

  } catch (error) {
    logger.error('Get incident stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel incident (admin override)
 * @route   PUT /api/v1/admin/incidents/:id/cancel
 * @access  Private (Admin)
 */
async function cancelIncident(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    incident.cancel(reason, adminId, 'Admin');
    await incident.save();

    logger.warn(`Incident ${id} cancelled by admin ${adminId}`);

    res.status(200).json({
      success: true,
      message: 'Incident cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel incident',
      error: error.message
    });
  }
};

// ============================================
// SYSTEM MANAGEMENT
// ============================================

/**
 * @desc    Get system logs
 * @route   GET /api/v1/admin/logs
 * @access  Private (Admin)
 */
async function getSystemLogs(req, res) {
  try {
    // For MVP, return placeholder
    // In production, implement proper log aggregation
    res.status(200).json({
      success: true,
      message: 'System logs endpoint (implement with proper logging service)',
      data: { logs: [] }
    });

  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
      error: error.message
    });
  }
};

/**
 * @desc    Send bulk notification to users
 * @route   POST /api/v1/admin/notifications/broadcast
 * @access  Private (Admin)
 */
async function sendBulkNotification(req, res) {
  try {
    const { title, message, targetRole, userIds } = req.body;

    let recipients = [];

    if (userIds && userIds.length > 0) {
      recipients = userIds;
    } else if (targetRole) {
      // Get all users of specific role
      const Model = targetRole === 'user' ? User :
        targetRole === 'ambulance' ? Ambulance :
          targetRole === 'hospital' ? Hospital :
            targetRole === 'volunteer' ? Volunteer :
              targetRole === 'donor' ? Donor : User;

      const users = await Model.find({ isActive: true }).select('_id');
      recipients = users.map(u => u._id);
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified'
      });
    }

    // Broadcast notification
    await broadcastToUsers(recipients, targetRole || 'User', {
      type: 'system',
      title,
      body: message,
      priority: 'medium'
    });

    logger.info(`Bulk notification sent to ${recipients.length} users`);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${recipients.length} users`
    });

  } catch (error) {
    logger.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

module.exports = {
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
  sendBulkNotification,
}