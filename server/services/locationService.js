const logger = require('../utils/logger.js');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate ETA based on distance and speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} speedKmh - Average speed in km/h (default: 40 for ambulance)
 * @returns {number} ETA in minutes
 */
function calculateETA(distanceKm, speedKmh = 40) {
  const hours = distanceKm / speedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
};

/**
 * Find nearest entities from a location
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {array} entities - Array of entities with location.coordinates [lng, lat]
 * @param {number} maxDistance - Maximum search radius in km
 * @returns {array} Sorted array of entities with distance
 */
function findNearestEntities(origin, entities, maxDistance = 20) {
  try {
    const entitiesWithDistance = entities
      .map(entity => {
        // Handle both coordinate formats
        const entityLat = entity.currentLocation?.coordinates?.[1] ||
          entity.location?.coordinates?.[1];
        const entityLng = entity.currentLocation?.coordinates?.[0] ||
          entity.location?.coordinates?.[0];

        if (!entityLat || !entityLng) {
          logger.warn(`Entity ${entity._id} has invalid coordinates`);
          return null;
        }

        const distance = calculateDistance(
          origin.lat,
          origin.lng,
          entityLat,
          entityLng
        );

        return {
          ...entity._doc || entity,
          distance,
          eta: calculateETA(distance)
        };
      })
      .filter(entity => entity !== null && entity.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return entitiesWithDistance;
  } catch (error) {
    logger.error('Error finding nearest entities:', error);
    return [];
  }
};

/**
 * Find nearest available ambulance
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {array} ambulances - Array of ambulance objects
 * @param {number} maxDistance - Maximum search radius in km
 * @returns {object|null} Nearest available ambulance with distance and ETA
 */
function findNearestAmbulance(origin, ambulances, maxDistance = 20) {
  const available = ambulances.filter(amb =>
    amb.status === 'available' &&
    amb.isActive &&
    amb.isVerified
  );

  const nearest = findNearestEntities(origin, available, maxDistance);

  return nearest.length > 0 ? nearest[0] : null;
};

/**
 * Find nearest hospital with available beds
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {array} hospitals - Array of hospital objects
 * @param {string} bedType - Required bed type (general, icu, emergency)
 * @param {number} maxDistance - Maximum search radius in km
 * @returns {object|null} Nearest suitable hospital
 */
function findNearestHospital(origin, hospitals, bedType = 'emergency', maxDistance = 30) {
  const suitable = hospitals.filter(hospital =>
    hospital.isActive &&
    hospital.isVerified &&
    hospital.acceptingEmergencies &&
    hospital.bedAvailability?.[bedType]?.available > 0
  );

  const nearest = findNearestEntities(origin, suitable, maxDistance);

  return nearest.length > 0 ? nearest[0] : null;
};

/**
 * Find nearest volunteers
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {array} volunteers - Array of volunteer objects
 * @param {number} maxDistance - Maximum search radius in km (default 5km for volunteers)
 * @param {number} limit - Maximum number of volunteers to return
 * @returns {array} Array of nearest volunteers
 */
function findNearestVolunteers(origin, volunteers, maxDistance = 5, limit = 5) {
  const available = volunteers.filter(vol =>
    vol.status === 'available' &&
    vol.isActive &&
    vol.verificationStatus === 'verified' &&
    vol.certification?.isVerified &&
    new Date(vol.certification?.expiryDate) > new Date()
  );

  const nearest = findNearestEntities(origin, available, maxDistance);

  return nearest.slice(0, limit);
};

/**
 * Find compatible blood donors
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {array} donors - Array of donor objects
 * @param {string} bloodGroup - Required blood group
 * @param {number} maxDistance - Maximum search radius in km
 * @param {number} limit - Maximum number of donors to alert
 * @returns {array} Array of compatible donors
 */
function findCompatibleDonors(origin, donors, bloodGroup, maxDistance = 10, limit = 5) {
  // Blood compatibility map
  const compatibility = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
  };

  const compatibleGroups = compatibility[bloodGroup] || [bloodGroup];

  const eligible = donors.filter(donor => {
    // Check blood group compatibility
    if (!compatibleGroups.includes(donor.bloodType)) return false;

    // Check availability
    if (donor.status !== 'available' || !donor.isActive || !donor.isVerified) return false;

    // Check last donation date (must be 90+ days ago)
    if (donor.lastDonationDate) {
      const daysSince = (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);
      if (daysSince < 90) return false;
    }

    // Check health criteria
    if (donor.healthInfo?.weight < 45) return false;
    if (donor.healthInfo?.hasChronicIllness) return false;

    return true;
  });

  const nearest = findNearestEntities(origin, eligible, maxDistance);

  return nearest.slice(0, limit);
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
function validateCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Format ETA for display
 * @param {number} minutes - ETA in minutes
 * @returns {string} Formatted ETA string
 */
function formatETA(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

module.exports = {
  calculateDistance,
  calculateETA,
  findNearestEntities,
  findNearestAmbulance,
  findNearestHospital,
  findNearestVolunteers,
  findCompatibleDonors,
  validateCoordinates,
  formatDistance,
  formatETA
};