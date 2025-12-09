const mongoose = require('mongoose');

const specialistSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: true,
    enum: [
      'Cardiologist',
      'Neurologist',
      'Orthopedic',
      'Traumatologist',
      'General Surgeon',
      'Pediatrician',
      'Pulmonologist',
      'Nephrologist',
      'Emergency Medicine'
    ]
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    match: /^[6-9]\d{9}$/
  }
}, { _id: false });

const bedAvailabilitySchema = new mongoose.Schema({
  general: {
    total: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 }
  },
  icu: {
    total: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 }
  },
  emergency: {
    total: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const facilitiesSchema = new mongoose.Schema({
  oxygenAvailable: { type: Boolean, default: true },
  ventilators: { type: Number, default: 0 },
  ambulanceService: { type: Boolean, default: true },
  bloodBank: { type: Boolean, default: false },
  pharmacy24x7: { type: Boolean, default: true },
  emergencyRoom: { type: Boolean, default: true },
  operationTheater: { type: Boolean, default: true }
}, { _id: false });

const hospitalSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    unique: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please provide a valid phone number']
  },
  emergencyPhone: {
    type: String,
    required: [true, 'Emergency phone is required'],
    match: [/^[6-9]\d{9}$/]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
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
  
  // Hospital Type
  type: {
    type: String,
    required: true,
    enum: ['Government', 'Private', 'Charitable']
  },
  
  // Bed Availability
  bedAvailability: {
    type: bedAvailabilitySchema,
    required: true
  },
  
  // Specialists
  specialists: [specialistSchema],
  
  // Facilities
  facilities: facilitiesSchema,
  
  // Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  acceptingEmergencies: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  totalPatientsHandled: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Documents
  documents: {
    license: String, // Cloudinary URL
    registration: String
  },
  
  // Device Token
  fcmToken: String,
  
  // Admin Contact
  adminContact: {
    name: String,
    designation: String,
    phone: String,
    email: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hospitalSchema.index({ 'location.coordinates': '2dsphere' });
// hospitalSchema.index({ name: 1 });
hospitalSchema.index({ isVerified: 1, isActive: 1 });
hospitalSchema.index({ acceptingEmergencies: 1 });

// Virtual for incoming patients
hospitalSchema.virtual('incomingPatients', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'hospital',
  match: { status: { $in: ['ambulance_dispatched', 'en_route_hospital'] } }
});

// Hash password
const bcrypt = require('bcrypt');
hospitalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
hospitalSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update bed availability
hospitalSchema.methods.updateBeds = function(type, count) {
  if (this.bedAvailability[type]) {
    this.bedAvailability[type].available += count;
    this.bedAvailability.lastUpdated = Date.now();
  }
};

// Check bed availability
hospitalSchema.methods.hasAvailableBeds = function(type = 'general') {
  return this.bedAvailability[type].available > 0;
};

// Get specialist by specialization
hospitalSchema.methods.getSpecialist = function(specialization) {
  return this.specialists.find(
    s => s.specialization === specialization && s.isAvailable
  );
};

// Calculate distance (will be used in queries)
hospitalSchema.methods.calculateDistance = function(longitude, latitude) {
  const R = 6371; // Earth radius in km
  const dLat = (latitude - this.location.coordinates[1]) * Math.PI / 180;
  const dLon = (longitude - this.location.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates[1] * Math.PI / 180) * 
    Math.cos(latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

module.exports = mongoose.model('Hospital', hospitalSchema);