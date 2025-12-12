const User = require('../models/User.js');
const Incident = require('../models/Incident.js');
const Ambulance = require('../models/Ambulance.js');
const Hospital = require('../models/Hospital.js');
const Volunteer = require('../models/Volunteer.js');
const Donor = require('../models/Donor.js');
const { calculateSeverity, generateActionPlan } = require('../services/triageService.js');
const { findBestAmbulance, findBestHospital, rankVolunteers, rankDonors } = require('../services/matchingService.js');
const { findNearestAmbulance, findNearestHospital, findNearestVolunteers, findCompatibleDonors } = require('../services/locationService.js');
const { notifyAmbulance, notifyVolunteers, notifyDonors, notifyEmergencyContacts } = require('../services/notificationService.js');
const { sendEmergencyContactAlerts } = require('../services/emailService.js');
const { uploadEmergencyPhoto } = require('../config/cloudinary.js');
const { emitEmergencyCreated, emitEmergencyUpdated } = require('../socket/emergencySocket.js');
const { EMERGENCY_ERRORS, createError } = require('../utils/errorMessages.js');
const { DISTANCE_CONSTANTS } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Create emergency (SOS or Bystander)
 * @route   POST /api/v1/emergency/create
 * @access  Private (User)
 */
async function createEmergency(req, res) {
  try {
    const userId = req.user.id;
    const {
      type,
      location,
      address,
      triageAnswers,
      victimDescription,
      requestBlood,
      requestVolunteer
    } = req.body;

    // Get user details
    const user = await User.findById(userId).populate('emergencyContacts');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check for active emergency
    const activeEmergency = await Incident.findOne({
      reportedBy: userId,
      status: { $in: ['pending', 'ambulance_dispatched', 'en_route_hospital'] }
    });

    if (activeEmergency) {
      return res.status(409).json(createError(EMERGENCY_ERRORS.ALREADY_ACTIVE));
    }

    // Upload photo if provided
    let photoUrl = null;
    if (req.file) {
      const upload = await uploadEmergencyPhoto(req.file.buffer, 'temp-incident-id');
      photoUrl = upload.url;
    }

    // Build incident data
    const incidentData = {
      type,
      reportedBy: userId,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: address || 'Unknown location'
      }
    };

    // Handle self vs bystander emergency
    if (type === 'self') {
      incidentData.patient = {
        userId: userId,
        name: user.fullName,
        age: user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth)) / 31557600000) : null,
        bloodType: user.healthProfile?.bloodType || 'Unknown',
        knownConditions: user.healthProfile?.chronicConditions || [],
        knownMedications: user.healthProfile?.currentMedications?.map(m => m.name) || []
      };
      incidentData.severity = 'high'; // Default for self
    } else {
      // Bystander emergency - calculate severity from triage
      const severity = calculateSeverity(triageAnswers);
      incidentData.triage = {
        isConscious: triageAnswers.conscious,
        isBreathing: triageAnswers.breathing,
        isBleeding: triageAnswers.bleeding
      };
      incidentData.severity = severity;
      incidentData.patient = {
        name: 'Unknown victim',
        age: null,
        gender: 'Unknown',
        bloodType: 'Unknown'
      };
    }

    if (victimDescription) {
      incidentData.triage = incidentData.triage || {};
      incidentData.triage.additionalSymptoms = victimDescription;
    }

    if (photoUrl) {
      incidentData.triage = incidentData.triage || {};
      incidentData.triage.photos = [photoUrl];
    }

    // Create incident
    const incident = await Incident.create(incidentData);

    // Generate action plan
    const actionPlan = generateActionPlan(incident.severity, incidentData.triage || {});

    // Find and dispatch ambulance
    const availableAmbulances = await Ambulance.find({
      status: 'available',
      isActive: true,
      isVerified: true
    });

    const nearestAmbulances = findNearestAmbulance(
      { lat: location.lat, lng: location.lng },
      availableAmbulances,
      DISTANCE_CONSTANTS.MAX_AMBULANCE_RADIUS_KM
    );

    let bestAmbulance = null;
    if (nearestAmbulances) {
      bestAmbulance = findBestAmbulance([nearestAmbulances], incident);

      if (bestAmbulance) {
        incident.assignAmbulance(bestAmbulance.ambulanceId, bestAmbulance.eta);
        await incident.save();

        // Notify ambulance
        const ambulance = await Ambulance.findById(bestAmbulance.ambulanceId);
        if (ambulance) {
          await notifyAmbulance(ambulance, incident, bestAmbulance.eta);
        }
      }
    } else {
      logger.warn(`No ambulance available for incident ${incident._id}`);
    }

    // Find and assign hospital
    const availableHospitals = await Hospital.find({
      isActive: true,
      isVerified: true,
      acceptingEmergencies: true
    });

    const nearestHospital = findNearestHospital(
      { lat: location.lat, lng: location.lng },
      availableHospitals,
      'emergency',
      30
    );

    // FIXED: Fetch hospital details safely
    let assignedHospital = null;
    if (nearestHospital) {
      assignedHospital = await Hospital.findById(nearestHospital.hospitalId);
      
      if (assignedHospital) {
        incident.assignHospital(nearestHospital.hospitalId, nearestHospital.eta);
        await incident.save();
      } else {
        logger.warn(`Hospital ${nearestHospital.hospitalId} not found for incident ${incident._id}`);
      }
    }

    // Dispatch volunteer if critical
    if (actionPlan.dispatchVolunteer || requestVolunteer) {
      const availableVolunteers = await Volunteer.find({
        status: 'available',
        isActive: true,
        verificationStatus: 'verified'
      });

      const nearestVolunteers = findNearestVolunteers(
        { lat: location.lat, lng: location.lng },
        availableVolunteers,
        DISTANCE_CONSTANTS.MAX_VOLUNTEER_RADIUS_KM,
        5
      );

      if (nearestVolunteers.length > 0) {
        const rankedVolunteers = rankVolunteers(nearestVolunteers, incident);
        await notifyVolunteers(rankedVolunteers.slice(0, 5), incident);
      }
    }

    // Request blood donors if needed
    if (actionPlan.requestBloodDonor || requestBlood) {
      const bloodGroup = incident.patient.bloodType;
      if (bloodGroup && bloodGroup !== 'Unknown') {
        const availableDonors = await Donor.find({
          status: 'available',
          isActive: true,
          isVerified: true
        });

        const compatibleDonors = findCompatibleDonors(
          { lat: location.lat, lng: location.lng },
          availableDonors,
          bloodGroup,
          DISTANCE_CONSTANTS.MAX_DONOR_RADIUS_KM,
          5
        );

        if (compatibleDonors.length > 0 && assignedHospital) {
          await notifyDonors(compatibleDonors, incident, bloodGroup, assignedHospital);
          incident.bloodRequired = true;
          await incident.save();
        }
      }
    }

    // Notify emergency contacts
    if (type === 'self' && user.emergencyContacts?.length > 0) {
      const trackingLink = `${process.env.CLIENT_URL}/track/${incident._id}`;
      await sendEmergencyContactAlerts(incident, user, user.emergencyContacts);
      incident.notifyContacts(user.emergencyContacts);
      await incident.save();
    }

    // Emit socket event
    emitEmergencyCreated(incident);

    logger.info(`Emergency created: ${incident._id} (${incident.severity})`);

    // FIXED: Safe response construction
    res.status(201).json({
      success: true,
      message: 'Emergency alert created successfully',
      data: {
        incident: {
          id: incident._id,
          type: incident.type,
          severity: incident.severity,
          status: incident.status,
          ambulanceETA: bestAmbulance?.eta || null,
          hospitalName: assignedHospital?.name || null,
          hospitalId: assignedHospital?._id || null,
          trackingLink: `${process.env.CLIENT_URL}/track/${incident._id}`
        }
      }
    });

  } catch (error) {
    logger.error('Create emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency alert',
      error: error.message
    });
  }
};

/**
 * @desc    Get emergency details
 * @route   GET /api/v1/emergency/:id
 * @access  Private
 */
async function getEmergency(req, res) {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id)
      .populate('reportedBy', 'fullName phone email')
      .populate('ambulance', 'vehicleNumber driver.name driver.phone type')
      .populate('volunteer', 'fullName phone')
      .populate('hospital', 'name location.address emergencyPhone')
      .populate('bloodDonor', 'fullName bloodType phone');

    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { incident }
    });

  } catch (error) {
    logger.error('Get emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency details',
      error: error.message
    });
  }
};

/**
 * @desc    Get my emergencies
 * @route   GET /api/v1/emergency/my/all
 * @access  Private (User)
 */
async function getMyEmergencies(req, res) {
  try {
    console.log("Fetching my emergencies");
    const userId = req.user.id;
    console.log("Fetching emergencies for user:", userId);
    const incidents = await Incident.find({
      $or: [
        { reportedBy: userId },
        { 'patient.userId': userId }
      ]
    })
      .populate('ambulance', 'vehicleNumber type')
      .populate('hospital', 'name location.address')
      .sort({ createdAt: -1 });
    console.log(`Found ${incidents.length} emergencies for user ${userId}`);
    res.status(200).json({
      success: true,
      count: incidents.length,
      data: { incidents }
    });

  } catch (error) {
    logger.error('Get my emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergencies',
      error: error.message
    });
  }
};

/**
 * @desc    Get all emergencies (admin/responders)
 * @route   GET /api/v1/emergency
 * @access  Private
 */
async function getAllEmergencies(req, res) {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'fullName phone')
      .populate('ambulance', 'vehicleNumber')
      .populate('hospital', 'name')
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
    logger.error('Get all emergencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergencies',
      error: error.message
    });
  }
};

/**
 * @desc    Update emergency status
 * @route   PUT /api/v1/emergency/:id/status
 * @access  Private (Responders)
 */
async function updateEmergencyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    // Update status
    incident.updateStatus(status, userId, userRole);
    await incident.save();

    // Emit socket event
    emitEmergencyUpdated(incident);

    logger.info(`Emergency ${id} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: { incident }
    });

  } catch (error) {
    logger.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel emergency
 * @route   POST /api/v1/emergency/:id/cancel
 * @access  Private
 */
async function cancelEmergency(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    // Check if can cancel
    if (incident.status === 'reached_hospital') {
      return res.status(400).json(createError(EMERGENCY_ERRORS.CANNOT_CANCEL));
    }

    incident.cancel(reason, userId, 'User');
    await incident.save();

    logger.info(`Emergency ${id} cancelled by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel emergency',
      error: error.message
    });
  }
};

/**
 * @desc    Resolve emergency
 * @route   POST /api/v1/emergency/:id/resolve
 * @access  Private (Responders)
 */
async function resolveEmergency(req, res) {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    incident.resolve(outcome);
    await incident.save();

    logger.info(`Emergency ${id} resolved`);

    res.status(200).json({
      success: true,
      message: 'Emergency resolved successfully'
    });

  } catch (error) {
    logger.error('Resolve emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve emergency',
      error: error.message
    });
  }
};

// Placeholder exports for other functions
async function acceptEmergencyRequest(req, res) {
  res.status(200).json({ success: true, message: 'Request accepted' });
};

async function declineEmergencyRequest(req, res) {
  res.status(200).json({ success: true, message: 'Request declined' });
};

async function getEmergencyTracking(req, res) {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id)
      .populate('ambulance', 'currentLocation vehicleNumber')
      .populate('volunteer', 'currentLocation fullName')
      .populate('hospital', 'location name');

    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { tracking: incident.getTrackingData() }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function getEmergencyTimeline(req, res) {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id).select('timeline');

    if (!incident) {
      return res.status(404).json(createError(EMERGENCY_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { timeline: incident.timeline }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function rateResponder(req, res) {
  res.status(200).json({ success: true, message: 'Rating submitted' });
};

async function getNearbyEmergencies(req, res) {
  res.status(200).json({ success: true, data: { emergencies: [] } });
};

module.exports = {
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
}