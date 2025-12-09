const logger = require('../utils/logger.js');

/**
 * Predict bed availability when ambulance arrives (MVP: Simple rule-based)
 * In production, this could use ML models with historical data
 * @param {object} hospital - Hospital object
 * @param {number} eta - Estimated time of arrival in minutes
 * @param {string} bedType - Type of bed required
 * @returns {object} Prediction result
 */
function predictBedAvailability(hospital, eta, bedType = 'emergency') {
  try {
    const currentBeds = hospital.bedAvailability[bedType].available;
    const totalBeds = hospital.bedAvailability[bedType].total;

    // Simple rule-based prediction for MVP
    // Assumes average discharge/admission rate
    let predictedAvailable = currentBeds;

    // If ETA is more than 30 minutes, might have 1-2 discharges
    if (eta > 30) {
      predictedAvailable += Math.floor(eta / 30);
    }

    // Cap at total beds
    predictedAvailable = Math.min(predictedAvailable, totalBeds);

    // Calculate confidence (higher confidence if more beds available)
    const confidence = currentBeds > 5 ? 'high' : 
                      currentBeds > 2 ? 'medium' : 'low';

    const prediction = {
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      currentAvailable: currentBeds,
      predictedAvailable,
      bedType,
      eta,
      confidence,
      recommendation: predictedAvailable > 0 ? 'suitable' : 'find_alternative'
    };

    logger.info(`Bed availability prediction for ${hospital.name}: ${predictedAvailable} beds in ${eta} min`);
    return prediction;
  } catch (error) {
    logger.error('Error predicting bed availability:', error);
    return null;
  }
};

/**
 * Estimate ambulance response time based on historical data (MVP: simplified)
 * @param {number} distance - Distance in km
 * @param {string} severity - Emergency severity
 * @param {string} timeOfDay - morning, afternoon, evening, night
 * @returns {number} Estimated response time in minutes
 */
function predictResponseTime(distance, severity, timeOfDay = 'afternoon') {
  try {
    // Base calculation: distance / speed
    let baseSpeed = 40; // km/h

    // Adjust speed based on time of day (traffic patterns)
    const trafficMultipliers = {
      'morning': 0.8,    // Rush hour
      'afternoon': 1.0,  // Normal
      'evening': 0.85,   // Rush hour
      'night': 1.2       // Less traffic
    };

    const adjustedSpeed = baseSpeed * (trafficMultipliers[timeOfDay] || 1.0);
    
    // Calculate base ETA
    let eta = Math.ceil((distance / adjustedSpeed) * 60);

    // Add buffer time for ambulance preparation
    const preparationTime = severity === 'critical' ? 2 : 3;
    eta += preparationTime;

    // Add route complexity factor (simplified)
    const complexityBuffer = Math.ceil(distance * 0.1); // 10% buffer
    eta += complexityBuffer;

    logger.debug(`Predicted response time: ${eta} min (distance: ${distance}km, severity: ${severity})`);
    return eta;
  } catch (error) {
    logger.error('Error predicting response time:', error);
    return Math.ceil((distance / 40) * 60); // Fallback to simple calculation
  }
};

/**
 * Get time of day category
 * @returns {string} Time category
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Predict blood availability at hospital
 * @param {object} hospital - Hospital object
 * @param {string} bloodGroup - Required blood group
 * @returns {object} Blood availability prediction
 */
function predictBloodAvailability(hospital, bloodGroup) {
  try {
    // MVP: Simple check if hospital has blood bank
    // In production, would query actual blood inventory
    
    if (!hospital.facilities?.bloodBank) {
      return {
        available: false,
        confidence: 'high',
        recommendation: 'alert_donors',
        message: 'Hospital does not have blood bank - donors needed'
      };
    }

    // Assume hospitals with blood banks have common blood types
    const commonBloodTypes = ['O+', 'A+', 'B+', 'AB+'];
    const isCommon = commonBloodTypes.includes(bloodGroup);

    return {
      available: true,
      confidence: isCommon ? 'high' : 'medium',
      recommendation: isCommon ? 'likely_available' : 'alert_donors_precaution',
      message: isCommon ? 
        'Common blood type - likely available at hospital' :
        'Rare blood type - alert donors as precaution'
    };
  } catch (error) {
    logger.error('Error predicting blood availability:', error);
    return null;
  }
};

/**
 * Calculate optimal hospital selection score
 * Factors: distance, bed availability, specialty match, facilities
 * @param {object} hospital - Hospital object
 * @param {object} emergency - Emergency incident
 * @param {number} distance - Distance in km
 * @returns {number} Selection score (higher is better)
 */
function calculateHospitalScore(hospital, emergency, distance) {
  try {
    let score = 0;

    // Distance score (closer is better) - 30 points max
    const distanceScore = Math.max(0, 30 - (distance * 2));
    score += distanceScore;

    // Bed availability score - 25 points max
    const bedsAvailable = hospital.bedAvailability?.emergency?.available || 0;
    const bedScore = Math.min(25, bedsAvailable * 5);
    score += bedScore;

    // Severity match score - 20 points max
    if (emergency.severity === 'critical') {
      if (hospital.facilities?.ventilators > 0 && hospital.facilities?.oxygenAvailable) {
        score += 20;
      } else if (hospital.facilities?.oxygenAvailable) {
        score += 10;
      }
    } else {
      score += 15; // Any hospital is suitable for non-critical
    }

    // Hospital type score - 15 points max
    if (hospital.type === 'Government') {
      score += 10; // Preference for govt hospitals
    } else if (hospital.type === 'Charitable') {
      score += 8;
    } else {
      score += 15; // Private hospitals often well-equipped
    }

    // Blood bank availability - 10 points
    if (emergency.bloodRequired && hospital.facilities?.bloodBank) {
      score += 10;
    }

    logger.debug(`Hospital ${hospital.name} score: ${score} (distance: ${distance}km, beds: ${bedsAvailable})`);
    return score;
  } catch (error) {
    logger.error('Error calculating hospital score:', error);
    return 0;
  }
};

/**
 * Predict emergency duration (time from SOS to resolution)
 * @param {string} severity - Emergency severity
 * @param {number} ambulanceETA - Ambulance ETA in minutes
 * @param {number} hospitalDistance - Distance to hospital in km
 * @returns {object} Duration prediction
 */
function predictEmergencyDuration(severity, ambulanceETA, hospitalDistance) {
  try {
    // Component times
    const onSceneTime = severity === 'critical' ? 10 : 15; // Time spent at scene
    const transportTime = Math.ceil((hospitalDistance / 50) * 60); // Hospital transport
    const handoverTime = 10; // Hospital handover time

    const totalDuration = ambulanceETA + onSceneTime + transportTime + handoverTime;

    const breakdown = {
      ambulanceArrival: ambulanceETA,
      onSceneTreatment: onSceneTime,
      transportToHospital: transportTime,
      hospitalHandover: handoverTime,
      totalEstimated: totalDuration
    };

    logger.info(`Predicted emergency duration: ${totalDuration} minutes`);
    return breakdown;
  } catch (error) {
    logger.error('Error predicting emergency duration:', error);
    return null;
  }
};

/**
 * Assess resource availability trends
 * Used for dashboard analytics (MVP: simple current state)
 * @param {array} ambulances - All ambulances
 * @param {array} hospitals - All hospitals
 * @returns {object} Resource availability summary
 */
function assessResourceAvailability(ambulances, hospitals) {
  try {
    // Ambulance availability
    const totalAmbulances = ambulances.length;
    const availableAmbulances = ambulances.filter(a => a.status === 'available').length;
    const ambulanceUtilization = ((totalAmbulances - availableAmbulances) / totalAmbulances) * 100;

    // Hospital bed availability
    const totalBeds = hospitals.reduce((sum, h) => 
      sum + (h.bedAvailability?.emergency?.total || 0), 0);
    const availableBeds = hospitals.reduce((sum, h) => 
      sum + (h.bedAvailability?.emergency?.available || 0), 0);
    const bedUtilization = ((totalBeds - availableBeds) / totalBeds) * 100;

    // System capacity status
    let capacityStatus = 'optimal';
    if (ambulanceUtilization > 80 || bedUtilization > 80) {
      capacityStatus = 'critical';
    } else if (ambulanceUtilization > 60 || bedUtilization > 60) {
      capacityStatus = 'moderate';
    }

    const summary = {
      ambulances: {
        total: totalAmbulances,
        available: availableAmbulances,
        utilization: Math.round(ambulanceUtilization)
      },
      beds: {
        total: totalBeds,
        available: availableBeds,
        utilization: Math.round(bedUtilization)
      },
      capacityStatus,
      timestamp: new Date().toISOString()
    };

    logger.info(`Resource availability: ${capacityStatus} - ${availableAmbulances}/${totalAmbulances} ambulances, ${availableBeds}/${totalBeds} beds`);
    return summary;
  } catch (error) {
    logger.error('Error assessing resource availability:', error);
    return null;
  }
};

/**
 * Simple peak hours detection for resource allocation
 * @returns {object} Peak hours info
 */
function detectPeakHours() {
  const hour = new Date().getHours();
  
  // Emergency peak hours based on general patterns
  const peakHours = [8, 9, 18, 19, 20]; // Morning and evening rush
  const isPeak = peakHours.includes(hour);

  return {
    isPeak,
    currentHour: hour,
    recommendation: isPeak ? 
      'High demand period - prioritize resource allocation' :
      'Normal demand period'
  };
};

module.exports = {
  predictBedAvailability,
  predictResponseTime,
  getTimeOfDay,
  predictBloodAvailability,
  calculateHospitalScore,
  predictEmergencyDuration,
  assessResourceAvailability,
  detectPeakHours
};