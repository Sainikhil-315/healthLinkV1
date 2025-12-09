const User = require('../models/User.js');
const Incident = require('../models/Incident.js');
const { uploadProfilePicture: uploadToCloudinary } = require('../config/cloudinary.js');
const { USER_ERRORS, createError } = require('../utils/errorMessages.js');
const logger = require('../utils/logger.js');

/**
 * @desc    Create new user (admin creation endpoint)
 * @route   POST /api/v1/users
 * @access  Public (for admin creation via Postman)
 */
async function createUser(req, res) {
  try {
    const { fullName, email, phone, password, role, isEmailVerified, isPhoneVerified, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json(createError(USER_ERRORS.ALREADY_EXISTS));
      }
      return res.status(409).json(createError(USER_ERRORS.PHONE_EXISTS));
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || 'user',
      isEmailVerified: isEmailVerified || false,
      isPhoneVerified: isPhoneVerified || false,
      isActive: isActive !== undefined ? isActive : true
    });

    logger.info(`New user created: ${email} with role: ${role || 'user'}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
}

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile or /api/v1/users/:id
 * @access  Private
 */
async function getUserProfile(req, res) {
  try {
    const userId = req.params.id || req.user.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private (User)
 */
async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Fields that can be updated
    const allowedFields = [
      'fullName',
      'phone',
      'dateOfBirth',
      'address',
      'bloodGroup'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    logger.info(`User profile updated: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user location
 * @route   PUT /api/v1/users/location
 * @access  Private (User)
 */
async function updateLocation(req, res) {
  try {
    const userId = req.user.id;
    const { lat, lng, address } = req.body.location || req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    user.updateLocation(lng, lat, address);
    await user.save();

    logger.debug(`Location updated for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.currentLocation
      }
    });

  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * @desc    Add emergency contact
 * @route   POST /api/v1/users/emergency-contacts
 * @access  Private (User)
 */
async function addEmergencyContact(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone, relation } = req.body;

    const user = await User.findById(userId);
    console.log("User fetched:", user);
    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Check limit
    if (user.emergencyContacts.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 emergency contacts allowed'
      });
    }

    user.emergencyContacts.push({ name, phone, relation });
    await user.save();

    logger.info(`Emergency contact added for user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });

  } catch (error) {
    logger.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
};

/**
 * @desc    Get emergency contacts
 * @route   GET /api/v1/users/emergency-contacts
 * @access  Private (User)
 */
async function getEmergencyContacts(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findOne({ _id: userId }).select('emergencyContacts');

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    res.status(200).json({
      success: true,
      data: {
        emergencyContacts: user.emergencyContacts
      }
    });

  } catch (error) {
    logger.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message
    });
  }
};

/**
 * @desc    Update emergency contact
 * @route   PUT /api/v1/users/emergency-contacts/:contactId
 * @access  Private (User)
 */
async function updateEmergencyContact(req, res) {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    const contact = user.emergencyContacts.id(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    Object.assign(contact, updates);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: { emergencyContacts: user.emergencyContacts }
    });

  } catch (error) {
    logger.error('Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact',
      error: error.message
    });
  }
};

/**
 * @desc    Delete emergency contact
 * @route   DELETE /api/v1/users/emergency-contacts/:contactId
 * @access  Private (User)
 */
async function deleteEmergencyContact(req, res) {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Find and verify the specific emergency contact exists by _id
    const contact = user.emergencyContacts.id(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    // Use pull to remove only the contact with matching _id
    user.emergencyContacts.pull(contactId);
    await user.save();

    logger.info(`Emergency contact deleted for user ${userId}: ${contactId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });

  } catch (error) {
    logger.error('Delete emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact',
      error: error.message
    });
  }
};

/**
 * @desc    Update health profile
 * @route   PUT /api/v1/users/health-profile
 * @access  Private (User)
 */
async function updateHealthProfile(req, res) {
  try {
    const userId = req.user.id;
    const { bloodType, allergies, chronicConditions, currentMedications, weight, height } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Update health profile
    if (!user.healthProfile) {
      user.healthProfile = {};
    }

    if (bloodType) user.healthProfile.bloodType = bloodType;
    if (allergies) user.healthProfile.allergies = allergies;
    if (chronicConditions) user.healthProfile.chronicConditions = chronicConditions;
    if (currentMedications) user.healthProfile.currentMedications = currentMedications;
    if (weight) user.healthProfile.weight = weight;
    if (height) user.healthProfile.height = height;

    user.healthProfile.lastUpdated = Date.now();

    await user.save();

    logger.info(`Health profile updated for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: {
        healthProfile: user.healthProfile
      }
    });

  } catch (error) {
    logger.error('Update health profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health profile',
      error: error.message
    });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/v1/users/profile-picture
 * @access  Private (User)
 */
async function uploadProfilePicture(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, userId);

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: result.url
      }
    });

  } catch (error) {
    logger.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/v1/users/stats
 * @access  Private (User)
 */
async function getUserStats(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(createError(USER_ERRORS.NOT_FOUND));
    }

    // Get incident statistics
    const totalIncidents = await Incident.countDocuments({
      $or: [{ reportedBy: userId }, { 'patient.userId': userId }]
    });

    const resolvedIncidents = await Incident.countDocuments({
      $or: [{ reportedBy: userId }, { 'patient.userId': userId }],
      status: 'resolved'
    });

    const activeIncident = await Incident.findOne({
      $or: [{ reportedBy: userId }, { 'patient.userId': userId }],
      status: { $in: ['pending', 'ambulance_dispatched', 'en_route_hospital'] }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmergencies: totalIncidents,
          resolvedEmergencies: resolvedIncidents,
          activeEmergency: activeIncident ? true : false,
          accountCreated: user.createdAt,
          profileComplete: !!(
            user.healthProfile?.bloodType &&
            user.emergencyContacts.length > 0
          )
        }
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/users/account
 * @access  Private (User)
 */
async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;

    // Check for active emergencies
    const activeEmergency = await Incident.findOne({
      reportedBy: userId,
      status: { $in: ['pending', 'ambulance_dispatched', 'en_route_hospital'] }
    });

    if (activeEmergency) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active emergency'
      });
    }

    await User.findByIdAndDelete(userId);

    logger.info(`User account deleted: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  getUserProfile,
  updateUserProfile,
  updateLocation,
  addEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  updateHealthProfile,
  uploadProfilePicture,
  getUserStats,
  deleteAccount
}