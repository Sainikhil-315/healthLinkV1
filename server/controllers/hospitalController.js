const Hospital = require('../models/Hospital.js');
const Incident = require('../models/Incident.js');
const { HOSPITAL_ERRORS, createError } = require('../utils/errorMessages.js');
const { sendUserWelcomeEmail } = require('../services/emailService.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Register new hospital
 * @route   POST /api/v1/hospitals/register
 * @access  Public
 */
async function registerHospital(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      location,
      address,
      registrationNumber,
      beds,
      specialties,
      type,
      emergencyPhone
    } = req.body;

    // Validate that location coordinates are provided
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required for hospital registration',
        error: 'Please enable location services and capture your current location'
      });
    }

    // Validate coordinates are not [0, 0]
    if (location.lat === 0 && location.lng === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates',
        error: 'Please capture a valid location'
      });
    }

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(409).json(createError(HOSPITAL_ERRORS.ALREADY_REGISTERED));
    }

    // Generate registration number if not provided
    const finalRegistrationNumber = registrationNumber || 
      `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create hospital data with required location
    const hospitalData = {
      name,
      email,
      phone,
      emergencyPhone: emergencyPhone || phone,
      password,
      registrationNumber: finalRegistrationNumber,
      type: type || 'Private',
      bedAvailability: beds || {
        general: { total: 50, available: 50 },
        icu: { total: 20, available: 20 },
        emergency: { total: 10, available: 10 },
        lastUpdated: Date.now()
      },
      specialists: specialties || [],
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)], // [longitude, latitude]
        address: address?.street || 'Address pending verification',
        city: address?.city || 'City pending verification',
        state: address?.state || 'State pending verification',
        pincode: address?.pincode || '000000'
      }
    };

    const hospital = await Hospital.create(hospitalData);

    // Send welcome email
    try {
      await sendUserWelcomeEmail({ email, fullName: name }, 'hospital');
    } catch (emailError) {
      logger.warn('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    logger.info(`New hospital registered: ${name} at [${location.lng}, ${location.lat}]`);

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Awaiting admin verification.',
      data: {
        hospital: {
          id: hospital._id,
          name: hospital.name,
          email: hospital.email,
          isVerified: hospital.isVerified,
          location: {
            coordinates: hospital.location.coordinates,
            address: hospital.location.address
          }
        }
      }
    });

  } catch (error) {
    logger.error('Hospital registration error:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        error: `A hospital with this ${field} is already registered`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Hospital registration failed',
      error: error.message
    });
  }
}


/**
 * @desc    Get hospital profile
 * @route   GET /api/v1/hospitals/profile or /api/v1/hospitals/:id
 * @access  Private
 */
async function getHospitalProfile(req, res) {
  try {
    const hospitalId = req.params.id || req.user.id;

    const hospital = await Hospital.findById(hospitalId).select('-password');

    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { hospital }
    });

  } catch (error) {
    logger.error('Get hospital profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update hospital profile
 * @route   PUT /api/v1/hospitals/profile
 * @access  Private (Hospital)
 */
async function updateHospitalProfile(req, res) {
  try {
    const hospitalId = req.user.id;
    const updates = req.body;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    // Update allowed fields
    if (updates.phone) hospital.phone = updates.phone;
    if (updates.emergencyPhone) hospital.emergencyPhone = updates.emergencyPhone;
    if (updates.specialists) hospital.specialists = updates.specialists;
    if (updates.facilities) hospital.facilities = { ...hospital.facilities, ...updates.facilities };
    if (updates.acceptingEmergencies !== undefined) hospital.acceptingEmergencies = updates.acceptingEmergencies;

    // Address/location updates
    if (updates.address || updates.location) {
      // If address is provided, update address fields
      if (!hospital.location) hospital.location = {};
      if (updates.address) {
        hospital.location.address = updates.address.street || hospital.location.address;
        hospital.location.city = updates.address.city || hospital.location.city;
        hospital.location.state = updates.address.state || hospital.location.state;
        hospital.location.pincode = updates.address.pincode || hospital.location.pincode;
      }
      // If location coordinates are provided, update them
      if (updates.location && updates.location.lat && updates.location.lng) {
        hospital.location.coordinates = [parseFloat(updates.location.lng), parseFloat(updates.location.lat)];
      }
    }

    await hospital.save();

    logger.info(`Hospital profile updated: ${hospitalId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { hospital }
    });

  } catch (error) {
    logger.error('Update hospital profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update bed availability
 * @route   PUT /api/v1/hospitals/beds
 * @access  Private (Hospital)
 */
async function updateBedAvailability(req, res) {
  try {
    const hospitalId = req.user.id;
    const { general, icu, emergency } = req.body;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    // Initialize beds if they're 0/0
    if (!hospital.bedAvailability.general.total && !hospital.bedAvailability.general.available) {
      hospital.bedAvailability.general = { total: 50, available: 50 };
    }
    if (!hospital.bedAvailability.icu.total && !hospital.bedAvailability.icu.available) {
      hospital.bedAvailability.icu = { total: 20, available: 20 };
    }
    if (!hospital.bedAvailability.emergency.total && !hospital.bedAvailability.emergency.available) {
      hospital.bedAvailability.emergency = { total: 10, available: 10 };
    }

    // Update bed availability
    if (general !== undefined) {
      if (typeof general === 'number') {
        // If just a number, treat as available beds
        hospital.bedAvailability.general.available = Math.min(general, hospital.bedAvailability.general.total);
      } else {
        // If object with available/total properties
        if (general.available !== undefined) {
          hospital.bedAvailability.general.available = general.available;
        }
        if (general.total !== undefined) {
          hospital.bedAvailability.general.total = general.total;
          // If available > total, cap it
          if (hospital.bedAvailability.general.available > general.total) {
            hospital.bedAvailability.general.available = general.total;
          }
        }
      }
    }

    if (icu !== undefined) {
      if (typeof icu === 'number') {
        hospital.bedAvailability.icu.available = Math.min(icu, hospital.bedAvailability.icu.total);
      } else {
        if (icu.available !== undefined) {
          hospital.bedAvailability.icu.available = icu.available;
        }
        if (icu.total !== undefined) {
          hospital.bedAvailability.icu.total = icu.total;
          if (hospital.bedAvailability.icu.available > icu.total) {
            hospital.bedAvailability.icu.available = icu.total;
          }
        }
      }
    }

    if (emergency !== undefined) {
      if (typeof emergency === 'number') {
        hospital.bedAvailability.emergency.available = Math.min(emergency, hospital.bedAvailability.emergency.total);
      } else {
        if (emergency.available !== undefined) {
          hospital.bedAvailability.emergency.available = emergency.available;
        }
        if (emergency.total !== undefined) {
          hospital.bedAvailability.emergency.total = emergency.total;
          if (hospital.bedAvailability.emergency.available > emergency.total) {
            hospital.bedAvailability.emergency.available = emergency.total;
          }
        }
      }
    }

    hospital.bedAvailability.lastUpdated = Date.now();

    await hospital.save();

    logger.info(`Bed availability updated for hospital ${hospitalId}`, hospital.bedAvailability);

    res.status(200).json({
      success: true,
      message: 'Bed availability updated successfully',
      data: {
        bedAvailability: hospital.bedAvailability
      }
    });

  } catch (error) {
    logger.error('Update bed availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get incoming patients (assigned ambulances)
 * @route   GET /api/v1/hospitals/patients/incoming
 * @access  Private (Hospital)
 */
async function getIncomingPatients(req, res) {
  try {
    const hospitalId = req.user.id;

    const incidents = await Incident.find({
      hospital: hospitalId,
      status: { $in: ['ambulance_dispatched', 'patient_picked_up', 'en_route_hospital'] }
    })
      .populate('ambulance', 'vehicleNumber driver.name driver.phone')
      .populate('patient.userId', 'fullName phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: { incidents }
    });

  } catch (error) {
    logger.error('Get incoming patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incoming patients',
      error: error.message
    });
  }
};

/**
 * @desc    Confirm patient arrival
 * @route   POST /api/v1/hospitals/patients/:incidentId/arrived
 * @access  Private (Hospital)
 */
async function confirmPatientArrival(req, res) {
  try {
    const hospitalId = req.user.id;
    const { incidentId } = req.params;

    const hospital = await Hospital.findById(hospitalId);
    const incident = await Incident.findById(incidentId);

    if (!hospital || !incident) {
      return res.status(404).json({
        success: false,
        message: 'Hospital or incident not found'
      });
    }

    // Update incident status
    incident.updateStatus('reached_hospital', hospitalId, 'Hospital');
    await incident.save();

    // Decrease available beds
    hospital.updateBeds('emergency', -1);
    await hospital.save();

    logger.info(`Patient arrival confirmed: Incident ${incidentId} at Hospital ${hospitalId}`);

    res.status(200).json({
      success: true,
      message: 'Patient arrival confirmed',
      data: { incident }
    });

  } catch (error) {
    logger.error('Confirm patient arrival error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm patient arrival',
      error: error.message
    });
  }
};

/**
 * @desc    Get available hospitals nearby
 * @route   GET /api/v1/hospitals/available/nearby
 * @access  Private
 */
async function getAvailableHospitals(req, res) {
  try {
    const { lat, lng, maxDistance = 30, bedType = 'emergency' } = req.query;

    const hospitals = await Hospital.find({
      isActive: true,
      isVerified: true,
      acceptingEmergencies: true,
      [`bedAvailability.${bedType}.available`]: { $gt: 0 },
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistance * 1000
        }
      }
    })
      .select('name location bedAvailability specialists facilities phone emergencyPhone')
      .limit(10);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: { hospitals }
    });

  } catch (error) {
    logger.error('Get available hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available hospitals',
      error: error.message
    });
  }
};

/**
 * @desc    Search hospitals by name/location
 * @route   GET /api/v1/hospitals/search
 * @access  Private
 */
async function searchHospitals(req, res) {
  try {
    const { query, city, specialty } = req.query;

    const searchQuery = {
      isActive: true,
      isVerified: true
    };

    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' };
    }

    if (city) {
      searchQuery['location.city'] = { $regex: city, $options: 'i' };
    }

    if (specialty) {
      searchQuery['specialists.specialization'] = specialty;
    }

    const hospitals = await Hospital.find(searchQuery)
      .select('name location bedAvailability specialists phone')
      .limit(20);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: { hospitals }
    });

  } catch (error) {
    logger.error('Search hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search hospitals',
      error: error.message
    });
  }
};

/**
 * @desc    Get hospital statistics
 * @route   GET /api/v1/hospitals/stats
 * @access  Private (Hospital)
 */
async function getHospitalStats(req, res) {
  try {
    const hospitalId = req.user.id;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    // Get incident statistics
    const totalPatients = await Incident.countDocuments({ hospital: hospitalId });
    const activePatients = await Incident.countDocuments({
      hospital: hospitalId,
      status: { $in: ['ambulance_dispatched', 'patient_picked_up', 'en_route_hospital'] }
    });

    res.status(200).json({
      success: true,
      data: {
        bedAvailability: hospital.bedAvailability,
        patients: {
          total: totalPatients,
          active: activePatients
        },
        totalPatientsHandled: hospital.totalPatientsHandled,
        averageResponseTime: hospital.averageResponseTime,
        specialists: hospital.specialists.length,
        facilities: hospital.facilities
      }
    });

  } catch (error) {
    logger.error('Get hospital stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get patient history for hospital
 * @route   GET /api/v1/hospital/patient-history
 * @access  Private (Hospital)
 */
async function getPatientHistory(req, res) {
  try {
    console.log('Fetching patient history for hospital:', hospitalId, 'from', startDate, 'to', endDate);
    const hospitalId = req.user?.id;
    const { startDate, endDate } = req.query;
    if (!hospitalId) {
      return res.status(401).json(createError(HOSPITAL_ERRORS.HOSPITAL_NOT_FOUND));
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    // Find incidents for this hospital
    const incidents = await Incident.find({
      hospitalId: hospitalId,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    })
      .select('patientName patientAge bloodType severity status admittedAt dischargedAt bedType')
      .sort({ admittedAt: -1 })
      .lean();

    // Format response to match frontend expectations
    const formattedData = incidents.map(incident => ({
      _id: incident._id,
      patient: {
        name: incident.patientName,
        age: incident.patientAge,
        bloodType: incident.bloodType
      },
      severity: incident.severity,
      status: incident.status,
      admittedAt: incident.admittedAt,
      dischargedAt: incident.dischargedAt,
      bedType: incident.bedType
    }));

    res.status(200).json({
      success: true,
      message: 'Patient history retrieved successfully',
      data: formattedData
    });
  } catch (error) {
    logger.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient history',
      error: error.message
    });
  }
}

module.exports = {
  registerHospital,
  getHospitalProfile,
  updateHospitalProfile,
  updateBedAvailability,
  getIncomingPatients,
  confirmPatientArrival,
  getAvailableHospitals,
  searchHospitals,
  getHospitalStats,
  getPatientHistory
}