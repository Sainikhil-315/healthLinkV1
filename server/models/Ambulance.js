const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ambulanceSchema = new mongoose.Schema({
  // Basic Info
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, 'Invalid vehicle number format']
  },
  
  // Driver Info
  driver: {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Driver phone is required'],
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number']
    },
    email: {
      type: String,
      required: [true, 'Driver email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true
    },
    licenseExpiry: {
      type: Date,
      required: true
    },
    photo: String // Cloudinary URL
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  
  // Ambulance Type
  type: {
    type: String,
    required: true,
    enum: ['Basic', 'ALS', 'Cardiac', 'Neonatal'],
    default: 'Basic'
  },
  
  // Equipment
  equipment: {
    oxygen: { type: Boolean, default: true },
    defibrillator: { type: Boolean, default: false },
    ventilator: { type: Boolean, default: false },
    ecgMachine: { type: Boolean, default: false },
    stretcher: { type: Boolean, default: true },
    firstAidKit: { type: Boolean, default: true },
    fireExtinguisher: { type: Boolean, default: true }
  },
  
  // Location (Real-time, also stored in Redis)
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
  
  // Base Hospital
  baseHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['available', 'on_duty', 'offline', 'maintenance'],
    default: 'available'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Current Trip (if on duty)
  currentIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  
  // Statistics
  stats: {
    totalTrips: {
      type: Number,
      default: 0
    },
    completedTrips: {
      type: Number,
      default: 0
    },
    cancelledTrips: {
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
    }
  },
  
  // Documents
  documents: {
    registration: String, // Cloudinary URL
    insurance: String,
    permit: String
  },
  
  // Device Token
  fcmToken: String,
  
  // Metadata
  registrationDate: {
    type: Date,
    required: true
  },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ambulanceSchema.index({ 'currentLocation.coordinates': '2dsphere' });
// ambulanceSchema.index({ vehicleNumber: 1 });
ambulanceSchema.index({ status: 1, isActive: 1 });
// ambulanceSchema.index({ 'driver.phone': 1 });
ambulanceSchema.index({ baseHospital: 1 });

// Virtual for trip history
ambulanceSchema.virtual('tripHistory', {
  ref: 'Incident',
  localField: '_id',
  foreignField: 'ambulance'
});

// Hash password
ambulanceSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
ambulanceSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update location
ambulanceSchema.methods.updateLocation = function(longitude, latitude, address) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address,
    lastUpdated: Date.now()
  };
};

// Check if available
ambulanceSchema.methods.isAvailable = function() {
  return this.status === 'available' && 
         this.isActive && 
         this.isVerified &&
         !this.currentIncident;
};

// Accept trip
ambulanceSchema.methods.acceptTrip = function(incidentId) {
  this.status = 'on_duty';
  this.currentIncident = incidentId;
  this.stats.totalTrips += 1;
};

// Complete trip
ambulanceSchema.methods.completeTrip = function() {
  this.status = 'available';
  this.currentIncident = null;
  this.stats.completedTrips += 1;
};

// Cancel trip
ambulanceSchema.methods.cancelTrip = function() {
  this.status = 'available';
  this.currentIncident = null;
  this.stats.cancelledTrips += 1;
};

// Update rating
ambulanceSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.stats.totalRatings;
  const currentAverage = this.stats.averageRating;
  
  this.stats.averageRating = 
    (currentAverage * totalRatings + newRating) / (totalRatings + 1);
  this.stats.totalRatings += 1;
};

// Calculate distance
ambulanceSchema.methods.calculateDistance = function(longitude, latitude) {
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

// Calculate ETA (simplified: distance / 40 km/h average speed)
ambulanceSchema.methods.calculateETA = function(longitude, latitude) {
  const distance = this.calculateDistance(longitude, latitude);
  return Math.ceil((distance / 40) * 60); // ETA in minutes
};

// Calculate matching score for emergency
ambulanceSchema.methods.calculateMatchScore = function(emergency) {
  if (!this.isAvailable()) return 0;
  
  const distance = this.calculateDistance(
    emergency.location.coordinates[0],
    emergency.location.coordinates[1]
  );
  const eta = this.calculateETA(
    emergency.location.coordinates[0],
    emergency.location.coordinates[1]
  );
  
  // Score: Lower is better
  // Distance weight: 40%, ETA weight: 40%, Equipment match: 20%
  let equipmentScore = 0;
  if (emergency.severity === 'critical' && this.type === 'Cardiac') {
    equipmentScore = 1;
  } else if (emergency.severity === 'high' && this.type === 'ALS') {
    equipmentScore = 0.8;
  } else {
    equipmentScore = 0.5;
  }
  
  // Normalize and calculate final score (lower is better)
  const distanceScore = distance / 20; // Normalize by 20km
  const etaScore = eta / 30; // Normalize by 30 minutes
  
  return (distanceScore * 0.4) + (etaScore * 0.4) + ((1 - equipmentScore) * 0.2);
};

module.exports = mongoose.model('Ambulance', ambulanceSchema);