const mongoose = require('mongoose');

const triageResponseSchema = new mongoose.Schema({
  isConscious: {
    type: Boolean,
    required: true
  },
  isBreathing: {
    type: Boolean,
    required: true
  },
  hasHeavyBleeding: {
    type: Boolean,
    default: false
  },
  additionalSymptoms: {
    type: String,
    trim: true
  },
  voiceNote: String, // Cloudinary URL
  photos: [String] // Cloudinary URLs
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'sos_triggered',
      'triage_completed',
      'ambulance_dispatched',
      'volunteer_dispatched',
      'donor_requested',
      'ambulance_arrived',
      'volunteer_arrived',
      'patient_picked_up',
      'en_route_hospital',
      'reached_hospital',
      'patient_admitted',
      'blood_transfused',
      'incident_resolved',
      'incident_cancelled'
    ]
  },
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'timeline.actorModel'
  },
  actorModel: {
    type: String,
    enum: ['User', 'Ambulance', 'Volunteer', 'Donor', 'Hospital']
  }
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  // Incident Type
  type: {
    type: String,
    required: true,
    enum: ['self', 'bystander'],
    default: 'self'
  },
  
  // Patient Information
  patient: {
    // For self: reference to User
    // For bystander: anonymous data
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: String,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Unknown']
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    knownConditions: [String],
    knownMedications: [String]
  },
  
  // Reporter (person who triggered SOS)
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    landmark: String
  },
  
  // Triage (for bystander reports)
  triage: triageResponseSchema,
  
  // Auto-calculated severity
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'pending',
      'ambulance_dispatched',
      'volunteer_dispatched',
      'ambulance_arrived',
      'volunteer_arrived',
      'patient_picked_up',
      'en_route_hospital',
      'reached_hospital',
      'resolved',
      'cancelled'
    ],
    default: 'pending'
  },
  
  // Assigned Resources
  ambulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance',
    default: null
  },
  
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    default: null
  },
  
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  
  bloodDonor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    default: null
  },
  
  // Blood Requirement
  bloodRequired: {
    type: Boolean,
    default: false
  },
  
  bloodUnits: {
    type: Number,
    default: 0
  },
  
  // Timeline
  timeline: [timelineEventSchema],
  
  // ETAs
  estimatedTimes: {
    ambulanceETA: Number, // in minutes
    volunteerETA: Number,
    hospitalETA: Number
  },
  
  // Emergency Contacts Notified
  contactsNotified: [{
    name: String,
    phone: String,
    notifiedAt: Date,
    notificationStatus: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  
  // Response Times (for analytics)
  responseTimes: {
    ambulanceDispatchTime: Number, // seconds from SOS
    ambulanceArrivalTime: Number,
    volunteerArrivalTime: Number,
    hospitalReachTime: Number,
    totalResponseTime: Number
  },
  
  // Outcome
  outcome: {
    patientStatus: {
      type: String,
      enum: ['stable', 'critical', 'deceased', 'unknown'],
      default: 'unknown'
    },
    treatmentProvided: String,
    notes: String,
    hospitalAdmitted: {
      type: Boolean,
      default: false
    },
    bloodTransfused: {
      type: Boolean,
      default: false
    }
  },
  
  // Ratings (for responders)
  ratings: {
    ambulance: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String
    },
    volunteer: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String
    },
    hospital: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String
    }
  },
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByModel'
  },
  cancelledByModel: {
    type: String,
    enum: ['User', 'Ambulance', 'Hospital', 'Admin']
  },
  
  // Timestamps
  sosTriggeredAt: {
    type: Date,
    default: Date.now
  },
  
  resolvedAt: Date,
  
  cancelledAt: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
incidentSchema.index({ 'location.coordinates': '2dsphere' });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ 'patient.userId': 1 });
incidentSchema.index({ ambulance: 1 });
incidentSchema.index({ volunteer: 1 });
incidentSchema.index({ hospital: 1 });
incidentSchema.index({ sosTriggeredAt: -1 });

// Calculate severity based on triage
incidentSchema.methods.calculateSeverity = function() {
  if (!this.triage) {
    // For self-SOS without triage, default to 'high'
    this.severity = 'high';
    return;
  }
  
  const { isConscious, isBreathing, hasHeavyBleeding } = this.triage;
  
  if (!isConscious && !isBreathing) {
    this.severity = 'critical';
  } else if (!isConscious || hasHeavyBleeding) {
    this.severity = 'high';
  } else if (!isBreathing) {
    this.severity = 'critical';
  } else {
    this.severity = 'medium';
  }
};

// Add timeline event
incidentSchema.methods.addTimelineEvent = function(event, description, actor, actorModel) {
  this.timeline.push({
    event,
    description,
    timestamp: Date.now(),
    actor,
    actorModel
  });
};

// Update status
incidentSchema.methods.updateStatus = function(newStatus, actor, actorModel) {
  this.status = newStatus;
  
  const eventDescriptions = {
    'ambulance_dispatched': 'Ambulance dispatched to location',
    'volunteer_dispatched': 'Volunteer responder dispatched',
    'ambulance_arrived': 'Ambulance arrived at scene',
    'volunteer_arrived': 'Volunteer arrived at scene',
    'patient_picked_up': 'Patient picked up by ambulance',
    'en_route_hospital': 'En route to hospital',
    'reached_hospital': 'Reached hospital',
    'resolved': 'Incident resolved successfully',
    'cancelled': 'Incident cancelled'
  };
  
  this.addTimelineEvent(newStatus, eventDescriptions[newStatus], actor, actorModel);
};

// Assign ambulance
incidentSchema.methods.assignAmbulance = function(ambulanceId, eta) {
  this.ambulance = ambulanceId;
  this.estimatedTimes.ambulanceETA = eta;
  this.updateStatus('ambulance_dispatched', ambulanceId, 'Ambulance');
  
  // Calculate dispatch time
  const dispatchTime = (Date.now() - this.sosTriggeredAt) / 1000;
  this.responseTimes.ambulanceDispatchTime = dispatchTime;
};

// Assign volunteer
incidentSchema.methods.assignVolunteer = function(volunteerId, eta) {
  this.volunteer = volunteerId;
  this.estimatedTimes.volunteerETA = eta;
  this.addTimelineEvent(
    'volunteer_dispatched',
    'Volunteer first responder dispatched',
    volunteerId,
    'Volunteer'
  );
};

// Assign hospital
incidentSchema.methods.assignHospital = function(hospitalId, eta) {
  this.hospital = hospitalId;
  this.estimatedTimes.hospitalETA = eta;
};

// Request blood donor
incidentSchema.methods.requestBloodDonor = function(donorId, units) {
  this.bloodDonor = donorId;
  this.bloodRequired = true;
  this.bloodUnits = units;
  this.addTimelineEvent(
    'donor_requested',
    `Blood donor requested (${units} units)`,
    donorId,
    'Donor'
  );
};

// Notify emergency contacts
incidentSchema.methods.notifyContacts = function(contacts) {
  contacts.forEach(contact => {
    this.contactsNotified.push({
      name: contact.name,
      phone: contact.phone,
      notifiedAt: Date.now(),
      notificationStatus: 'sent'
    });
  });
};

// Mark as resolved
incidentSchema.methods.resolve = function(outcome) {
  this.status = 'resolved';
  this.resolvedAt = Date.now();
  this.outcome = outcome;
  
  // Calculate total response time
  this.responseTimes.totalResponseTime = 
    (this.resolvedAt - this.sosTriggeredAt) / 1000;
  
  this.addTimelineEvent('incident_resolved', 'Incident resolved', null, null);
};

// Cancel incident
incidentSchema.methods.cancel = function(reason, cancelledBy, cancelledByModel) {
  this.status = 'cancelled';
  this.cancelledAt = Date.now();
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.cancelledByModel = cancelledByModel;
  
  this.addTimelineEvent('incident_cancelled', reason, cancelledBy, cancelledByModel);
};

// Get live tracking data
incidentSchema.methods.getTrackingData = function() {
  return {
    incident: this._id,
    patient: this.patient,
    location: this.location,
    status: this.status,
    severity: this.severity,
    ambulance: this.ambulance,
    volunteer: this.volunteer,
    hospital: this.hospital,
    estimatedTimes: this.estimatedTimes,
    timeline: this.timeline
  };
};

// Check if critical
incidentSchema.methods.isCritical = function() {
  return this.severity === 'critical';
};

// Pre-save hook to calculate severity
incidentSchema.pre('save', function(next) {
  if (this.isNew && this.type === 'bystander' && this.triage) {
    this.calculateSeverity();
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);