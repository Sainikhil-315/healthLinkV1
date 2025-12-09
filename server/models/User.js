const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../utils/constants');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  relation: {
    type: String,
    required: true,
    enum: ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'],
    set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() // Capitalize first letter
  },
  phone: {
    type: String,
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const healthProfileSchema = new mongoose.Schema({
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  chronicConditions: [{
    type: String,
    trim: true
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  weight: Number, // in kg
  height: Number, // in cm
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
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
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    // match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't return password by default
  },

  // Role
  role: {
    type: String,
    enum: [USER_ROLES.USER, USER_ROLES.ADMIN],
    default: USER_ROLES.USER,
    index: true
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

  // Health Profile
  healthProfile: healthProfileSchema,

  // Emergency Contacts (max 3)
  emergencyContacts: {
    type: [emergencyContactSchema],
    validate: [array => array.length <= 3, 'Maximum 3 emergency contacts allowed']
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // OTP for verification
  otp: {
    code: String,
    expiresAt: Date
  },

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Device Token for Push Notifications
  fcmToken: String,

  // Statistics
  totalEmergencies: {
    type: Number,
    default: 0
  },

  // Timestamps
  lastLogin: Date,

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ 'currentLocation.coordinates': '2dsphere' });
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });

// Virtual for incidents
userSchema.virtual('incidents', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp || !this.otp.code) return false;
  if (Date.now() > this.otp.expiresAt) return false;
  return this.otp.code === candidateOTP;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Update location
userSchema.methods.updateLocation = function (longitude, latitude, address) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address,
    lastUpdated: Date.now()
  };
};

module.exports = mongoose.model('User', userSchema);