const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger.js');
const { SOCKET_EVENTS } = require('../utils/constants.js');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {object} server - HTTP server instance
 * @returns {object} Socket.IO instance
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      logger.info(`Socket authenticated: User ${decoded.id} (${decoded.role})`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error.message);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Handle location updates (for ambulances, volunteers)
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, async (data) => {
      try {
        const { lat, lng } = data;

        if (!lat || !lng) {
          socket.emit('error', { message: 'Invalid location data' });
          return;
        }

        // Broadcast location to relevant rooms
        if (socket.userRole === 'ambulance') {
          io.to(`ambulance:${socket.userId}`).emit(SOCKET_EVENTS.AMBULANCE_LOCATION, {
            ambulanceId: socket.userId,
            location: { lat, lng },
            timestamp: new Date().toISOString()
          });
        } else if (socket.userRole === 'volunteer') {
          io.to(`volunteer:${socket.userId}`).emit('volunteer:location', {
            volunteerId: socket.userId,
            location: { lat, lng },
            timestamp: new Date().toISOString()
          });
        }

        logger.debug(`Location updated for ${socket.userRole}: ${socket.userId}`);
      } catch (error) {
        logger.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Join incident room (for tracking specific emergencies)
    socket.on('join:incident', (incidentId) => {
      socket.join(`incident:${incidentId}`);
      logger.info(`User ${socket.userId} joined incident room: ${incidentId}`);
    });

    // Leave incident room
    socket.on('leave:incident', (incidentId) => {
      socket.leave(`incident:${incidentId}`);
      logger.info(`User ${socket.userId} left incident room: ${incidentId}`);
    });

    // Join ambulance tracking room
    socket.on('track:ambulance', (ambulanceId) => {
      socket.join(`ambulance:${ambulanceId}`);
      logger.info(`User ${socket.userId} tracking ambulance: ${ambulanceId}`);
    });

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {object} Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToUser(userId, event, data) {
  if (!io) return;

  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug(`Event '${event}' emitted to user: ${userId}`);
};

/**
 * Emit event to specific role
 * @param {string} role - User role
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToRole(role, event, data) {
  if (!io) return;

  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug(`Event '${event}' emitted to role: ${role}`);
};

/**
 * Emit event to specific incident room
 * @param {string} incidentId - Incident ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToIncident(incidentId, event, data) {
  if (!io) return;

  io.to(`incident:${incidentId}`).emit(event, {
    ...data,
    incidentId,
    timestamp: new Date().toISOString()
  });

  logger.debug(`Event '${event}' emitted to incident: ${incidentId}`);
};

/**
 * Emit ambulance location update
 * @param {string} ambulanceId - Ambulance ID
 * @param {object} location - Location coordinates
 */
function emitAmbulanceLocation(ambulanceId, location) {
  if (!io) return;

  io.to(`ambulance:${ambulanceId}`).emit(SOCKET_EVENTS.AMBULANCE_LOCATION, {
    ambulanceId,
    location,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit emergency status update
 * @param {string} incidentId - Incident ID
 * @param {object} statusData - Status update data
 */
function emitEmergencyUpdate(incidentId, statusData) {
  if (!io) return;

  io.to(`incident:${incidentId}`).emit(SOCKET_EVENTS.EMERGENCY_UPDATED, {
    incidentId,
    ...statusData,
    timestamp: new Date().toISOString()
  });

  logger.info(`Emergency update emitted for incident: ${incidentId}`);
};

/**
 * Broadcast notification to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {object} notification - Notification data
 */
function broadcastNotification(userIds, notification) {
  if (!io) return;

  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, {
      ...notification,
      timestamp: new Date().toISOString()
    });
  });

  logger.debug(`Notification broadcast to ${userIds.length} user(s)`);
};

/**
 * Emit status change event
 * @param {string} entityType - Type of entity (ambulance, volunteer, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} status - New status
 */
function emitStatusChange(entityType, entityId, status) {
  if (!io) return;

  io.to(`${entityType}:${entityId}`).emit(SOCKET_EVENTS.STATUS_CHANGE, {
    entityType,
    entityId,
    status,
    timestamp: new Date().toISOString()
  });

  logger.debug(`Status change emitted: ${entityType} ${entityId} -> ${status}`);
};

/**
 * Get connected socket count
 * @returns {number} Number of connected sockets
 */
function getConnectedCount() {
  if (!io) return 0;
  return io.engine.clientsCount;
};

/**
 * Check if user is online
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Online status
 */
async function isUserOnline(userId) {
  if (!io) return false;

  const sockets = await io.in(`user:${userId}`).fetchSockets();
  return sockets.length > 0;
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToIncident,
  emitAmbulanceLocation,
  emitEmergencyUpdate,
  broadcastNotification,
  emitStatusChange,
  getConnectedCount,
  isUserOnline
};