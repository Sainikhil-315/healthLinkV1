const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const certificationSchema = new mongoose.Schema({
  organization: {
    type: String,
    required: true,
    enum: [
      'Red Cross',
      'St. John Ambulance',
      'American Heart Association',
      'Indian Red Cross Society',
      'National Safety Council',
      'Other'
    ]
  },
  certificateNumber: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  certificateImage: {
    type: String, // Cloudinary URL
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: Date,
  rejectionReason: String
}, { _id: false });

const volunteerSchema = new mongoose.Schema({
  // Basic Info
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Invalid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  
  // Personal Details
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  
  // Location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Home Address
  homeAddress: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: /^\d{6}$/
    }
  },
  
  // CPR Certification
  certification: {
    type: certificationSchema,
    required: true
  },
  
  // Skills
  skills: {
    cprCertified: {
      type: Boolean,
      default: true,
      required: true
    },
    firstAidTrained: {
      type: Boolean,
      default: false
    },
    medicalBackground: {
      type: Boolean,
      default: false
    },
    languagesKnown: [{
      type: String,
      enum: ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Other']
    }]
  },
  
  // Availability
  status: {
    type: String,
    enum: ['available', 'on_mission', 'off_duty', 'busy'],
    default: 'off_duty'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  // Response Radius (in km)
  responseRadius: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  
  // Current Mission
  currentMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  
  // Statistics
  stats: {
    totalMissions: {
      type: Number,
      default: 0
    },
    completedMissions: {
      type: Number,
      default: 0
    },
    cancelledMissions: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number, // in minutes
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    livesSaved: {
      type: Number,
      default: 0
    }
  },
  
  // Badges/Achievements
  badges: [{
    name: {
      type: String,
      enum: ['First Responder', 'Life Saver', '10 Missions', '50 Missions', '100 Missions', 'Quick Responder', 'Hero']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  
  // Device Token
  fcmToken: String,
  
  // Preferences
  preferences: {
    notificationRadius: {
      type: Number,
      default: 5 // km
    },
    acceptCriticalOnly: {
      type: Boolean,
      default: false
    },
    autoAccept: {
      type: Boolean,
      default: false
    }
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
volunteerSchema.index({ 'currentLocation.coordinates': '2dsphere' });
// volunteerSchema.index({ email: 1 });
// volunteerSchema.index({ phone: 1 });
volunteerSchema.index({ status: 1, verificationStatus: 1 });
volunteerSchema.index({ isActive: 1 });

// Virtual for mission history
volunteerSchema.virtual('missionHistory', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'volunteer'
});

// Hash password
volunteerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
volunteerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update location
volunteerSchema.methods.updateLocation = function(longitude, latitude, address) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address,
    lastUpdated: Date.now()
  };
};

// Check if available
volunteerSchema.methods.isAvailableForMission = function() {
  return this.status === 'available' && 
         this.isActive && 
         this.verificationStatus === 'verified' &&
         !this.currentMission &&
         this.certification.isVerified &&
         new Date(this.certification.expiryDate) > new Date();
};

// Accept mission
volunteerSchema.methods.acceptMission = function(incidentId) {
  this.status = 'on_mission';
  this.currentMission = incidentId;
  this.stats.totalMissions += 1;
};

// Complete mission
volunteerSchema.methods.completeMission = function() {
  this.status = 'available';
  this.currentMission = null;
  this.stats.completedMissions += 1;
  this.checkAndAwardBadges();
};

// Cancel mission
volunteerSchema.methods.cancelMission = function() {
  this.status = 'available';
  this.currentMission = null;
  this.stats.cancelledMissions += 1;
};

// Update rating
volunteerSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.stats.totalRatings;
  const currentAverage = this.stats.averageRating;
  
  this.stats.averageRating = 
    (currentAverage * totalRatings + newRating) / (totalRatings + 1);
  this.stats.totalRatings += 1;
};

// Calculate distance
volunteerSchema.methods.calculateDistance = function(longitude, latitude) {
  const R = 6371; // Earth radius in km
  const dLat = (latitude - this.currentLocation.coordinates[1]) * Math.PI / 180;
  const dLon = (longitude - this.currentLocation.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.currentLocation.coordinates[1] * Math.PI / 180) * 
    Math.cos(latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Calculate ETA (simplified: distance / 15 km/h average walking/running speed)
volunteerSchema.methods.calculateETA = function(longitude, latitude) {
  const distance = this.calculateDistance(longitude, latitude);
  return Math.ceil((distance / 15) * 60); // ETA in minutes
};

// Check and award badges
volunteerSchema.methods.checkAndAwardBadges = function() {
  const badges = [];
  
  if (this.stats.completedMissions === 1) {
    badges.push({ name: 'First Responder' });
  }
  if (this.stats.completedMissions === 10) {
    badges.push({ name: '10 Missions' });
  }
  if (this.stats.completedMissions === 50) {
    badges.push({ name: '50 Missions' });
  }
  if (this.stats.completedMissions === 100) {
    badges.push({ name: '100 Missions' });
  }
  if (this.stats.livesSaved >= 1) {
    badges.push({ name: 'Life Saver' });
  }
  if (this.stats.averageResponseTime < 5) {
    badges.push({ name: 'Quick Responder' });
  }
  
  badges.forEach(badge => {
    if (!this.badges.some(b => b.name === badge.name)) {
      this.badges.push(badge);
    }
  });
};

// Verify certification
volunteerSchema.methods.verifyCertification = function(adminId) {
  this.certification.isVerified = true;
  this.certification.verifiedBy = adminId;
  this.certification.verifiedAt = Date.now();
  this.verificationStatus = 'verified';
};

// Reject certification
volunteerSchema.methods.rejectCertification = function(reason) {
  this.certification.isVerified = false;
  this.certification.rejectionReason = reason;
  this.verificationStatus = 'rejected';
};

module.exports = mongoose.model('Volunteer', volunteerSchema);