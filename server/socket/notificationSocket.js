const { getIO } = require('../config/socket.js');
const { SOCKET_EVENTS } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * Send notification to specific user
 * @param {string} userId - User ID
 * @param {object} notification - Notification data
 */
function sendNotification(userId, notification) {
  try {
    const io = getIO();
    
    const notificationData = {
      id: notification._id || notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      priority: notification.priority || 'medium',
      data: notification.data || {},
      timestamp: new Date()
    };

    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, notificationData);

    logger.debug(`Notification sent to user ${userId}: ${notification.type}`);
  } catch (error) {
    logger.error('Error sending notification:', error);
  }
};

/**
 * Broadcast notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {object} notification - Notification data
 */
function broadcastNotification(userIds, notification) {
  try {
    const io = getIO();
    
    const notificationData = {
      id: notification._id || notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      priority: notification.priority || 'medium',
      data: notification.data || {},
      timestamp: new Date()
    };

    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, notificationData);
    });

    logger.info(`Notification broadcast to ${userIds.length} users: ${notification.type}`);
  } catch (error) {
    logger.error('Error broadcasting notification:', error);
  }
};

/**
 * Send notification to role group
 * @param {string} role - User role (ambulance, volunteer, hospital, etc.)
 * @param {object} notification - Notification data
 */
function notifyRole(role, notification) {
  try {
    const io = getIO();
    
    const notificationData = {
      id: notification._id || notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      priority: notification.priority || 'medium',
      data: notification.data || {},
      timestamp: new Date()
    };

    io.to(`role:${role}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, notificationData);

    logger.info(`Notification sent to role ${role}: ${notification.type}`);
  } catch (error) {
    logger.error('Error notifying role:', error);
  }
};

/**
 * Send critical alert (high priority notification with sound)
 * @param {string} userId - User ID
 * @param {object} alert - Alert data
 */
function sendCriticalAlert(userId, alert) {
  try {
    const io = getIO();
    
    const alertData = {
      id: alert._id || alert.id,
      type: alert.type,
      title: alert.title,
      body: alert.body,
      priority: 'critical',
      requiresAcknowledgment: true,
      data: alert.data || {},
      timestamp: new Date()
    };

    io.to(`user:${userId}`).emit('alert:critical', alertData);

    logger.warn(`Critical alert sent to user ${userId}: ${alert.type}`);
  } catch (error) {
    logger.error('Error sending critical alert:', error);
  }
};

/**
 * Send emergency request notification
 * @param {string} responderId - Responder ID (ambulance/volunteer/donor)
 * @param {object} request - Request data
 */
function sendEmergencyRequest(responderId, request) {
  try {
    const io = getIO();
    
    const requestData = {
      id: request._id || request.id,
      incidentId: request.incidentId,
      type: request.type,
      severity: request.severity,
      location: request.location,
      eta: request.eta,
      patient: request.patient,
      expiresIn: request.expiresIn || 300000, // 5 minutes default
      timestamp: new Date()
    };

    io.to(`user:${responderId}`).emit('request:emergency', requestData);

    logger.info(`Emergency request sent to responder ${responderId}`);
  } catch (error) {
    logger.error('Error sending emergency request:', error);
  }
};

/**
 * Notify request acceptance
 * @param {string} requesterId - User who made the request
 * @param {object} acceptance - Acceptance data
 */
function notifyRequestAccepted(requesterId, acceptance) {
  try {
    const io = getIO();
    
    const acceptanceData = {
      incidentId: acceptance.incidentId,
      responderType: acceptance.responderType,
      responderId: acceptance.responderId,
      responderName: acceptance.responderName,
      eta: acceptance.eta,
      message: `${acceptance.responderType} has accepted your request`,
      timestamp: new Date()
    };

    io.to(`user:${requesterId}`).emit('request:accepted', acceptanceData);

    logger.info(`Request acceptance notification sent to ${requesterId}`);
  } catch (error) {
    logger.error('Error notifying request acceptance:', error);
  }
};

/**
 * Notify request declined
 * @param {string} requesterId - User who made the request
 * @param {object} decline - Decline data
 */
function notifyRequestDeclined(requesterId, decline) {
  try {
    const io = getIO();
    
    const declineData = {
      incidentId: decline.incidentId,
      responderType: decline.responderType,
      responderId: decline.responderId,
      reason: decline.reason,
      message: `${decline.responderType} declined the request`,
      timestamp: new Date()
    };

    io.to(`user:${requesterId}`).emit('request:declined', declineData);

    logger.info(`Request decline notification sent to ${requesterId}`);
  } catch (error) {
    logger.error('Error notifying request decline:', error);
  }
};

/**
 * Send status change notification
 * @param {array} recipientIds - Array of user IDs to notify
 * @param {object} statusChange - Status change data
 */
function notifyStatusChange(recipientIds, statusChange) {
  try {
    const io = getIO();
    
    const statusData = {
      incidentId: statusChange.incidentId,
      oldStatus: statusChange.oldStatus,
      newStatus: statusChange.newStatus,
      message: statusChange.message,
      timestamp: new Date()
    };

    recipientIds.forEach(userId => {
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.STATUS_CHANGE, statusData);
    });

    logger.debug(`Status change notification sent to ${recipientIds.length} users`);
  } catch (error) {
    logger.error('Error notifying status change:', error);
  }
};

/**
 * Send badge earned notification
 * @param {string} userId - User ID
 * @param {object} badge - Badge data
 */
function notifyBadgeEarned(userId, badge) {
  try {
    const io = getIO();
    
    const badgeData = {
      badgeName: badge.name,
      badgeDescription: badge.description,
      badgeIcon: badge.icon,
      earnedAt: badge.earnedAt || new Date(),
      message: `Congratulations! You earned the "${badge.name}" badge`
    };

    io.to(`user:${userId}`).emit('badge:earned', badgeData);

    logger.info(`Badge earned notification sent to user ${userId}: ${badge.name}`);
  } catch (error) {
    logger.error('Error notifying badge earned:', error);
  }
};

/**
 * Send milestone notification
 * @param {string} userId - User ID
 * @param {object} milestone - Milestone data
 */
function notifyMilestone(userId, milestone) {
  try {
    const io = getIO();
    
    const milestoneData = {
      type: milestone.type,
      value: milestone.value,
      message: milestone.message,
      timestamp: new Date()
    };

    io.to(`user:${userId}`).emit('milestone:reached', milestoneData);

    logger.info(`Milestone notification sent to user ${userId}: ${milestone.type}`);
  } catch (error) {
    logger.error('Error notifying milestone:', error);
  }
};

/**
 * Send system announcement
 * @param {object} announcement - Announcement data
 * @param {string[]} targetRoles - Optional array of roles to target
 */
function sendSystemAnnouncement(announcement, targetRoles = null) {
  try {
    const io = getIO();
    
    const announcementData = {
      id: announcement._id || announcement.id,
      title: announcement.title,
      message: announcement.message,
      type: announcement.type || 'info',
      priority: announcement.priority || 'low',
      expiresAt: announcement.expiresAt,
      timestamp: new Date()
    };

    if (targetRoles && targetRoles.length > 0) {
      // Send to specific roles
      targetRoles.forEach(role => {
        io.to(`role:${role}`).emit('system:announcement', announcementData);
      });
      logger.info(`System announcement sent to roles: ${targetRoles.join(', ')}`);
    } else {
      // Broadcast to all connected users
      io.emit('system:announcement', announcementData);
      logger.info('System announcement broadcast to all users');
    }
  } catch (error) {
    logger.error('Error sending system announcement:', error);
  }
};

/**
 * Send typing indicator (for chat features in future)
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID who is typing
 * @param {boolean} isTyping - Typing status
 */
function sendTypingIndicator(roomId, userId, isTyping) {
  try {
    const io = getIO();
    
    io.to(roomId).emit('typing:indicator', {
      userId,
      isTyping,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error sending typing indicator:', error);
  }
};

/**
 * Send read receipt
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User who read it
 */
function sendReadReceipt(notificationId, userId) {
  try {
    const io = getIO();
    
    io.to(`user:${userId}`).emit('notification:read', {
      notificationId,
      readAt: new Date()
    });

    logger.debug(`Read receipt sent for notification ${notificationId}`);
  } catch (error) {
    logger.error('Error sending read receipt:', error);
  }
};

/**
 * Update unread count for user
 * @param {string} userId - User ID
 * @param {number} count - Unread count
 */
function updateUnreadCount(userId, count) {
  try {
    const io = getIO();
    
    io.to(`user:${userId}`).emit('notifications:unread-count', {
      count,
      timestamp: new Date()
    });

    logger.debug(`Unread count updated for user ${userId}: ${count}`);
  } catch (error) {
    logger.error('Error updating unread count:', error);
  }
};

module.exports = {
  sendNotification,
  broadcastNotification,
  notifyRole,
  sendCriticalAlert,
  sendEmergencyRequest,
  notifyRequestAccepted,
  notifyRequestDeclined,
  notifyStatusChange,
  notifyBadgeEarned,
  notifyMilestone,
  sendSystemAnnouncement,
  sendTypingIndicator,
  sendReadReceipt,
  updateUnreadCount
};