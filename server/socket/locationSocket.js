const { getIO } = require('../config/socket.js');
const { setCache, getCache } = require('../config/redis.js');
const { SOCKET_EVENTS, REDIS_KEYS } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * Update and broadcast ambulance location
 * @param {string} ambulanceId - Ambulance ID
 * @param {object} location - Location object {lat, lng}
 */
async function updateAmbulanceLocation(ambulanceId, location) {
  try {
    const io = getIO();
    
    const locationData = {
      ambulanceId,
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString()
    };

    // Store in Redis for fast access (expires in 5 minutes)
    await setCache(
      `${REDIS_KEYS.AMBULANCE_LOCATION}${ambulanceId}`,
      locationData,
      300
    );

    // Broadcast to ambulance tracking room
    io.to(`ambulance:${ambulanceId}`).emit(SOCKET_EVENTS.AMBULANCE_LOCATION, locationData);

    logger.debug(`Ambulance location updated: ${ambulanceId}`);
  } catch (error) {
    logger.error('Error updating ambulance location:', error);
  }
};

/**
 * Update and broadcast volunteer location
 * @param {string} volunteerId - Volunteer ID
 * @param {object} location - Location object {lat, lng}
 */
async function updateVolunteerLocation(volunteerId, location) {
  try {
    const io = getIO();
    
    const locationData = {
      volunteerId,
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString()
    };

    // Store in Redis
    await setCache(
      `${REDIS_KEYS.VOLUNTEER_LOCATION}${volunteerId}`,
      locationData,
      300
    );

    // Broadcast to volunteer tracking room
    io.to(`volunteer:${volunteerId}`).emit('volunteer:location', locationData);

    logger.debug(`Volunteer location updated: ${volunteerId}`);
  } catch (error) {
    logger.error('Error updating volunteer location:', error);
  }
};

/**
 * Get cached ambulance location
 * @param {string} ambulanceId - Ambulance ID
 * @returns {object|null} Location data
 */
async function getAmbulanceLocation(ambulanceId) {
  try {
    const location = await getCache(`${REDIS_KEYS.AMBULANCE_LOCATION}${ambulanceId}`);
    return location;
  } catch (error) {
    logger.error('Error getting ambulance location:', error);
    return null;
  }
};

/**
 * Get cached volunteer location
 * @param {string} volunteerId - Volunteer ID
 * @returns {object|null} Location data
 */
async function getVolunteerLocation(volunteerId) {
  try {
    const location = await getCache(`${REDIS_KEYS.VOLUNTEER_LOCATION}${volunteerId}`);
    return location;
  } catch (error) {
    logger.error('Error getting volunteer location:', error);
    return null;
  }
};

/**
 * Broadcast route update to incident trackers
 * @param {string} incidentId - Incident ID
 * @param {object} routeData - Route information
 */
function broadcastRouteUpdate(incidentId, routeData) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      route: routeData.route,
      distance: routeData.distance,
      duration: routeData.duration,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('route:updated', eventData);

    logger.debug(`Route update broadcast for incident ${incidentId}`);
  } catch (error) {
    logger.error('Error broadcasting route update:', error);
  }
};

/**
 * Emit arrival notification
 * @param {string} incidentId - Incident ID
 * @param {string} responderType - Type (ambulance/volunteer)
 * @param {string} responderId - Responder ID
 */
function emitArrivalNotification(incidentId, responderType, responderId) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      responderType,
      responderId,
      message: `${responderType} has arrived at the scene`,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('responder:arrived', eventData);

    logger.info(`Arrival notification emitted: ${responderType} at incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting arrival notification:', error);
  }
};

/**
 * Track incident live (all locations)
 * @param {string} incidentId - Incident ID
 * @param {object} locations - Object containing all location data
 */
function emitIncidentTracking(incidentId, locations) {
  try {
    const io = getIO();
    
    const trackingData = {
      incidentId,
      patient: locations.patient || null,
      ambulance: locations.ambulance || null,
      volunteer: locations.volunteer || null,
      hospital: locations.hospital || null,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('incident:tracking', trackingData);

    logger.debug(`Incident tracking data emitted for ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting incident tracking:', error);
  }
};

/**
 * Emit geofence alert (when responder enters area)
 * @param {string} userId - User ID to notify
 * @param {string} type - Alert type
 * @param {string} message - Alert message
 */
function emitGeofenceAlert(userId, type, message) {
  try {
    const io = getIO();
    
    const alertData = {
      type,
      message,
      timestamp: new Date()
    };

    io.to(`user:${userId}`).emit('geofence:alert', alertData);

    logger.debug(`Geofence alert emitted to user ${userId}: ${type}`);
  } catch (error) {
    logger.error('Error emitting geofence alert:', error);
  }
};

/**
 * Emit proximity alert (responder near patient)
 * @param {string} incidentId - Incident ID
 * @param {string} responderType - Type of responder
 * @param {number} distance - Distance in meters
 */
function emitProximityAlert(incidentId, responderType, distance) {
  try {
    const io = getIO();
    
    const alertData = {
      incidentId,
      responderType,
      distance,
      message: `${responderType} is ${distance}m away`,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('proximity:alert', alertData);

    logger.debug(`Proximity alert: ${responderType} ${distance}m from incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting proximity alert:', error);
  }
};

/**
 * Start location tracking session
 * @param {string} trackerId - Tracker ID (ambulance/volunteer)
 * @param {string} incidentId - Incident ID
 */
function startLocationTracking(trackerId, incidentId) {
  try {
    const io = getIO();
    
    io.to(`user:${trackerId}`).emit('tracking:start', {
      incidentId,
      message: 'Location tracking started',
      interval: 5000 // Update every 5 seconds
    });

    logger.info(`Location tracking started for ${trackerId} on incident ${incidentId}`);
  } catch (error) {
    logger.error('Error starting location tracking:', error);
  }
};

/**
 * Stop location tracking session
 * @param {string} trackerId - Tracker ID
 * @param {string} incidentId - Incident ID
 */
function stopLocationTracking(trackerId, incidentId) {
  try {
    const io = getIO();
    
    io.to(`user:${trackerId}`).emit('tracking:stop', {
      incidentId,
      message: 'Location tracking stopped'
    });

    logger.info(`Location tracking stopped for ${trackerId} on incident ${incidentId}`);
  } catch (error) {
    logger.error('Error stopping location tracking:', error);
  }
};

/**
 * Emit traffic update affecting route
 * @param {string} incidentId - Incident ID
 * @param {object} trafficData - Traffic information
 */
function emitTrafficUpdate(incidentId, trafficData) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      severity: trafficData.severity,
      delayMinutes: trafficData.delayMinutes,
      alternateRoute: trafficData.alternateRoute,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('traffic:update', eventData);

    logger.info(`Traffic update emitted for incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting traffic update:', error);
  }
};

/**
 * Calculate and emit distance updates
 * @param {string} incidentId - Incident ID
 * @param {string} responderType - Type of responder
 * @param {number} distance - Distance in km
 * @param {number} eta - Updated ETA in minutes
 */
function emitDistanceUpdate(incidentId, responderType, distance, eta) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      responderType,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimals
      eta,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('distance:update', eventData);

    logger.debug(`Distance update: ${responderType} ${distance}km, ETA ${eta}min`);
  } catch (error) {
    logger.error('Error emitting distance update:', error);
  }
};

module.exports = {
  updateAmbulanceLocation,
  updateVolunteerLocation,
  getAmbulanceLocation,
  getVolunteerLocation,
  broadcastRouteUpdate,
  emitArrivalNotification,
  emitIncidentTracking,
  emitGeofenceAlert,
  emitProximityAlert,
  startLocationTracking,
  stopLocationTracking,
  emitTrafficUpdate,
  emitDistanceUpdate
};