const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'Hospital', 'Ambulance', 'Volunteer', 'Donor']
  },
  
  // Notification Type
  type: {
    type: String,
    required: true,
    enum: [
      // Emergency Related
      'emergency_alert',
      'ambulance_request',
      'volunteer_request',
      'blood_request',
      
      // Status Updates
      'ambulance_dispatched',
      'ambulance_arrived',
      'volunteer_arrived',
      'patient_picked_up',
      'en_route_hospital',
      'reached_hospital',
      'incident_resolved',
      'incident_cancelled',
      
      // Acceptances
      'request_accepted',
      'request_declined',
      'donor_found',
      'volunteer_found',
      
      // Hospital
      'incoming_patient',
      'bed_reserved',
      
      // Account
      'verification_approved',
      'verification_rejected',
      'account_activated',
      'account_deactivated',
      
      // Achievements
      'badge_earned',
      'milestone_reached',
      
      // System
      'system_update',
      'maintenance'
    ]
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Rich Data
  data: {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance'
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer'
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    eta: Number,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  
  // Action Buttons (for push notifications)
  actions: [{
    label: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['accept', 'decline', 'view', 'navigate', 'call', 'dismiss']
    },
    url: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  // Delivery Info
  deliveryChannel: {
    type: String,
    enum: ['push', 'sms', 'email', 'in_app'],
    default: 'push'
  },
  
  sentAt: Date,
  
  deliveredAt: Date,
  
  // FCM Info (for push notifications)
  fcmMessageId: String,
  
  fcmResponse: mongoose.Schema.Types.Mixed,
  
  // Error Info
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 7 days by default
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Group ID (for grouping related notifications)
  groupId: String,
  
  // Related Incident
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, recipientModel: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
// notificationSchema.index({ expiresAt: 1 }); // For TTL
notificationSchema.index({ incident: 1 });
notificationSchema.index({ groupId: 1 });

// TTL Index - Auto-delete notifications after expiry
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = Date.now();
    if (this.status === 'delivered') {
      this.status = 'read';
    }
  }
};

// Mark as sent
notificationSchema.methods.markAsSent = function(messageId) {
  this.status = 'sent';
  this.sentAt = Date.now();
  if (messageId) {
    this.fcmMessageId = messageId;
  }
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = Date.now();
};

// Mark as failed
notificationSchema.methods.markAsFailed = function(errorMessage, errorCode) {
  this.status = 'failed';
  this.error = {
    message: errorMessage,
    code: errorCode,
    timestamp: Date.now()
  };
};

// Check if expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && Date.now() > this.expiresAt;
};

// Get notification payload (for FCM)
notificationSchema.methods.getFCMPayload = function() {
  const payload = {
    notification: {
      title: this.title,
      body: this.body
    },
    data: {
      notificationId: this._id.toString(),
      type: this.type,
      priority: this.priority,
      ...this.data
    }
  };
  
  // Add action buttons if present
  if (this.actions && this.actions.length > 0) {
    payload.data.actions = JSON.stringify(this.actions);
  }
  
  return payload;
};

// Static method to create emergency alert
notificationSchema.statics.createEmergencyAlert = function(recipientId, recipientModel, incidentData) {
  return this.create({
    recipient: recipientId,
    recipientModel: recipientModel,
    type: 'emergency_alert',
    priority: 'critical',
    title: '🚨 Emergency Alert',
    body: `Emergency at ${incidentData.location.address}. Severity: ${incidentData.severity.toUpperCase()}`,
    data: {
      incidentId: incidentData._id,
      location: {
        latitude: incidentData.location.coordinates[1],
        longitude: incidentData.location.coordinates[0],
        address: incidentData.location.address
      },
      severity: incidentData.severity
    },
    actions: [
      { label: 'Accept', action: 'accept' },
      { label: 'Decline', action: 'decline' },
      { label: 'View Details', action: 'view' }
    ],
    incident: incidentData._id,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes for emergency alerts
  });
};

// Static method to create ambulance request
notificationSchema.statics.createAmbulanceRequest = function(ambulanceId, incidentData, eta) {
  return this.create({
    recipient: ambulanceId,
    recipientModel: 'Ambulance',
    type: 'ambulance_request',
    priority: incidentData.severity === 'critical' ? 'critical' : 'high',
    title: '🚑 Emergency Request',
    body: `Patient needs immediate assistance. ETA: ${eta} minutes`,
    data: {
      incidentId: incidentData._id,
      location: {
        latitude: incidentData.location.coordinates[1],
        longitude: incidentData.location.coordinates[0],
        address: incidentData.location.address
      },
      severity: incidentData.severity,
      eta: eta
    },
    actions: [
      { label: 'Accept', action: 'accept' },
      { label: 'Decline', action: 'decline' },
      { label: 'Navigate', action: 'navigate' }
    ],
    incident: incidentData._id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  });
};

// Static method to create volunteer request
notificationSchema.statics.createVolunteerRequest = function(volunteerId, incidentData, eta) {
  return this.create({
    recipient: volunteerId,
    recipientModel: 'Volunteer',
    type: 'volunteer_request',
    priority: 'critical',
    title: '🆘 CPR Needed - Critical',
    body: `Patient unconscious. You are ${eta} minutes away. Can you help?`,
    data: {
      incidentId: incidentData._id,
      location: {
        latitude: incidentData.location.coordinates[1],
        longitude: incidentData.location.coordinates[0],
        address: incidentData.location.address
      },
      severity: incidentData.severity,
      eta: eta
    },
    actions: [
      { label: 'Accept Mission', action: 'accept' },
      { label: 'Decline', action: 'decline' },
      { label: 'Navigate', action: 'navigate' }
    ],
    incident: incidentData._id,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000) // 3 minutes
  });
};

// Static method to create blood request
notificationSchema.statics.createBloodRequest = function(donorId, incidentData, bloodType, units) {
  return this.create({
    recipient: donorId,
    recipientModel: 'Donor',
    type: 'blood_request',
    priority: 'high',
    title: '🩸 Blood Donation Urgent',
    body: `${bloodType} blood needed (${units} units). Patient in emergency.`,
    data: {
      incidentId: incidentData._id,
      hospitalId: incidentData.hospital,
      bloodType: bloodType,
      units: units
    },
    actions: [
      { label: 'Accept', action: 'accept' },
      { label: 'Decline', action: 'decline' }
    ],
    incident: incidentData._id,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId, recipientModel) {
  return this.countDocuments({
    recipient: recipientId,
    recipientModel: recipientModel,
    isRead: false,
    status: { $in: ['sent', 'delivered'] }
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(recipientId, recipientModel) {
  return this.updateMany(
    {
      recipient: recipientId,
      recipientModel: recipientModel,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: Date.now(),
        status: 'read'
      }
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);