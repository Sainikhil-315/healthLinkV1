const { VALIDATION_ERRORS, createError } = require('../utils/errorMessages.js');
const { validateCoordinates } = require('../services/locationService.js');
const logger = require('../utils/logger.js');
const mongoose = require('mongoose');


/**
 * Validate MongoDB ObjectId
 * @param {string} paramName - Parameter name to validate
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (!id) {
      return res.status(400).json(createError(
        VALIDATION_ERRORS.MISSING_FIELD,
        `${paramName} is required`
      ));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(createError(VALIDATION_ERRORS.INVALID_ID));
    }

    next();
  };
};

/**
 * Validate location coordinates
 */
function validateLocation(req, res, next) {
  const { lat, lng } = req.body.location || req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Location coordinates (lat, lng) are required'
    ));
  }

  if (!validateCoordinates(lat, lng)) {
    return res.status(400).json(createError(VALIDATION_ERRORS.INVALID_COORDINATES));
  }

  next();
};

/**
 * Validate email format
 */
function validateEmail(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Email is required'
    ));
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(createError(VALIDATION_ERRORS.INVALID_EMAIL));
  }

  next();
};

/**
 * Validate phone number (Indian format)
 */
function validatePhone(req, res, next) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Phone number is required'
    ));
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json(createError(VALIDATION_ERRORS.INVALID_PHONE));
  }

  next();
};

/**
 * Validate password strength
 */
function validatePassword(req, res, next) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Password is required'
    ));
  }

  if (password.length < 8) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.WEAK_PASSWORD,
      'Password must be at least 8 characters long'
    ));
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return res.status(400).json(createError(VALIDATION_ERRORS.WEAK_PASSWORD));
  }

  next();
};

/**
 * Validate required fields
 * @param {string[]} fields - Array of required field names
 */
function validateRequired(fields) {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of fields) {
      // Check nested fields (e.g., 'location.lat')
      const fieldParts = field.split('.');
      let value = req.body;

      for (const part of fieldParts) {
        value = value?.[part];
      }

      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    next();
  };
};

/**
 * Validate triage answers for bystander emergency
 */
function validateTriage(req, res, next) {
  const { triageAnswers } = req.body;

  if (!triageAnswers) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Triage answers are required for bystander emergencies'
    ));
  }

  const requiredFields = ['conscious', 'breathing', 'bleeding'];
  const missing = requiredFields.filter(field =>
    typeof triageAnswers[field] !== 'boolean'
  );

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid triage answers',
      missingFields: missing
    });
  }

  next();
};

/**
 * Validate blood group
 */
function validateBloodGroup(req, res, next) {
  const { bloodGroup } = req.body;

  if (!bloodGroup) {
    return res.status(400).json(createError(
      VALIDATION_ERRORS.MISSING_FIELD,
      'Blood group is required'
    ));
  }

  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (!validBloodGroups.includes(bloodGroup)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid blood group',
      validBloodGroups
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
function validatePagination(req, res, next) {
  let { page, limit } = req.query;

  // Set defaults
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  // Validate ranges
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max 100 items per page

  // Attach to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

/**
 * Validate date format
 * @param {string} fieldName - Field name to validate
 */
function validateDate(fieldName) {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];

    if (!dateValue) {
      return res.status(400).json(createError(
        VALIDATION_ERRORS.MISSING_FIELD,
        `${fieldName} is required`
      ));
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return res.status(400).json(createError(VALIDATION_ERRORS.INVALID_DATE));
    }

    next();
  };
};

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(req, res, next) {
  // Simple XSS prevention (basic MVP implementation)
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }

    return obj;
  };

  req.body = sanitize(req.body);
  next();
};

/**
 * Validate enum values
 * @param {string} fieldName - Field name
 * @param {array} allowedValues - Array of allowed values
 */
function validateEnum(fieldName, allowedValues) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (!value) {
      return res.status(400).json(createError(
        VALIDATION_ERRORS.MISSING_FIELD,
        `${fieldName} is required`
      ));
    }

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName}`,
        allowedValues
      });
    }

    next();
  };
};

/**
 * Log validation errors
 */
function logValidationError(req, error) {
  logger.warn('Validation error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    body: req.body
  });
};

module.exports = {
  validateObjectId,
  validateLocation,
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequired,
  validateTriage,
  validateBloodGroup,
  validatePagination,
  validateDate,
  sanitizeInput,
  validateEnum,
  logValidationError
};