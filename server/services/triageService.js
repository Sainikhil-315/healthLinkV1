const { SEVERITY_LEVELS } = require('../utils/constants.js');
const logger = require('../utils/logger.js');

/**
 * Calculate emergency severity based on triage responses
 * @param {object} triageData - Triage questionnaire responses
 * @returns {string} Severity level (CRITICAL, HIGH, MEDIUM, LOW)
 */
function calculateSeverity(triageData) {
  try {
    const { conscious, breathing, bleeding } = triageData;

    // CRITICAL: Not conscious AND not breathing
    if (!conscious && !breathing) {
      logger.info('Severity calculated: CRITICAL (unconscious + not breathing)');
      return SEVERITY_LEVELS.CRITICAL;
    }

    // CRITICAL: Not breathing (regardless of consciousness)
    if (!breathing) {
      logger.info('Severity calculated: CRITICAL (not breathing)');
      return SEVERITY_LEVELS.CRITICAL;
    }

    // HIGH: Not conscious OR heavy bleeding
    if (!conscious || bleeding) {
      logger.info('Severity calculated: HIGH (unconscious or bleeding)');
      return SEVERITY_LEVELS.HIGH;
    }

    // MEDIUM: Conscious, breathing, no heavy bleeding
    logger.info('Severity calculated: MEDIUM (stable)');
    return SEVERITY_LEVELS.MEDIUM;

  } catch (error) {
    logger.error('Error calculating severity:', error);
    // Default to HIGH for safety
    return SEVERITY_LEVELS.HIGH;
  }
};

/**
 * Determine required ambulance type based on severity
 * @param {string} severity - Emergency severity level
 * @returns {string[]} Array of suitable ambulance types
 */
function getRequiredAmbulanceType(severity) {
  const ambulanceTypes = {
    [SEVERITY_LEVELS.CRITICAL]: ['Cardiac', 'ALS', 'Basic'],
    [SEVERITY_LEVELS.HIGH]: ['ALS', 'Basic'],
    [SEVERITY_LEVELS.MEDIUM]: ['Basic', 'ALS'],
    [SEVERITY_LEVELS.LOW]: ['Basic']
  };

  return ambulanceTypes[severity] || ['Basic'];
};

/**
 * Determine if volunteer first responder is needed
 * @param {string} severity - Emergency severity level
 * @param {object} triageData - Triage responses
 * @returns {boolean} True if volunteer needed
 */
function shouldDispatchVolunteer(severity, triageData) {
  // Dispatch volunteer only for CRITICAL cases where CPR might be needed
  if (severity === SEVERITY_LEVELS.CRITICAL) {
    // If not breathing or not conscious, CPR might be needed
    if (!triageData.breathing || !triageData.conscious) {
      logger.info('Volunteer dispatch recommended for critical case');
      return true;
    }
  }
  return false;
};

/**
 * Determine if blood donor should be alerted
 * @param {string} severity - Emergency severity level
 * @param {object} triageData - Triage responses
 * @returns {boolean} True if blood donor needed
 */
function shouldRequestBloodDonor(severity, triageData) {
  // Request blood donor for heavy bleeding cases
  if (triageData.bleeding && (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH)) {
    logger.info('Blood donor request recommended');
    return true;
  }
  return false;
};

/**
 * Get recommended hospital specialty based on symptoms
 * @param {object} triageData - Triage responses
 * @param {string} description - Optional description
 * @returns {string[]} Array of recommended specialties
 */
function getRecommendedSpecialties(triageData, description = '') {
  const specialties = [];
  
  // Default to emergency medicine
  specialties.push('emergency_medicine');

  // If heavy bleeding, add trauma
  if (triageData.bleeding) {
    specialties.push('trauma');
  }

  // If breathing issues, add cardiology and pulmonology
  if (!triageData.breathing) {
    specialties.push('cardiology');
  }

  // Check description for keywords
  const descriptionLower = description.toLowerCase();
  
  if (descriptionLower.includes('chest') || descriptionLower.includes('heart')) {
    specialties.push('cardiology');
  }
  
  if (descriptionLower.includes('head') || descriptionLower.includes('brain')) {
    specialties.push('neurology');
  }

  if (descriptionLower.includes('bone') || descriptionLower.includes('fracture')) {
    specialties.push('orthopedics');
  }

  return [...new Set(specialties)]; // Remove duplicates
};

/**
 * Estimate response time priority
 * @param {string} severity - Emergency severity level
 * @returns {number} Priority score (1-5, 1 = highest priority)
 */
function getResponsePriority(severity) {
  const priorities = {
    [SEVERITY_LEVELS.CRITICAL]: 1,
    [SEVERITY_LEVELS.HIGH]: 2,
    [SEVERITY_LEVELS.MEDIUM]: 3,
    [SEVERITY_LEVELS.LOW]: 4
  };

  return priorities[severity] || 3;
};

/**
 * Generate emergency action plan
 * @param {string} severity - Emergency severity level
 * @param {object} triageData - Triage responses
 * @returns {object} Action plan
 */
function generateActionPlan(severity, triageData) {
  const plan = {
    severity,
    dispatchVolunteer: shouldDispatchVolunteer(severity, triageData),
    requestBloodDonor: shouldRequestBloodDonor(severity, triageData),
    ambulanceTypes: getRequiredAmbulanceType(severity),
    specialties: getRecommendedSpecialties(triageData),
    priority: getResponsePriority(severity),
    estimatedResponseTime: severity === SEVERITY_LEVELS.CRITICAL ? 5 : 
                           severity === SEVERITY_LEVELS.HIGH ? 8 : 12
  };

  logger.info('Action plan generated:', plan);
  return plan;
};

/**
 * Validate triage data
 * @param {object} triageData - Triage responses
 * @returns {boolean} True if valid
 */
function validateTriageData(triageData) {
  if (!triageData) return false;
  
  const required = ['conscious', 'breathing', 'bleeding'];
  
  for (const field of required) {
    if (typeof triageData[field] !== 'boolean') {
      return false;
    }
  }
  
  return true;
};

module.exports = {
  calculateSeverity,
  getRequiredAmbulanceType,
  shouldDispatchVolunteer,
  shouldRequestBloodDonor,
  getRecommendedSpecialties,
  getResponsePriority,
  generateActionPlan,
  validateTriageData
};