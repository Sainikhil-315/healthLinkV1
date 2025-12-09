const { sendPushNotification, sendEmergencyNotification, sendAmbulanceNotification, sendBloodDonorNotification, sendVolunteerNotification } = require('../config/firebase.js');
const { emitToUser, broadcastNotification } = require('../config/socket.js');
const logger = require('../utils/logger.js');
const Notification = require('../models/Notification.js');
/**
 * Send emergency alert to ambulance
 * @param {object} ambulance - Ambulance object
 * @param {object} incident - Incident object
 * @param {number} eta - Estimated time of arrival
 */
async function notifyAmbulance(ambulance, incident, eta) {
  try {
    // Create notification record
    const notification = await Notification.create({
      recipient: ambulance._id,
      recipientModel: 'Ambulance',
      type: 'ambulance_request',
      priority: incident.severity === 'critical' ? 'critical' : 'high',
      title: '🚑 Emergency Request',
      body: `Patient needs assistance. ETA: ${eta} minutes`,
      data: {
        incidentId: incident._id,
        location: {
          latitude: incident.location.coordinates[1],
          longitude: incident.location.coordinates[0],
          address: incident.location.address
        },
        severity: incident.severity,
        eta
      },
      incident: incident._id
    });

    // Send push notification if FCM token exists
    if (ambulance.fcmToken) {
      await sendPushNotification({
        to: ambulance.fcmToken,
        title: '🚑 Emergency Request',
        body: `Patient at ${incident.location.address}. ETA: ${eta} min`,
        data: {
          type: 'ambulance_request',
          incidentId: incident._id.toString(),
          severity: incident.severity
        },
        priority: 'high'
      });

      notification.markAsSent();
      await notification.save();
    }

    // Send real-time socket notification
    emitToUser(ambulance._id.toString(), 'ambulance:request', {
      incidentId: incident._id,
      location: incident.location,
      severity: incident.severity,
      eta
    });

    logger.info(`Ambulance ${ambulance.vehicleNumber} notified for incident ${incident._id}`);
    return notification;
  } catch (error) {
    logger.error('Error notifying ambulance:', error);
    throw error;
  }
};

/**
 * Send alert to volunteers
 * @param {array} volunteers - Array of volunteer objects
 * @param {object} incident - Incident object
 */
async function notifyVolunteers(volunteers, incident) {
  try {
    const notifications = [];

    for (const volunteer of volunteers) {
      const notification = await Notification.create({
        recipient: volunteer._id,
        recipientModel: 'Volunteer',
        type: 'volunteer_request',
        priority: 'critical',
        title: '🆘 CPR Needed - Critical',
        body: `Patient unconscious ${volunteer.distance}km away. Immediate help needed!`,
        data: {
          incidentId: incident._id,
          location: {
            latitude: incident.location.coordinates[1],
            longitude: incident.location.coordinates[0],
            address: incident.location.address
          },
          distance: volunteer.distance,
          eta: volunteer.eta
        },
        incident: incident._id
      });

      // Send push notification
      if (volunteer.fcmToken) {
        await sendVolunteerNotification({
          tokens: volunteer.fcmToken,
          distance: Math.round(volunteer.distance * 1000), // Convert to meters
          situation: 'Patient unconscious/not breathing'
        });

        notification.markAsSent();
        await notification.save();
      }

      // Send socket notification
      emitToUser(volunteer._id.toString(), 'volunteer:request', {
        incidentId: incident._id,
        location: incident.location,
        distance: volunteer.distance,
        eta: volunteer.eta
      });

      notifications.push(notification);
    }

    logger.info(`${volunteers.length} volunteers notified for incident ${incident._id}`);
    return notifications;
  } catch (error) {
    logger.error('Error notifying volunteers:', error);
    throw error;
  }
};

/**
 * Send blood request to donors
 * @param {array} donors - Array of donor objects
 * @param {object} incident - Incident object
 * @param {string} bloodGroup - Required blood group
 * @param {object} hospital - Hospital object
 */
async function notifyDonors(donors, incident, bloodGroup, hospital) {
  try {
    const notifications = [];

    for (const donor of donors) {
      const notification = await Notification.create({
        recipient: donor._id,
        recipientModel: 'Donor',
        type: 'blood_request',
        priority: 'high',
        title: `🩸 ${bloodGroup} Blood Needed`,
        body: `Urgent request at ${hospital.name} (${donor.distance}km away)`,
        data: {
          incidentId: incident._id,
          hospitalId: hospital._id,
          bloodGroup,
          hospitalName: hospital.name,
          distance: donor.distance
        },
        incident: incident._id
      });

      // Send push notification
      if (donor.fcmToken) {
        await sendBloodDonorNotification({
          tokens: donor.fcmToken,
          bloodGroup,
          hospitalName: hospital.name,
          distance: donor.distance
        });

        notification.markAsSent();
        await notification.save();
      }

      // Send socket notification
      emitToUser(donor._id.toString(), 'donor:request', {
        incidentId: incident._id,
        bloodGroup,
        hospital: {
          id: hospital._id,
          name: hospital.name,
          address: hospital.location.address
        },
        distance: donor.distance
      });

      notifications.push(notification);
    }

    logger.info(`${donors.length} donors notified for incident ${incident._id}`);
    return notifications;
  } catch (error) {
    logger.error('Error notifying donors:', error);
    throw error;
  }
};

/**
 * Notify emergency contacts
 * @param {array} contacts - Array of emergency contacts
 * @param {object} patient - Patient/user object
 * @param {object} incident - Incident object
 */
async function notifyEmergencyContacts(contacts, patient, incident) {
  try {
    const notifications = [];

    for (const contact of contacts) {
      // Create notification record
      const notification = await Notification.create({
        recipient: patient._id,
        recipientModel: 'User',
        type: 'emergency_alert',
        priority: 'critical',
        title: '🚨 Emergency Alert',
        body: `${patient.fullName} has triggered an emergency alert`,
        data: {
          incidentId: incident._id,
          location: incident.location,
          contactName: contact.name,
          contactPhone: contact.phone
        },
        incident: incident._id
      });

      // Note: SMS/Email sending would happen via emailService
      // For MVP, we're just creating the notification record
      
      notifications.push(notification);
    }

    logger.info(`${contacts.length} emergency contacts notified for incident ${incident._id}`);
    return notifications;
  } catch (error) {
    logger.error('Error notifying emergency contacts:', error);
    throw error;
  }
};

/**
 * Send status update notification
 * @param {string} userId - User ID to notify
 * @param {string} userModel - User model type
 * @param {string} status - New status
 * @param {object} incident - Incident object
 */
async function notifyStatusUpdate(userId, userModel, status, incident) {
  try {
    const statusMessages = {
      'ambulance_dispatched': '🚑 Ambulance has been dispatched to your location',
      'ambulance_arrived': '🚑 Ambulance has arrived at the scene',
      'volunteer_arrived': '🆘 Volunteer first responder has arrived',
      'patient_picked_up': '🚑 Patient picked up, heading to hospital',
      'en_route_hospital': '🏥 En route to hospital',
      'reached_hospital': '🏥 Reached hospital safely',
      'resolved': '✅ Emergency resolved successfully'
    };

    const notification = await Notification.create({
      recipient: userId,
      recipientModel: userModel,
      type: 'status_update',
      priority: 'medium',
      title: 'Emergency Status Update',
      body: statusMessages[status] || 'Status updated',
      data: {
        incidentId: incident._id,
        status,
        timestamp: new Date()
      },
      incident: incident._id
    });

    // Send socket notification
    emitToUser(userId.toString(), 'emergency:status', {
      incidentId: incident._id,
      status,
      message: statusMessages[status]
    });

    logger.info(`Status update sent to ${userModel} ${userId}: ${status}`);
    return notification;
  } catch (error) {
    logger.error('Error sending status update:', error);
    throw error;
  }
};

/**
 * Broadcast notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {string} userModel - User model type
 * @param {object} notificationData - Notification data
 */
async function broadcastToUsers(userIds, userModel, notificationData) {
  try {
    const notifications = [];

    for (const userId of userIds) {
      const notification = await Notification.create({
        recipient: userId,
        recipientModel: userModel,
        ...notificationData
      });

      notifications.push(notification);
    }

    // Broadcast via socket
    broadcastNotification(userIds.map(id => id.toString()), notificationData);

    logger.info(`Broadcast sent to ${userIds.length} users`);
    return notifications;
  } catch (error) {
    logger.error('Error broadcasting to users:', error);
    throw error;
  }
};

/**
 * Get unread notifications for user
 * @param {string} userId - User ID
 * @param {string} userModel - User model type
 * @returns {array} Array of unread notifications
 */
async function getUnreadNotifications(userId, userModel) {
  try {
    const notifications = await Notification.find({
      recipient: userId,
      recipientModel: userModel,
      isRead: false
    })
    .sort({ createdAt: -1 })
    .limit(50);

    return notifications;
  } catch (error) {
    logger.error('Error fetching unread notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
async function markAsRead(notificationId) {
  try {
    const notification = await Notification.findById(notificationId);
    if (notification) {
      notification.markAsRead();
      await notification.save();
    }
    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for user
 * @param {string} userId - User ID
 * @param {string} userModel - User model type
 */
async function markAllAsRead(userId, userModel) {
  try {
    await Notification.updateMany(
      { recipient: userId, recipientModel: userModel, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    logger.info(`All notifications marked as read for ${userModel} ${userId}`);
  } catch (error) {
    logger.error('Error marking all as read:', error);
    throw error;
  }
};

module.exports = {
  notifyAmbulance,
  notifyVolunteers,
  notifyDonors,
  notifyEmergencyContacts,
  notifyStatusUpdate,
  broadcastToUsers,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead
};