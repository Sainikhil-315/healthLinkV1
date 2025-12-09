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

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({
      $or: [{ email }, { registrationNumber }]
    });

    if (existingHospital) {
      return res.status(409).json(createError(HOSPITAL_ERRORS.ALREADY_REGISTERED));
    }

    // Create hospital
    const hospital = await Hospital.create({
      name,
      email,
      phone,
      emergencyPhone: emergencyPhone || phone,
      password,
      registrationNumber,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      },
      type: type || 'Private',
      bedAvailability: beds,
      specialists: specialties || []
    });

    // Send welcome email
    await sendUserWelcomeEmail({ email, fullName: name }, 'hospital');

    logger.info(`New hospital registered: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Awaiting admin verification.',
      data: {
        hospital: {
          id: hospital._id,
          name: hospital.name,
          email: hospital.email,
          isVerified: hospital.isVerified
        }
      }
    });

  } catch (error) {
    logger.error('Hospital registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Hospital registration failed',
      error: error.message
    });
  }
};

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

    // Update bed availability
    if (general) {
      hospital.bedAvailability.general.available = general.available;
      if (general.total !== undefined) hospital.bedAvailability.general.total = general.total;
    }

    if (icu) {
      hospital.bedAvailability.icu.available = icu.available;
      if (icu.total !== undefined) hospital.bedAvailability.icu.total = icu.total;
    }

    if (emergency) {
      hospital.bedAvailability.emergency.available = emergency.available;
      if (emergency.total !== undefined) hospital.bedAvailability.emergency.total = emergency.total;
    }

    hospital.bedAvailability.lastUpdated = Date.now();

    await hospital.save();

    logger.info(`Bed availability updated for hospital ${hospitalId}`);

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

module.exports = {
  registerHospital,
  getHospitalProfile,
  updateHospitalProfile,
  updateBedAvailability,
  getIncomingPatients,
  confirmPatientArrival,
  getAvailableHospitals,
  searchHospitals,
  getHospitalStats
}