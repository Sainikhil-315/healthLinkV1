const Volunteer = require('../models/Volunteer.js');
const Incident = require('../models/Incident.js');
const { uploadCertificate: uploadToCloudinary } = require('../config/cloudinary.js');
const { updateVolunteerLocation: updateLocationSocket } = require('../socket/locationSocket.js');
const { VOLUNTEER_ERRORS, createError } = require('../utils/errorMessages.js');
const { sendUserWelcomeEmail } = require('../services/emailService.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Register as volunteer
 * @route   POST /api/v1/volunteers/register
 * @access  Public
 */
async function registerVolunteer(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      bloodType,
      address,
      location,
      certifications,
      skills
    } = req.body;

    // Check if volunteer already exists
    const existingVolunteer = await Volunteer.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingVolunteer) {
      return res.status(409).json({
        success: false,
        message: 'Volunteer with this email or phone already exists'
      });
    }

    // Create volunteer
    const volunteer = await Volunteer.create({
      fullName: name,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      bloodType: bloodType || 'O+',
      homeAddress: address,
      currentLocation: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: address.street || ''
      },
      certification: certifications[0], // First certification (MVP)
      skills: {
        cprCertified: true,
        firstAidTrained: skills.includes('firstAid'),
        medicalBackground: skills.includes('medical')
      }
    });

    // Send welcome email
    await sendUserWelcomeEmail({ email, fullName: name }, 'volunteer');

    logger.info(`New volunteer registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful. Awaiting verification.',
      data: {
        volunteer: {
          id: volunteer._id,
          name: volunteer.fullName,
          email: volunteer.email,
          verificationStatus: volunteer.verificationStatus
        }
      }
    });

  } catch (error) {
    logger.error('Volunteer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Volunteer registration failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get volunteer profile
 * @route   GET /api/v1/volunteers/profile or /api/v1/volunteers/:id
 * @access  Private
 */
async function getVolunteerProfile(req, res) {
  try {
    const volunteerId = req.params.id || req.user.id;

    const volunteer = await Volunteer.findById(volunteerId).select('-password');

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { volunteer }
    });

  } catch (error) {
    logger.error('Get volunteer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update volunteer profile
 * @route   PUT /api/v1/volunteers/profile
 * @access  Private (Volunteer)
 */
async function updateVolunteerProfile(req, res) {
  try {
    const volunteerId = req.user.id;
    const updates = req.body;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    // Update allowed fields
    if (updates.fullName) volunteer.fullName = updates.fullName;
    if (updates.phone) volunteer.phone = updates.phone;
    if (updates.homeAddress) volunteer.homeAddress = updates.homeAddress;
    if (updates.responseRadius) volunteer.responseRadius = updates.responseRadius;
    if (updates.preferences) volunteer.preferences = { ...volunteer.preferences, ...updates.preferences };

    await volunteer.save();

    logger.info(`Volunteer profile updated: ${volunteerId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { volunteer }
    });

  } catch (error) {
    logger.error('Update volunteer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update volunteer location (real-time)
 * @route   PUT /api/v1/volunteers/location
 * @access  Private (Volunteer)
 */
async function updateVolunteerLocation(req, res) {
  try {
    const volunteerId = req.user.id;
    const { lat, lng, address } = req.body.location || req.body;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    volunteer.updateLocation(lng, lat, address);
    await volunteer.save();

    // Broadcast via socket
    await updateLocationSocket(volunteerId, { lat, lng });

    logger.debug(`Volunteer location updated: ${volunteerId}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: volunteer.currentLocation
      }
    });

  } catch (error) {
    logger.error('Update volunteer location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * @desc    Update volunteer availability status
 * @route   PUT /api/v1/volunteers/status
 * @access  Private (Volunteer)
 */
async function updateVolunteerStatus(req, res) {
  try {
    const volunteerId = req.user.id;
    const { status } = req.body;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    volunteer.status = status;
    await volunteer.save();

    logger.info(`Volunteer status updated: ${volunteerId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        status: volunteer.status
      }
    });

  } catch (error) {
    logger.error('Update volunteer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * @desc    Upload CPR certificate
 * @route   POST /api/v1/volunteers/certificate
 * @access  Private (Volunteer)
 */
async function uploadCertificate(req, res) {
  try {
    const volunteerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file provided'
      });
    }

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, volunteerId);

    // Update certificate
    volunteer.certification.certificateImage = result.url;
    await volunteer.save();

    logger.info(`Certificate uploaded for volunteer ${volunteerId}`);

    res.status(200).json({
      success: true,
      message: 'Certificate uploaded successfully. Awaiting admin verification.',
      data: {
        certificateUrl: result.url
      }
    });

  } catch (error) {
    logger.error('Upload certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Get current mission
 * @route   GET /api/v1/volunteers/mission/current
 * @access  Private (Volunteer)
 */
async function getCurrentMission(req, res) {
  try {
    const volunteerId = req.user.id;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    if (!volunteer.currentMission) {
      return res.status(200).json({
        success: true,
        message: 'No active mission',
        data: { mission: null }
      });
    }

    const mission = await Incident.findById(volunteer.currentMission)
      .populate('patient.userId', 'fullName phone')
      .populate('ambulance', 'vehicleNumber driver.name');

    res.status(200).json({
      success: true,
      data: { mission }
    });

  } catch (error) {
    logger.error('Get current mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current mission',
      error: error.message
    });
  }
};

/**
 * @desc    Get mission history
 * @route   GET /api/v1/volunteers/mission/history
 * @access  Private (Volunteer)
 */
async function getMissionHistory(req, res) {
  try {
    const volunteerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const missions = await Incident.find({ volunteer: volunteerId })
      .populate('patient.userId', 'fullName')
      .populate('ambulance', 'vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments({ volunteer: volunteerId });

    res.status(200).json({
      success: true,
      count: missions.length,
      total,
      pages: Math.ceil(total / limit),
      data: { missions }
    });

  } catch (error) {
    logger.error('Get mission history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mission history',
      error: error.message
    });
  }
};

/**
 * @desc    Accept mission
 * @route   POST /api/v1/volunteers/mission/:incidentId/accept
 * @access  Private (Volunteer)
 */
async function acceptMission(req, res) {
  try {
    const volunteerId = req.user.id;
    const { incidentId } = req.params;

    const volunteer = await Volunteer.findById(volunteerId);
    const incident = await Incident.findById(incidentId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    if (!volunteer.isAvailableForMission()) {
      return res.status(400).json(createError(VOLUNTEER_ERRORS.NOT_AVAILABLE));
    }

    // Accept mission
    volunteer.acceptMission(incidentId);
    await volunteer.save();

    incident.volunteer = volunteerId;
    incident.updateStatus('volunteer_dispatched', volunteerId, 'Volunteer');
    await incident.save();

    logger.info(`Mission accepted: Volunteer ${volunteerId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Mission accepted successfully',
      data: { incident }
    });

  } catch (error) {
    logger.error('Accept mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept mission',
      error: error.message
    });
  }
};

/**
 * @desc    Notify arrival at scene
 * @route   POST /api/v1/volunteers/mission/:incidentId/arrived
 * @access  Private (Volunteer)
 */
async function arrivedAtScene(req, res) {
  try {
    const volunteerId = req.user.id;
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    incident.updateStatus('volunteer_arrived', volunteerId, 'Volunteer');
    await incident.save();

    logger.info(`Volunteer arrived: ${volunteerId} at incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Arrival confirmed'
    });

  } catch (error) {
    logger.error('Arrived at scene error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm arrival',
      error: error.message
    });
  }
};

/**
 * @desc    Complete mission
 * @route   POST /api/v1/volunteers/mission/:incidentId/complete
 * @access  Private (Volunteer)
 */
async function completeMission(req, res) {
  try {
    const volunteerId = req.user.id;
    const { incidentId } = req.params;
    const { notes } = req.body;

    const volunteer = await Volunteer.findById(volunteerId);
    const incident = await Incident.findById(incidentId);

    if (!volunteer || !incident) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer or incident not found'
      });
    }

    // Complete mission
    volunteer.completeMission();
    volunteer.stats.livesSaved += 1;
    await volunteer.save();

    incident.outcome = {
      ...incident.outcome,
      notes: notes || 'Volunteer provided first response'
    };
    await incident.save();

    logger.info(`Mission completed: Volunteer ${volunteerId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Mission completed successfully. Thank you for your service!',
      data: {
        stats: volunteer.stats,
        badges: volunteer.badges
      }
    });

  } catch (error) {
    logger.error('Complete mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete mission',
      error: error.message
    });
  }
};

/**
 * @desc    Decline mission
 * @route   POST /api/v1/volunteers/mission/:incidentId/decline
 * @access  Private (Volunteer)
 */
async function declineMission(req, res) {
  try {
    const volunteerId = req.user.id;
    const { incidentId } = req.params;
    const { reason } = req.body;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    logger.info(`Mission declined: Volunteer ${volunteerId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Mission declined'
    });

  } catch (error) {
    logger.error('Decline mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline mission',
      error: error.message
    });
  }
};

/**
 * @desc    Get volunteer statistics
 * @route   GET /api/v1/volunteers/stats
 * @access  Private (Volunteer)
 */
async function getVolunteerStats(req, res) {
  try {
    const volunteerId = req.user.id;

    const volunteer = await Volunteer.findById(volunteerId);

    if (!volunteer) {
      return res.status(404).json(createError(VOLUNTEER_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: {
        stats: volunteer.stats,
        badges: volunteer.badges,
        verificationStatus: volunteer.verificationStatus,
        certificateExpiry: volunteer.certification?.expiryDate
      }
    });

  } catch (error) {
    logger.error('Get volunteer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

module.exports = {
  registerVolunteer,
  getVolunteerProfile,
  updateVolunteerProfile,
  updateVolunteerLocation,
  updateVolunteerStatus,
  uploadCertificate,
  getCurrentMission,
  getMissionHistory,
  acceptMission,
  arrivedAtScene,
  completeMission,
  declineMission,
  getVolunteerStats
}