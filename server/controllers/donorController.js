const Donor = require('../models/Donor.js');
const Incident = require('../models/Incident.js');
const Hospital = require('../models/Hospital.js');
const { DONOR_ERRORS, createError } = require('../utils/errorMessages.js');
const { sendUserWelcomeEmail } = require('../services/emailService.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Register as blood donor
 * @route   POST /api/v1/donors/register
 * @access  Public
 */
async function registerDonor(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      bloodGroup,
      dateOfBirth,
      gender,
      address,
      location,
      weight,
      lastDonationDate
    } = req.body;

    // Check if donor already exists
    const existingDonor = await Donor.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingDonor) {
      return res.status(409).json({
        success: false,
        message: 'Donor with this email or phone already exists'
      });
    }

    // Create donor
    const donor = await Donor.create({
      fullName: name,
      email,
      phone,
      password,
      bloodType: bloodGroup,
      dateOfBirth,
      gender,
      homeAddress: address,
      currentLocation: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: address.street || ''
      },
      healthInfo: {
        weight: weight || 50,
        hasChronicIllness: false,
        isOnMedication: false
      },
      lastDonationDate: lastDonationDate || null
    });

    // Send welcome email
    await sendUserWelcomeEmail({ email, fullName: name }, 'donor');

    logger.info(`New donor registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Donor registration successful',
      data: {
        donor: {
          id: donor._id,
          name: donor.fullName,
          email: donor.email,
          bloodType: donor.bloodType,
          isEligible: donor.isEligibleToDonate()
        }
      }
    });

  } catch (error) {
    logger.error('Donor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Donor registration failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get donor profile
 * @route   GET /api/v1/donors/profile or /api/v1/donors/:id
 * @access  Private
 */
async function getDonorProfile(req, res) {
  try {
    const donorId = req.params.id || req.user.id;

    const donor = await Donor.findById(donorId).select('-password');

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { donor }
    });

  } catch (error) {
    logger.error('Get donor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update donor profile
 * @route   PUT /api/v1/donors/profile
 * @access  Private (Donor)
 */
async function updateDonorProfile(req, res) {
  try {
    const donorId = req.user.id;
    const updates = req.body;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    // Update allowed fields
    if (updates.fullName) donor.fullName = updates.fullName;
    if (updates.phone) donor.phone = updates.phone;
    if (updates.homeAddress) donor.homeAddress = updates.homeAddress;
    if (updates.weight) donor.healthInfo.weight = updates.weight;
    if (updates.responseRadius) donor.responseRadius = updates.responseRadius;

    await donor.save();

    logger.info(`Donor profile updated: ${donorId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { donor }
    });

  } catch (error) {
    logger.error('Update donor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update donor location
 * @route   PUT /api/v1/donors/location
 * @access  Private (Donor)
 */
async function updateDonorLocation(req, res) {
  try {
    const donorId = req.user.id;
    const { lat, lng, address } = req.body.location || req.body;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    donor.updateLocation(lng, lat, address);
    await donor.save();

    logger.debug(`Donor location updated: ${donorId}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: donor.currentLocation
      }
    });

  } catch (error) {
    logger.error('Update donor location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * @desc    Update donor availability status
 * @route   PUT /api/v1/donors/status
 * @access  Private (Donor)
 */
async function updateDonorStatus(req, res) {
  try {
    const donorId = req.user.id;
    const { status } = req.body;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    donor.status = status;
    await donor.save();

    logger.info(`Donor status updated: ${donorId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        status: donor.status
      }
    });

  } catch (error) {
    logger.error('Update donor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * @desc    Check donation eligibility
 * @route   GET /api/v1/donors/eligibility
 * @access  Private (Donor)
 */
async function checkEligibility(req, res) {
  try {
    const donorId = req.user.id;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    const isEligible = donor.isEligibleToDonate();
    const daysUntilEligible = donor.getDaysUntilEligible();

    res.status(200).json({
      success: true,
      data: {
        isEligible,
        daysUntilEligible,
        lastDonationDate: donor.lastDonationDate,
        nextEligibleDate: donor.nextEligibleDate,
        weight: donor.healthInfo.weight,
        minWeight: 45
      }
    });

  } catch (error) {
    logger.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

/**
 * @desc    Get donation history
 * @route   GET /api/v1/donors/history
 * @access  Private (Donor)
 */
async function getDonationHistory(req, res) {
  try {
    const donorId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const donations = await Incident.find({
      bloodDonor: donorId,
      bloodRequired: true
    })
      .populate('hospital', 'name location.address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments({ bloodDonor: donorId });

    res.status(200).json({
      success: true,
      count: donations.length,
      total,
      pages: Math.ceil(total / limit),
      data: { donations }
    });

  } catch (error) {
    logger.error('Get donation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation history',
      error: error.message
    });
  }
};

/**
 * @desc    Accept donation request
 * @route   POST /api/v1/donors/request/:incidentId/accept
 * @access  Private (Donor)
 */
async function acceptDonationRequest(req, res) {
  try {
    const donorId = req.user.id;
    const { incidentId } = req.params;

    const donor = await Donor.findById(donorId);
    const incident = await Incident.findById(incidentId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    if (!donor.isEligibleToDonate()) {
      return res.status(400).json(createError(DONOR_ERRORS.NOT_ELIGIBLE));
    }

    // Accept request
    donor.acceptRequest(incidentId);
    await donor.save();

    incident.bloodDonor = donorId;
    incident.updateStatus('blood_donor_accepted', donorId, 'Donor');
    await incident.save();

    logger.info(`Donation request accepted: Donor ${donorId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Donation request accepted',
      data: { incident }
    });

  } catch (error) {
    logger.error('Accept donation request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept donation request',
      error: error.message
    });
  }
};

/**
 * @desc    Decline donation request
 * @route   POST /api/v1/donors/request/:incidentId/decline
 * @access  Private (Donor)
 */
async function declineDonationRequest(req, res) {
  try {
    const donorId = req.user.id;
    const { incidentId } = req.params;
    const { reason } = req.body;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    logger.info(`Donation request declined: Donor ${donorId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Donation request declined'
    });

  } catch (error) {
    logger.error('Decline donation request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline request',
      error: error.message
    });
  }
};

/**
 * @desc    Complete donation
 * @route   POST /api/v1/donors/request/:incidentId/complete
 * @access  Private (Donor)
 */
async function completeDonation(req, res) {
  try {
    const donorId = req.user.id;
    const { incidentId } = req.params;

    const donor = await Donor.findById(donorId);
    const incident = await Incident.findById(incidentId);

    if (!donor || !incident) {
      return res.status(404).json({
        success: false,
        message: 'Donor or incident not found'
      });
    }

    // Complete donation
    donor.completeDonation();
    await donor.save();

    incident.updateStatus('blood_transfused', donorId, 'Donor');
    await incident.save();

    logger.info(`Donation completed: Donor ${donorId} -> Incident ${incidentId}`);

    res.status(200).json({
      success: true,
      message: 'Donation completed successfully. Thank you for saving a life!'
    });

  } catch (error) {
    logger.error('Complete donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation',
      error: error.message
    });
  }
};

/**
 * @desc    Get donor statistics
 * @route   GET /api/v1/donors/stats
 * @access  Private (Donor)
 */
async function getDonorStats(req, res) {
  try {
    const donorId = req.user.id;

    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json(createError(DONOR_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: {
        stats: donor.stats,
        badges: donor.badges,
        nextEligibleDate: donor.nextEligibleDate,
        isEligible: donor.isEligibleToDonate()
      }
    });

  } catch (error) {
    logger.error('Get donor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Find compatible donors for blood group
 * @route   GET /api/v1/donors/find/compatible
 * @access  Private (Hospital/Admin)
 */
async function findCompatibleDonors(req, res) {
  try {
    const { bloodGroup, lat, lng, maxDistance = 10 } = req.query;

    const compatibleGroups = Donor.getCompatibleBloodTypes(bloodGroup);

    const donors = await Donor.find({
      bloodType: { $in: compatibleGroups },
      status: 'available',
      isActive: true,
      isVerified: true,
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistance * 1000
        }
      }
    })
      .select('fullName bloodType phone currentLocation stats')
      .limit(20);

    res.status(200).json({
      success: true,
      count: donors.length,
      data: { donors }
    });

  } catch (error) {
    logger.error('Find compatible donors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find donors',
      error: error.message
    });
  }
};

module.exports = {
  registerDonor,
  getDonorProfile,
  updateDonorProfile,
  updateDonorLocation,
  updateDonorStatus,
  checkEligibility,
  getDonationHistory,
  acceptDonationRequest,
  declineDonationRequest,
  completeDonation,
  getDonorStats,
  findCompatibleDonors
}