const { getIO } = require('../config/socket.js');
const { SOCKET_EVENTS } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * Emit emergency created event
 * Notifies all relevant parties about new emergency
 * @param {object} incident - Incident object
 * @param {array} notifiedParties - Array of {userId, role} objects
 */
function emitEmergencyCreated(incident, notifiedParties = []) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId: incident._id,
      type: incident.type,
      severity: incident.severity,
      location: {
        lat: incident.location.coordinates[1],
        lng: incident.location.coordinates[0],
        address: incident.location.address
      },
      patient: {
        name: incident.patient.name,
        age: incident.patient.age,
        bloodType: incident.patient.bloodType
      },
      status: incident.status,
      timestamp: incident.sosTriggeredAt
    };

    // Emit to patient/reporter
    io.to(`user:${incident.reportedBy}`).emit(SOCKET_EVENTS.EMERGENCY_CREATED, eventData);

    // Emit to all notified parties (ambulances, volunteers, hospitals)
    notifiedParties.forEach(party => {
      io.to(`user:${party.userId}`).emit(SOCKET_EVENTS.EMERGENCY_CREATED, eventData);
    });

    logger.info(`Emergency created event emitted for incident ${incident._id}`);
  } catch (error) {
    logger.error('Error emitting emergency created:', error);
  }
};

/**
 * Emit emergency status update
 * @param {object} incident - Updated incident object
 */
function emitEmergencyUpdated(incident) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId: incident._id,
      status: incident.status,
      severity: incident.severity,
      ambulanceId: incident.ambulance,
      volunteerId: incident.volunteer,
      hospitalId: incident.hospital,
      estimatedTimes: incident.estimatedTimes,
      timeline: incident.timeline,
      timestamp: new Date()
    };

    // Emit to incident room (all parties tracking this emergency)
    io.to(`incident:${incident._id}`).emit(SOCKET_EVENTS.EMERGENCY_UPDATED, eventData);

    logger.info(`Emergency updated event emitted for incident ${incident._id}`);
  } catch (error) {
    logger.error('Error emitting emergency updated:', error);
  }
};

/**
 * Emit ambulance assigned event
 * @param {string} incidentId - Incident ID
 * @param {object} ambulance - Ambulance object
 * @param {number} eta - Estimated time of arrival
 */
function emitAmbulanceAssigned(incidentId, ambulance, eta) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      ambulance: {
        id: ambulance._id,
        vehicleNumber: ambulance.vehicleNumber,
        type: ambulance.type,
        driverName: ambulance.driver.name,
        driverPhone: ambulance.driver.phone
      },
      eta,
      location: {
        lat: ambulance.currentLocation.coordinates[1],
        lng: ambulance.currentLocation.coordinates[0]
      },
      timestamp: new Date()
    };

    // Emit to incident room
    io.to(`incident:${incidentId}`).emit('ambulance:assigned', eventData);

    logger.info(`Ambulance assigned event emitted: ${ambulance.vehicleNumber} to incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting ambulance assigned:', error);
  }
};

/**
 * Emit volunteer assigned event
 * @param {string} incidentId - Incident ID
 * @param {object} volunteer - Volunteer object
 * @param {number} eta - Estimated time of arrival
 */
function emitVolunteerAssigned(incidentId, volunteer, eta) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      volunteer: {
        id: volunteer._id,
        name: volunteer.fullName,
        phone: volunteer.phone,
        certification: volunteer.certification?.organization
      },
      eta,
      location: {
        lat: volunteer.currentLocation.coordinates[1],
        lng: volunteer.currentLocation.coordinates[0]
      },
      timestamp: new Date()
    };

    // Emit to incident room
    io.to(`incident:${incidentId}`).emit('volunteer:assigned', eventData);

    logger.info(`Volunteer assigned event emitted: ${volunteer.fullName} to incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting volunteer assigned:', error);
  }
};

/**
 * Emit hospital assigned event
 * @param {string} incidentId - Incident ID
 * @param {object} hospital - Hospital object
 * @param {number} eta - Estimated time of arrival
 */
function emitHospitalAssigned(incidentId, hospital, eta) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        address: hospital.location.address,
        phone: hospital.emergencyPhone,
        bedsAvailable: hospital.bedAvailability?.emergency?.available || 0
      },
      eta,
      location: {
        lat: hospital.location.coordinates[1],
        lng: hospital.location.coordinates[0]
      },
      timestamp: new Date()
    };

    // Emit to incident room
    io.to(`incident:${incidentId}`).emit('hospital:assigned', eventData);

    logger.info(`Hospital assigned event emitted: ${hospital.name} to incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting hospital assigned:', error);
  }
};

/**
 * Emit blood donor request event
 * @param {string} incidentId - Incident ID
 * @param {array} donors - Array of donor objects
 * @param {string} bloodGroup - Required blood group
 */
function emitBloodDonorRequest(incidentId, donors, bloodGroup) {
  try {
    const io = getIO();
    
    donors.forEach(donor => {
      const eventData = {
        incidentId,
        bloodGroup,
        units: 1,
        urgency: 'high',
        timestamp: new Date()
      };

      io.to(`user:${donor._id}`).emit('donor:request', eventData);
    });

    logger.info(`Blood donor request emitted to ${donors.length} donors for incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting blood donor request:', error);
  }
};

/**
 * Emit ETA update
 * @param {string} incidentId - Incident ID
 * @param {string} responderType - Type of responder (ambulance/volunteer)
 * @param {number} newEta - Updated ETA in minutes
 */
function emitETAUpdate(incidentId, responderType, newEta) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      responderType,
      eta: newEta,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('eta:updated', eventData);

    logger.debug(`ETA update emitted for incident ${incidentId}: ${responderType} - ${newEta} min`);
  } catch (error) {
    logger.error('Error emitting ETA update:', error);
  }
};

/**
 * Emit emergency cancelled event
 * @param {string} incidentId - Incident ID
 * @param {string} reason - Cancellation reason
 */
function emitEmergencyCancelled(incidentId, reason) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      reason,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('emergency:cancelled', eventData);

    logger.info(`Emergency cancelled event emitted for incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting emergency cancelled:', error);
  }
};

/**
 * Emit emergency resolved event
 * @param {string} incidentId - Incident ID
 * @param {object} outcome - Outcome details
 */
function emitEmergencyResolved(incidentId, outcome) {
  try {
    const io = getIO();
    
    const eventData = {
      incidentId,
      outcome,
      timestamp: new Date()
    };

    io.to(`incident:${incidentId}`).emit('emergency:resolved', eventData);

    logger.info(`Emergency resolved event emitted for incident ${incidentId}`);
  } catch (error) {
    logger.error('Error emitting emergency resolved:', error);
  }
};

/**
 * Notify user to join incident room
 * @param {string} userId - User ID
 * @param {string} incidentId - Incident ID
 */
function notifyJoinIncidentRoom(userId, incidentId) {
  try {
    const io = getIO();
    
    io.to(`user:${userId}`).emit('incident:join', {
      incidentId,
      message: 'Please join incident tracking'
    });

    logger.debug(`Notified user ${userId} to join incident ${incidentId}`);
  } catch (error) {
    logger.error('Error notifying join incident room:', error);
  }
};

module.exports = {
  emitEmergencyCreated,
  emitEmergencyUpdated,
  emitAmbulanceAssigned,
  emitVolunteerAssigned,
  emitHospitalAssigned,
  emitBloodDonorRequest,
  emitETAUpdate,
  emitEmergencyCancelled,
  emitEmergencyResolved,
  notifyJoinIncidentRoom
};