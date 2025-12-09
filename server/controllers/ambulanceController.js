const Incident = require('../models/Incident.js');
const Ambulance = require('../models/Ambulance.js');
const Hospital = require('../models/Hospital.js');
const { updateAmbulanceLocation: updateLocationSocket } = require('../socket/locationSocket.js');
const { setCache } = require('../config/redis.js');
const { AMBULANCE_ERRORS, createError } = require('../utils/errorMessages.js');
const { REDIS_KEYS } = require('../utils/constants.js');
const { sendUserWelcomeEmail } = require('../services/emailService.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Register new ambulance
 * @route   POST /api/v1/ambulances/register
 * @access  Public
 */
async function registerAmbulance(req, res) {
  try {
    const {
      driverName,
      email,
      phone,
      password,
      vehicleNumber,
      ambulanceType,
      hospitalId,
      equipment,
      licenseNumber
    } = req.body;

    // Check if ambulance already exists
    const existingAmbulance = await Ambulance.findOne({
      $or: [{ vehicleNumber }, { 'driver.email': email }, { 'driver.phone': phone }]
    });

    if (existingAmbulance) {
      return res.status(409).json(createError(AMBULANCE_ERRORS.ALREADY_REGISTERED));
    }

    // Verify hospital exists if provided
    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }
    }

    // Create ambulance
    const ambulance = await Ambulance.create({
      vehicleNumber: vehicleNumber.toUpperCase(),
      driver: {
        name: driverName,
        email,
        phone,
        licenseNumber
      },
      password,
      type: ambulanceType,
      baseHospital: hospitalId,
      equipment: {
        oxygen: true,
        stretcher: true,
        firstAidKit: true,
        fireExtinguisher: true,
        defibrillator: equipment?.includes('defibrillator') || false,
        ventilator: equipment?.includes('ventilator') || false,
        ecgMachine: equipment?.includes('ecgMachine') || false
      },
      registrationDate: Date.now()
    });

    // Send welcome email
    await sendUserWelcomeEmail(
      { email, fullName: driverName },
      'ambulance'
    );

    logger.info(`New ambulance registered: ${vehicleNumber}`);

    res.status(201).json({
      success: true,
      message: 'Ambulance registered successfully. Awaiting admin verification.',
      data: {
        ambulance: {
          id: ambulance._id,
          vehicleNumber: ambulance.vehicleNumber,
          driverName: ambulance.driver.name,
          email: ambulance.driver.email,
          type: ambulance.type,
          isVerified: ambulance.isVerified
        }
      }
    });

  } catch (error) {
    logger.error('Ambulance registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Ambulance registration failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get ambulance profile
 * @route   GET /api/v1/ambulances/profile or /api/v1/ambulances/:id
 * @access  Private
 */
async function getAmbulanceProfile(req, res) {
  try {
    const ambulanceId = req.params.id || req.user.id;

    const ambulance = await Ambulance.findById(ambulanceId)
      .select('-password')
      .populate('baseHospital', 'name location.address phone');

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { ambulance }
    });

  } catch (error) {
    logger.error('Get ambulance profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulance profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update ambulance profile
 * @route   PUT /api/v1/ambulances/profile
 * @access  Private (Ambulance)
 */
async function updateAmbulanceProfile(req, res) {
  try {
    const ambulanceId = req.user.id;
    const updates = req.body;

    // Allowed fields
    const allowedFields = ['driver.name', 'driver.phone', 'equipment', 'baseHospital'];

    const ambulance = await Ambulance.findById(ambulanceId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    // Update fields
    if (updates.driverName) ambulance.driver.name = updates.driverName;
    if (updates.driverPhone) ambulance.driver.phone = updates.driverPhone;
    if (updates.equipment) ambulance.equipment = { ...ambulance.equipment, ...updates.equipment };
    if (updates.baseHospital) ambulance.baseHospital = updates.baseHospital;

    await ambulance.save();

    logger.info(`Ambulance profile updated: ${ambulanceId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { ambulance }
    });

  } catch (error) {
    logger.error('Update ambulance profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update ambulance location (real-time)
 * @route   PUT /api/v1/ambulances/location
 * @access  Private (Ambulance)
 */
async function updateAmbulanceLocation(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { lat, lng, address } = req.body.location || req.body;

    const ambulance = await Ambulance.findById(ambulanceId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    // Update location
    ambulance.updateLocation(lng, lat, address);
    await ambulance.save();

    // Cache in Redis for fast access
    await setCache(
      `${REDIS_KEYS.AMBULANCE_LOCATION}${ambulanceId}`,
      { ambulanceId, lat, lng, timestamp: Date.now() },
      300 // 5 minutes
    );

    // Broadcast via socket
    await updateLocationSocket(ambulanceId, { lat, lng });

    logger.debug(`Ambulance location updated: ${ambulanceId}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: ambulance.currentLocation
      }
    });

  } catch (error) {
    logger.error('Update ambulance location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * @desc    Update ambulance status
 * @route   PUT /api/v1/ambulances/status
 * @access  Private (Ambulance)
 */
async function updateAmbulanceStatus(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { status } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    ambulance.status = status;
    await ambulance.save();

    logger.info(`Ambulance status updated: ${ambulanceId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        status: ambulance.status
      }
    });

  } catch (error) {
    logger.error('Update ambulance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * @desc    Get available ambulances nearby
 * @route   GET /api/v1/ambulances/available/nearby
 * @access  Private
 */
async function getAvailableAmbulances(req, res) {
  try {
    const { lat, lng, maxDistance = 20 } = req.query;

    const ambulances = await Ambulance.find({
      status: 'available',
      isActive: true,
      isVerified: true,
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    }).select('vehicleNumber type driver.name driver.phone currentLocation equipment');

    res.status(200).json({
      success: true,
      count: ambulances.length,
      data: { ambulances }
    });

  } catch (error) {
    logger.error('Get available ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available ambulances',
      error: error.message
    });
  }
};

/**
 * @desc    Get current trip
 * @route   GET /api/v1/ambulances/trip/current
 * @access  Private (Ambulance)
 */
async function getCurrentTrip(req, res) {
  try {
    const ambulanceId = req.user.id;

    const ambulance = await Ambulance.findById(ambulanceId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    if (!ambulance.currentIncident) {
      return res.status(200).json({
        success: true,
        message: 'No active trip',
        data: { trip: null }
      });
    }

    const trip = await Incident.findById(ambulance.currentIncident)
      .populate('patient.userId', 'fullName phone')
      .populate('hospital', 'name location.address emergencyPhone');

    res.status(200).json({
      success: true,
      data: { trip }
    });

  } catch (error) {
    logger.error('Get current trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current trip',
      error: error.message
    });
  }
};

/**
 * @desc    Get trip history
 * @route   GET /api/v1/ambulances/trip/history
 * @access  Private (Ambulance)
 */
async function getTripHistory(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const trips = await Incident.find({ ambulance: ambulanceId })
      .populate('patient.userId', 'fullName')
      .populate('hospital', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments({ ambulance: ambulanceId });

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      pages: Math.ceil(total / limit),
      data: { trips }
    });

  } catch (error) {
    logger.error('Get trip history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip history',
      error: error.message
    });
  }
};

/**
 * @desc    Accept trip request
 * @route   POST /api/v1/ambulances/trip/:incidentId/accept
 * @access  Private (Ambulance)
 */
async function acceptTrip(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { incidentId } = req.params;

    const ambulance = await Ambulance.findById(ambulanceId);
    const incident = await Incident.findById(incidentId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    if (!ambulance.isAvailable()) {
      return res.status(400).json(createError(AMBULANCE_ERRORS.NOT_AVAILABLE));
    }

    // Accept trip
    ambulance.acceptTrip(incidentId);
    await ambulance.save();

    incident.status = 'ambulance_dispatched';
    await incident.save();

    logger.info(`Trip accepted: Ambulance ${ambulanceId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Trip accepted successfully',
      data: { incident }
    });

  } catch (error) {
    logger.error('Accept trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept trip',
      error: error.message
    });
  }
};

/**
 * @desc    Start trip (picked up patient)
 * @route   POST /api/v1/ambulances/trip/:incidentId/start
 * @access  Private (Ambulance)
 */
async function startTrip(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    incident.status = 'patient_picked_up';
    incident.updateStatus('patient_picked_up', ambulanceId, 'Ambulance');
    await incident.save();

    logger.info(`Trip started: Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Trip started successfully'
    });

  } catch (error) {
    logger.error('Start trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start trip',
      error: error.message
    });
  }
};

/**
 * @desc    Complete trip (reached hospital)
 * @route   POST /api/v1/ambulances/trip/:incidentId/complete
 * @access  Private (Ambulance)
 */
async function completeTrip(req, res) {
  try {
    const ambulanceId = req.user.id;
    const { incidentId } = req.params;

    const ambulance = await Ambulance.findById(ambulanceId);
    const incident = await Incident.findById(incidentId);

    if (!ambulance || !incident) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance or incident not found'
      });
    }

    // Complete trip
    ambulance.completeTrip();
    await ambulance.save();

    incident.status = 'reached_hospital';
    incident.updateStatus('reached_hospital', ambulanceId, 'Ambulance');
    await incident.save();

    logger.info(`Trip completed: Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Trip completed successfully'
    });

  } catch (error) {
    logger.error('Complete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete trip',
      error: error.message
    });
  }
};

/**
 * @desc    Get ambulance statistics
 * @route   GET /api/v1/ambulances/stats
 * @access  Private (Ambulance)
 */
async function getAmbulanceStats(req, res) {
  try {
    const ambulanceId = req.user.id;

    const ambulance = await Ambulance.findById(ambulanceId);

    if (!ambulance) {
      return res.status(404).json(createError(AMBULANCE_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: {
        stats: ambulance.stats
      }
    });

  } catch (error) {
    logger.error('Get ambulance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

module.exports = {
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
}