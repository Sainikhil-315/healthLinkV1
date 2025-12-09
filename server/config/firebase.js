const logger = require('../utils/logger.js');

// FCM API endpoint
const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

/**
 * Send push notification via FCM
 * @param {object} options - Notification options
 * @param {string|string[]} options.to - Device token(s) or topic
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {object} options.data - Additional data payload
 * @param {string} options.priority - Priority (high/normal)
 * @returns {Promise<object>} Send result
 */
async function sendPushNotification({
  to,
  title,
  body,
  data = {},
  priority = 'high'
}) {
  try {
    if (!FCM_SERVER_KEY) {
      logger.warn('FCM_SERVER_KEY not configured, skipping push notification');
      return { success: false, message: 'FCM not configured' };
    }

    // Handle multiple tokens
    const tokens = Array.isArray(to) ? to : [to];

    const payload = {
      registration_ids: tokens,
      priority,
      notification: {
        title,
        body,
        sound: 'default',
        badge: '1'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString()
      }
    };

    const response = await fetch(FCM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success > 0) {
      logger.info(`Push notification sent to ${result.success} device(s)`);
      return {
        success: true,
        successCount: result.success,
        failureCount: result.failure,
        results: result.results
      };
    } else {
      logger.error('Push notification failed:', result);
      return {
        success: false,
        error: result.results?.[0]?.error || 'Unknown error'
      };
    }
  } catch (error) {
    logger.error('FCM send error:', error);
    throw new Error('Failed to send push notification');
  }
};

/**
 * Send emergency alert notification
 * @param {object} data - Emergency data
 */
async function sendEmergencyNotification(data) {
  const { tokens, patientName, location, severity } = data;

  const severityEmojis = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '⚡',
    LOW: 'ℹ️'
  };

  return sendPushNotification({
    to: tokens,
    title: `${severityEmojis[severity]} EMERGENCY ALERT`,
    body: `${patientName} needs help at ${location.address || 'their location'}`,
    data: {
      type: 'emergency_alert',
      severity,
      location: JSON.stringify(location),
      timestamp: new Date().toISOString()
    },
    priority: 'high'
  });
};

/**
 * Send ambulance status notification
 * @param {object} data - Ambulance data
 */
async function sendAmbulanceNotification(data) {
  const { tokens, status, eta, vehicleNumber } = data;

  const messages = {
    dispatched: `Ambulance ${vehicleNumber} dispatched! ETA: ${eta} min`,
    arrived: `Ambulance ${vehicleNumber} has arrived at your location`,
    transporting: `En route to hospital. You'll be there soon.`
  };

  return sendPushNotification({
    to: tokens,
    title: '🚑 Ambulance Update',
    body: messages[status] || 'Ambulance status updated',
    data: {
      type: 'ambulance_status',
      status,
      vehicleNumber,
      eta: eta?.toString()
    },
    priority: 'high'
  });
};

/**
 * Send blood donor request notification
 * @param {object} data - Donor data
 */
async function sendBloodDonorNotification(data) {
  const { tokens, bloodGroup, hospitalName, distance } = data;

  return sendPushNotification({
    to: tokens,
    title: `🩸 ${bloodGroup} Blood Needed`,
    body: `Urgent request at ${hospitalName} (${distance}km away)`,
    data: {
      type: 'blood_request',
      bloodGroup,
      hospitalName,
      distance: distance.toString()
    },
    priority: 'high'
  });
};

/**
 * Send volunteer request notification
 * @param {object} data - Volunteer data
 */
async function sendVolunteerNotification(data) {
  const { tokens, distance, situation } = data;

  return sendPushNotification({
    to: tokens,
    title: '🚨 CPR NEEDED - Critical Emergency',
    body: `${distance}m away - ${situation}. Immediate response needed!`,
    data: {
      type: 'volunteer_request',
      situation,
      distance: distance.toString(),
      critical: 'true'
    },
    priority: 'high'
  });
};

/**
 * Send general notification
 * @param {object} data - Notification data
 */
async function sendGeneralNotification(data) {
  const { tokens, title, body, type, additionalData = {} } = data;

  return sendPushNotification({
    to: tokens,
    title,
    body,
    data: {
      type: type || 'general',
      ...additionalData
    },
    priority: 'normal'
  });
};

/**
 * Subscribe device to topic
 * @param {string[]} tokens - Device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<object>} Subscription result
 */
async function subscribeToTopic(tokens, topic) {
  try {
    const response = await fetch(`https://iid.googleapis.com/iid/v1:batchAdd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        registration_tokens: Array.isArray(tokens) ? tokens : [tokens]
      })
    });

    const result = await response.json();
    logger.info(`Subscribed ${result.success || 0} device(s) to topic: ${topic}`);

    return result;
  } catch (error) {
    logger.error('Topic subscription error:', error);
    throw error;
  }
};

/**
 * Send notification to topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
async function sendToTopic(topic, title, body, data = {}) {
  return sendPushNotification({
    to: `/topics/${topic}`,
    title,
    body,
    data
  });
};

module.exports = {
  sendPushNotification,
    sendEmergencyNotification,
    sendAmbulanceNotification,
    sendBloodDonorNotification,
    sendVolunteerNotification,
    sendGeneralNotification,
    subscribeToTopic,
    sendToTopic
};