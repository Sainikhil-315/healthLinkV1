const logger = require('../utils/logger.js');
const { calculateDistance, calculateETA } = require('./locationService.js');

/**
 * Score ambulance for emergency dispatch
 * Smart scoring algorithm: Distance 40%, ETA 40%, Equipment Match 20%
 * @param {object} ambulance - Ambulance object
 * @param {object} emergency - Emergency incident
 * @returns {number} Score (lower is better)
 */
function scoreAmbulance(ambulance, emergency) {
  try {
    const emergencyLat = emergency.location.coordinates[1];
    const emergencyLng = emergency.location.coordinates[0];
    
    const ambulanceLat = ambulance.currentLocation.coordinates[1];
    const ambulanceLng = ambulance.currentLocation.coordinates[0];

    // Calculate distance and ETA
    const distance = calculateDistance(emergencyLat, emergencyLng, ambulanceLat, ambulanceLng);
    const eta = calculateETA(distance);

    // Equipment match score
    let equipmentScore = 0.5; // Default baseline
    
    if (emergency.severity === 'critical') {
      if (ambulance.type === 'Cardiac' || ambulance.type === 'ALS') {
        equipmentScore = 1.0; // Perfect match
      } else {
        equipmentScore = 0.3; // Not ideal
      }
    } else if (emergency.severity === 'high') {
      if (ambulance.type === 'ALS' || ambulance.type === 'Cardiac') {
        equipmentScore = 1.0;
      } else if (ambulance.type === 'Basic') {
        equipmentScore = 0.7;
      }
    } else {
      // Medium/low severity - Basic is fine
      equipmentScore = ambulance.type === 'Basic' ? 1.0 : 0.8;
    }

    // Normalize scores (lower is better)
    const distanceScore = distance / 20; // Normalize by 20km
    const etaScore = eta / 30; // Normalize by 30 minutes
    const equipmentPenalty = (1 - equipmentScore); // Convert to penalty

    // Weighted final score: Distance 40%, ETA 40%, Equipment 20%
    const finalScore = (distanceScore * 0.4) + (etaScore * 0.4) + (equipmentPenalty * 0.2);

    return {
      ambulanceId: ambulance._id,
      score: finalScore,
      distance,
      eta,
      equipmentMatch: equipmentScore,
      ambulanceType: ambulance.type,
      vehicleNumber: ambulance.vehicleNumber
    };
  } catch (error) {
    logger.error('Error scoring ambulance:', error);
    return null;
  }
};

/**
 * Find best ambulance for emergency
 * @param {array} availableAmbulances - Array of available ambulances
 * @param {object} emergency - Emergency incident
 * @returns {object|null} Best matched ambulance with score details
 */
function findBestAmbulance(availableAmbulances, emergency) {
  try {
    if (!availableAmbulances || availableAmbulances.length === 0) {
      logger.warn('No ambulances available for matching');
      return null;
    }

    // Score all ambulances
    const scoredAmbulances = availableAmbulances
      .map(ambulance => scoreAmbulance(ambulance, emergency))
      .filter(result => result !== null)
      .sort((a, b) => a.score - b.score); // Sort by score (ascending, lower is better)

    if (scoredAmbulances.length === 0) {
      return null;
    }

    const bestMatch = scoredAmbulances[0];
    
    logger.info(`Best ambulance match: ${bestMatch.vehicleNumber}, Score: ${bestMatch.score.toFixed(3)}, Distance: ${bestMatch.distance}km, ETA: ${bestMatch.eta}min`);

    return {
      ambulanceId: bestMatch.ambulanceId,
      distance: bestMatch.distance,
      eta: bestMatch.eta,
      matchScore: bestMatch.score,
      ambulanceType: bestMatch.ambulanceType,
      vehicleNumber: bestMatch.vehicleNumber
    };
  } catch (error) {
    logger.error('Error finding best ambulance:', error);
    return null;
  }
};

/**
 * Find best hospital for patient
 * @param {array} availableHospitals - Array of hospitals
 * @param {object} emergency - Emergency incident
 * @param {string} requiredBedType - Type of bed needed
 * @returns {object|null} Best matched hospital
 */
function findBestHospital(availableHospitals, emergency, requiredBedType = 'emergency') {
  try {
    if (!availableHospitals || availableHospitals.length === 0) {
      return null;
    }

    const emergencyLat = emergency.location.coordinates[1];
    const emergencyLng = emergency.location.coordinates[0];

    const scoredHospitals = availableHospitals
      .map(hospital => {
        const hospitalLat = hospital.location.coordinates[1];
        const hospitalLng = hospital.location.coordinates[0];

        const distance = calculateDistance(emergencyLat, emergencyLng, hospitalLat, hospitalLng);
        const eta = calculateETA(distance, 50); // Slightly faster speed for hospital transport

        // Check bed availability
        const bedsAvailable = hospital.bedAvailability?.[requiredBedType]?.available || 0;
        
        // Check if hospital has required facilities
        let facilityScore = 0.5;
        if (emergency.severity === 'critical') {
          if (hospital.facilities?.oxygenAvailable && hospital.facilities?.ventilators > 0) {
            facilityScore = 1.0;
          }
        }

        // Check specialist availability
        let specialistScore = 0.5;
        if (emergency.requiredSpecialty && hospital.specialists) {
          const hasSpecialist = hospital.specialists.some(
            s => s.specialization === emergency.requiredSpecialty && s.isAvailable
          );
          if (hasSpecialist) specialistScore = 1.0;
        }

        // Score calculation (lower is better)
        const distanceScore = distance / 25; // Normalize by 25km
        const bedScore = bedsAvailable > 5 ? 0 : (1 - bedsAvailable / 5); // Prefer hospitals with more beds
        const facilityPenalty = (1 - facilityScore);
        const specialistPenalty = (1 - specialistScore);

        const score = (distanceScore * 0.4) + (bedScore * 0.2) + (facilityPenalty * 0.2) + (specialistPenalty * 0.2);

        return {
          hospitalId: hospital._id,
          name: hospital.name,
          score,
          distance,
          eta,
          bedsAvailable,
          facilityScore,
          specialistScore
        };
      })
      .filter(result => result.bedsAvailable > 0)
      .sort((a, b) => a.score - b.score);

    if (scoredHospitals.length === 0) {
      return null;
    }

    const bestMatch = scoredHospitals[0];
    
    logger.info(`Best hospital match: ${bestMatch.name}, Distance: ${bestMatch.distance}km, Beds: ${bestMatch.bedsAvailable}`);

    return bestMatch;
  } catch (error) {
    logger.error('Error finding best hospital:', error);
    return null;
  }
};

/**
 * Rank volunteers by response capability
 * @param {array} volunteers - Array of volunteers
 * @param {object} emergency - Emergency incident
 * @returns {array} Ranked volunteers
 */
function rankVolunteers(volunteers, emergency) {
  try {
    const emergencyLat = emergency.location.coordinates[1];
    const emergencyLng = emergency.location.coordinates[0];

    const rankedVolunteers = volunteers
      .map(volunteer => {
        const volunteerLat = volunteer.currentLocation.coordinates[1];
        const volunteerLng = volunteer.currentLocation.coordinates[0];

        const distance = calculateDistance(emergencyLat, emergencyLng, volunteerLat, volunteerLng);
        const eta = calculateETA(distance, 15); // Walking/running speed ~15 km/h

        // Priority factors
        const experienceScore = volunteer.stats.completedMissions / 50; // Normalize by 50 missions
        const ratingScore = volunteer.stats.averageRating / 5; // Normalize rating
        const distanceScore = 1 - (distance / 5); // Normalize by 5km, closer is better

        const score = (distanceScore * 0.6) + (experienceScore * 0.2) + (ratingScore * 0.2);

        return {
          volunteerId: volunteer._id,
          name: volunteer.fullName,
          distance,
          eta,
          rating: volunteer.stats.averageRating,
          completedMissions: volunteer.stats.completedMissions,
          score
        };
      })
      .sort((a, b) => b.score - a.score); // Sort descending (higher is better)

    return rankedVolunteers;
  } catch (error) {
    logger.error('Error ranking volunteers:', error);
    return [];
  }
};

/**
 * Rank blood donors by compatibility and availability
 * @param {array} donors - Array of donors
 * @param {object} emergency - Emergency incident
 * @param {string} requiredBloodGroup - Required blood group
 * @returns {array} Ranked donors
 */
function rankDonors(donors, emergency, requiredBloodGroup) {
  try {
    const emergencyLat = emergency.location.coordinates[1];
    const emergencyLng = emergency.location.coordinates[0];

    const rankedDonors = donors
      .map(donor => {
        const donorLat = donor.currentLocation.coordinates[1];
        const donorLng = donor.currentLocation.coordinates[0];

        const distance = calculateDistance(emergencyLat, emergencyLng, donorLat, donorLng);
        const eta = calculateETA(distance, 30); // Assume car travel

        // Check blood group exact match vs compatible
        const exactMatch = donor.bloodType === requiredBloodGroup;
        const matchScore = exactMatch ? 1.0 : 0.7;

        // Experience score
        const experienceScore = donor.stats.completedDonations / 10;

        // Recency score (prefer donors who haven't donated recently but are eligible)
        let recencyScore = 1.0;
        if (donor.lastDonationDate) {
          const daysSince = (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);
          recencyScore = Math.min(daysSince / 180, 1.0); // Normalize by 6 months
        }

        // Distance score
        const distanceScore = 1 - (distance / 10); // Normalize by 10km

        const score = (distanceScore * 0.5) + (matchScore * 0.3) + (experienceScore * 0.1) + (recencyScore * 0.1);

        return {
          donorId: donor._id,
          name: donor.fullName,
          bloodType: donor.bloodType,
          distance,
          eta,
          exactMatch,
          completedDonations: donor.stats.completedDonations,
          score
        };
      })
      .sort((a, b) => b.score - a.score); // Sort descending

    return rankedDonors;
  } catch (error) {
    logger.error('Error ranking donors:', error);
    return [];
  }
};

module.exports = {
  scoreAmbulance,
  findBestAmbulance,
  findBestHospital,
  rankVolunteers,
  rankDonors
};