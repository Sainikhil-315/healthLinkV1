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
      // specialties,
      type,
      emergencyPhone,
      facilities
    } = req.body;

    // Validate that location coordinates are provided
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required for hospital registration',
        error:
          'Please enable location services and capture your current location',
      });
    }

    // Validate coordinates are not [0, 0]
    if (location.lat === 0 && location.lng === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates',
        error: 'Please capture a valid location',
      });
    }

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res
        .status(409)
        .json(createError(HOSPITAL_ERRORS.ALREADY_REGISTERED));
    }

    // Generate registration number if not provided
    const finalRegistrationNumber =
      registrationNumber ||
      `TEMP-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

    // // Process specialists - only allow valid objects, never strings
    // let processedSpecialists = [];
    // if (specialties && Array.isArray(specialties)) {
    //   processedSpecialists = specialties
    //     .filter(specialist => typeof specialist === 'object' && specialist.specialization && specialist.name)
    //     .map(specialist => ({
    //       specialization: specialist.specialization,
    //       name: specialist.name,
    //       isAvailable: specialist.isAvailable !== undefined ? specialist.isAvailable : true,
    //       phone: specialist.phone || undefined
    //     }));
    // }

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
        lastUpdated: Date.now(),
      },
      // specialists: processedSpecialists
      facilities: facilities || {
        oxygenAvailable: true,
        ventilators: 0,
        ambulanceService: true,
        bloodBank: false,
        pharmacy24x7: true,
        emergencyRoom: true,
        operationTheater: true
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
        address: address?.street || 'Address pending verification',
        city: address?.city || 'City pending verification',
        state: address?.state || 'State pending verification',
        pincode: address?.pincode || '000000',
      },
    };

    const hospital = await Hospital.create(hospitalData);

    // Send welcome email
    try {
      await sendUserWelcomeEmail({ email, fullName: name }, 'hospital');
    } catch (emailError) {
      logger.warn('Failed to send welcome email:', emailError);
    }

    logger.info(
      `New hospital registered: ${name} at [${location.lng}, ${location.lat}]`,
    );

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
            address: hospital.location.address,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Hospital registration error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
        error: `A hospital with this ${field} is already registered`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Hospital registration failed',
      error: error.message,
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
      data: { hospital },
    });
  } catch (error) {
    logger.error('Get hospital profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hospital profile',
      error: error.message,
    });
  }
}

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
    if (updates.emergencyPhone)
      hospital.emergencyPhone = updates.emergencyPhone;
    if (updates.specialists) hospital.specialists = updates.specialists;
    if (updates.facilities)
      hospital.facilities = { ...hospital.facilities, ...updates.facilities };
    if (updates.acceptingEmergencies !== undefined)
      hospital.acceptingEmergencies = updates.acceptingEmergencies;

    // Address/location updates
    if (updates.address || updates.location) {
      if (!hospital.location) hospital.location = {};
      if (updates.address) {
        hospital.location.address =
          updates.address.street || hospital.location.address;
        hospital.location.city = updates.address.city || hospital.location.city;
        hospital.location.state =
          updates.address.state || hospital.location.state;
        hospital.location.pincode =
          updates.address.pincode || hospital.location.pincode;
      }
      if (updates.location && updates.location.lat && updates.location.lng) {
        hospital.location.coordinates = [
          parseFloat(updates.location.lng),
          parseFloat(updates.location.lat),
        ];
      }
    }

    await hospital.save();

    logger.info(`Hospital profile updated: ${hospitalId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { hospital },
    });
  } catch (error) {
    logger.error('Update hospital profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
}

/**
 * @desc    Update bed availability
 * @route   PUT /api/v1/hospitals/beds
 * @access  Private (Hospital)
 */
async function updateBedAvailability(req, res) {
  try {
    // Debug: Log incoming request body for troubleshooting
    console.log('updateBedAvailability req.body:', req.body);
    // FIXED: Add validation for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const hospitalId = req.user.id;
    const { bedType, available, total } = req.body;

    // FIXED: Validate input
    if (!bedType || available === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'bedType and available are required',
          statusCode: 400,
        },
      });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    // Validate bedType
    const validBedTypes = ['general', 'icu', 'emergency'];
    if (!validBedTypes.includes(bedType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: 'Invalid bed type. Must be general, icu, or emergency',
          statusCode: 400,
        },
      });
    }

    // Initialize beds if they don't exist
    if (!hospital.bedAvailability[bedType]) {
      hospital.bedAvailability[bedType] = { total: 0, available: 0 };
    }

    // Initialize beds if they're 0/0
    if (
      !hospital.bedAvailability.general.total &&
      !hospital.bedAvailability.general.available
    ) {
      hospital.bedAvailability.general = { total: 50, available: 50 };
    }
    if (
      !hospital.bedAvailability.icu.total &&
      !hospital.bedAvailability.icu.available
    ) {
      hospital.bedAvailability.icu = { total: 20, available: 20 };
    }
    if (
      !hospital.bedAvailability.emergency.total &&
      !hospital.bedAvailability.emergency.available
    ) {
      hospital.bedAvailability.emergency = { total: 10, available: 10 };
    }

    // Update the selected bed type (no upper limit)
    hospital.bedAvailability[bedType].available = Math.max(0, available);
    // If total is provided, update it as well
    if (typeof total === 'number' && total >= 0) {
      hospital.bedAvailability[bedType].total = total;
    }
    // If available exceeds total, auto-increase total to match available
    if (
      hospital.bedAvailability[bedType].available >
      hospital.bedAvailability[bedType].total
    ) {
      hospital.bedAvailability[bedType].total =
        hospital.bedAvailability[bedType].available;
    }

    hospital.bedAvailability.lastUpdated = Date.now();
    await hospital.save();

    logger.info(
      `Bed availability updated for hospital ${hospitalId}:`,
      hospital.bedAvailability,
    );

    res.status(200).json({
      success: true,
      message: 'Bed availability updated',
      data: {
        bedAvailability: hospital.bedAvailability,
      },
    });
  } catch (error) {
    logger.error('Update bed availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed availability',
      error: error.message,
    });
  }
}

/**
 * @desc    Get incoming patients
 * @route   GET /api/v1/hospitals/patients/incoming
 * @access  Private (Hospital)
 */
async function getIncomingPatients(req, res) {
  res.status(200).json({ success: true, data: [] });
}

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
        message: 'Hospital or incident not found',
      });
    }

    // Update incident status
    incident.updateStatus('reached_hospital', hospitalId, 'Hospital');
    await incident.save();

    // Decrease available beds
    hospital.updateBeds('emergency', -1);
    await hospital.save();

    logger.info(
      `Patient arrival confirmed: Incident ${incidentId} at Hospital ${hospitalId}`,
    );

    res.status(200).json({
      success: true,
      message: 'Patient arrival confirmed',
      data: { incident },
    });
  } catch (error) {
    logger.error('Confirm patient arrival error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm patient arrival',
      error: error.message,
    });
  }
}

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
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistance * 1000,
        },
      },
    })
      .select(
        'name location bedAvailability specialists facilities phone emergencyPhone',
      )
      .limit(10);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: { hospitals },
    });
  } catch (error) {
    logger.error('Get available hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available hospitals',
      error: error.message,
    });
  }
}

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
      isVerified: true,
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
      data: { hospitals },
    });
  } catch (error) {
    logger.error('Search hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search hospitals',
      error: error.message,
    });
  }
}

/**
 * @desc    Get hospital statistics
 * @route   GET /api/v1/hospitals/stats
 * @access  Private (Hospital)
 */
async function getHospitalStats(req, res) {
  try {
    // Debug: Log authentication and request info
    console.log('--- getHospitalStats DEBUG ---');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request user:', req.user);
    console.log('-----------------------------');
    // FIXED: Add validation for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const hospitalId = req.user.id;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json(createError(HOSPITAL_ERRORS.NOT_FOUND));
    }

    // Get all incidents for this hospital
    const incidents = await Incident.find({ hospital: hospitalId }).lean();

    // Total patients ever
    const totalPatients = incidents.length;

    // Active patients (status in progress)
    const activePatients = incidents.filter(inc =>
      ['ambulance_dispatched', 'patient_picked_up', 'en_route_hospital'].includes(inc.status)
    ).length;

    // Today's admitted patients
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const admitsToday = incidents.filter(inc =>
      inc.admittedAt && new Date(inc.admittedAt) >= today
    ).length;

    // Occupancy: total beds - available beds (all types)
    let totalBeds = 0;
    let totalAvailable = 0;
    Object.values(hospital.bedAvailability).forEach(bed => {
      if (bed && typeof bed.total === 'number' && typeof bed.available === 'number') {
        totalBeds += bed.total;
        totalAvailable += bed.available;
      }
    });
    const occupiedBeds = totalBeds - totalAvailable;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Average response time (from incident, if available)
    const responseTimes = incidents
      .filter(inc => inc.responseTime && typeof inc.responseTime === 'number')
      .map(inc => inc.responseTime);
    const averageResponseTime = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Build dynamic bed stats array
    const bedStats = Object.entries(hospital.bedAvailability)
      .filter(([key]) => key !== 'lastUpdated')
      .map(([type, info]) => ({
        type,
        total: info.total,
        available: info.available,
      }));

    res.status(200).json({
      success: true,
      data: {
        bedAvailability: hospital.bedAvailability,
        bedStats, // dynamic array for frontend
        patients: {
          total: totalPatients,
          active: activePatients,
        },
        admitsToday,
        occupancyRate,
        occupiedBeds,
        totalBeds,
        totalPatientsHandled: totalPatients,
        averageResponseTime,
        specialists: hospital.specialists.length,
        facilities: hospital.facilities,
      },
    });
  } catch (error) {
    logger.error('Get hospital stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
}

/**
 * @desc    Get patient history for hospital
 * @route   GET /api/v1/hospitals/patient-history
 * @access  Private (Hospital)
 */
async function getPatientHistory(req, res) {
  try {
    const hospitalId = req.user?.id;
    const { startDate, endDate } = req.query;

    // FIXED: Moved console.log to correct position
    console.log(
      'Fetching patient history for hospital:',
      hospitalId,
      'from',
      startDate,
      'to',
      endDate,
    );

    if (!hospitalId) {
      return res
        .status(401)
        .json(createError(HOSPITAL_ERRORS.HOSPITAL_NOT_FOUND));
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
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    })
      .select(
        'patientName patientAge bloodType severity status admittedAt dischargedAt bedType',
      )
      .sort({ admittedAt: -1 })
      .lean();

    // Format response to match frontend expectations
    const formattedData = incidents.map(incident => ({
      _id: incident._id,
      patient: {
        name: incident.patientName,
        age: incident.patientAge,
        bloodType: incident.bloodType,
      },
      severity: incident.severity,
      status: incident.status,
      admittedAt: incident.admittedAt,
      dischargedAt: incident.dischargedAt,
      bedType: incident.bedType,
    }));

    res.status(200).json({
      success: true,
      message: 'Patient history retrieved successfully',
      data: formattedData,
    });
  } catch (error) {
    logger.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient history',
      error: error.message,
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
  getPatientHistory,
};
