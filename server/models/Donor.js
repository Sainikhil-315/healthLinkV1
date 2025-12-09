const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const donorSchema = new mongoose.Schema({
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
    required: [true, 'Blood type is required'],
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
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true,
      match: /^\d{6}$/
    }
  },
  
  // Health Info
  healthInfo: {
    weight: {
      type: Number, // in kg
      required: true,
      min: 45 // Minimum weight for blood donation
    },
    hasChronicIllness: {
      type: Boolean,
      default: false
    },
    isOnMedication: {
      type: Boolean,
      default: false
    },
    lastIllnessDate: Date,
    additionalNotes: String
  },
  
  // Donation History
  lastDonationDate: {
    type: Date,
    default: null
  },
  nextEligibleDate: {
    type: Date,
    default: null
  },
  
  // Availability
  status: {
    type: String,
    enum: ['available', 'unavailable', 'on_request', 'off_duty'],
    default: 'available'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Response Radius (in km)
  responseRadius: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  
  // Current Request
  currentRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  
  // Statistics
  stats: {
    totalDonations: {
      type: Number,
      default: 0
    },
    completedDonations: {
      type: Number,
      default: 0
    },
    cancelledRequests: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number, // in minutes
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
      enum: ['First Donation', 'Life Saver', '5 Donations', '10 Donations', '25 Donations', 'Super Donor', 'Hero']
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
    acceptEmergencyOnly: {
      type: Boolean,
      default: false
    },
    preferredDonationTime: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
      default: 'Anytime'
    }
  },
  
  // Documents (Optional)
  documents: {
    idProof: String, // Cloudinary URL
    bloodDonorCard: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
donorSchema.index({ 'currentLocation.coordinates': '2dsphere' });
// donorSchema.index({ email: 1 });
// donorSchema.index({ phone: 1 });
donorSchema.index({ bloodType: 1 });
donorSchema.index({ status: 1, isActive: 1, isVerified: 1 });

// Virtual for donation history
donorSchema.virtual('donationHistory', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'bloodDonor'
});

// Hash password
donorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update next eligible date when last donation date is set
donorSchema.pre('save', function(next) {
  if (this.isModified('lastDonationDate') && this.lastDonationDate) {
    // Add 90 days (3 months) for next eligibility
    const nextDate = new Date(this.lastDonationDate);
    nextDate.setDate(nextDate.getDate() + 90);
    this.nextEligibleDate = nextDate;
  }
  next();
});

// Compare password
donorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update location
donorSchema.methods.updateLocation = function(longitude, latitude, address) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address,
    lastUpdated: Date.now()
  };
};

// Check if eligible to donate
donorSchema.methods.isEligibleToDonate = function() {
  // Check basic eligibility
  if (!this.isActive || !this.isVerified) return false;
  if (this.status !== 'available') return false;
  if (this.healthInfo.weight < 45) return false;
  if (this.healthInfo.hasChronicIllness) return false;
  
  // Check last donation date (must be 90+ days ago)
  if (this.lastDonationDate) {
    const daysSinceLastDonation = 
      (Date.now() - this.lastDonationDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastDonation < 90) return false;
  }
  
  return true;
};

// Get compatible blood types for donation
donorSchema.statics.getCompatibleBloodTypes = function(requiredBloodType) {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };
  return compatibility[requiredBloodType] || [];
};

// Accept donation request
donorSchema.methods.acceptRequest = function(incidentId) {
  this.status = 'on_request';
  this.currentRequest = incidentId;
  this.stats.totalDonations += 1;
};

// Complete donation
donorSchema.methods.completeDonation = function() {
  this.status = 'unavailable'; // Unavailable for 90 days
  this.currentRequest = null;
  this.lastDonationDate = Date.now();
  this.stats.completedDonations += 1;
  this.stats.livesSaved += 1;
  this.checkAndAwardBadges();
};

// Cancel request
donorSchema.methods.cancelRequest = function() {
  this.status = 'available';
  this.currentRequest = null;
  this.stats.cancelledRequests += 1;
};

// Calculate distance
donorSchema.methods.calculateDistance = function(longitude, latitude) {
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

// Check and award badges
donorSchema.methods.checkAndAwardBadges = function() {
  const badges = [];
  
  if (this.stats.completedDonations === 1) {
    badges.push({ name: 'First Donation' });
  }
  if (this.stats.completedDonations === 5) {
    badges.push({ name: '5 Donations' });
  }
  if (this.stats.completedDonations === 10) {
    badges.push({ name: '10 Donations' });
  }
  if (this.stats.completedDonations === 25) {
    badges.push({ name: '25 Donations' });
  }
  if (this.stats.completedDonations >= 50) {
    badges.push({ name: 'Super Donor' });
  }
  if (this.stats.livesSaved >= 1) {
    badges.push({ name: 'Life Saver' });
  }
  
  badges.forEach(badge => {
    if (!this.badges.some(b => b.name === badge.name)) {
      this.badges.push(badge);
    }
  });
};

// Get days until eligible
donorSchema.methods.getDaysUntilEligible = function() {
  if (!this.nextEligibleDate) return 0;
  const daysRemaining = 
    (this.nextEligibleDate - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(daysRemaining));
};

module.exports = mongoose.model('Donor', donorSchema);