/**
 * Centralized error messages for consistent API responses
 */

// ============================================
// AUTHENTICATION ERRORS
// ============================================
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Invalid email or password',
    statusCode: 401
  },
  TOKEN_MISSING: {
    code: 'AUTH_002',
    message: 'Authentication token is required',
    statusCode: 401
  },
  TOKEN_INVALID: {
    code: 'AUTH_003',
    message: 'Invalid or expired authentication token',
    statusCode: 401
  },
  TOKEN_EXPIRED: {
    code: 'AUTH_004',
    message: 'Authentication token has expired',
    statusCode: 401
  },
  UNAUTHORIZED: {
    code: 'AUTH_005',
    message: 'Unauthorized access',
    statusCode: 403
  },
  ACCOUNT_SUSPENDED: {
    code: 'AUTH_006',
    message: 'Your account has been suspended',
    statusCode: 403
  },
  ACCOUNT_NOT_VERIFIED: {
    code: 'AUTH_007',
    message: 'Please verify your account first',
    statusCode: 403
  }
};

// ============================================
// USER ERRORS
// ============================================
const USER_ERRORS = {
  NOT_FOUND: {
    code: 'USER_001',
    message: 'User not found',
    statusCode: 404
  },
  ALREADY_EXISTS: {
    code: 'USER_002',
    message: 'User with this email already exists',
    statusCode: 409
  },
  PHONE_EXISTS: {
    code: 'USER_003',
    message: 'User with this phone number already exists',
    statusCode: 409
  },
  INVALID_ROLE: {
    code: 'USER_004',
    message: 'Invalid user role',
    statusCode: 400
  },
  PROFILE_INCOMPLETE: {
    code: 'USER_005',
    message: 'Please complete your profile first',
    statusCode: 400
  }
};

// ============================================
// EMERGENCY ERRORS
// ============================================
const EMERGENCY_ERRORS = {
  CREATION_FAILED: {
    code: 'EMER_001',
    message: 'Failed to create emergency alert',
    statusCode: 500
  },
  NOT_FOUND: {
    code: 'EMER_002',
    message: 'Emergency incident not found',
    statusCode: 404
  },
  ALREADY_ACTIVE: {
    code: 'EMER_003',
    message: 'You already have an active emergency',
    statusCode: 409
  },
  INVALID_LOCATION: {
    code: 'EMER_004',
    message: 'Invalid location coordinates',
    statusCode: 400
  },
  NO_AMBULANCE: {
    code: 'EMER_005',
    message: 'No ambulance available in your area at the moment',
    statusCode: 503
  },
  NO_VOLUNTEER: {
    code: 'EMER_006',
    message: 'No volunteers available nearby',
    statusCode: 503
  },
  CANNOT_CANCEL: {
    code: 'EMER_007',
    message: 'Cannot cancel emergency after ambulance has arrived',
    statusCode: 400
  },
  INVALID_STATUS: {
    code: 'EMER_008',
    message: 'Invalid status transition',
    statusCode: 400
  }
};

// ============================================
// AMBULANCE ERRORS
// ============================================
const AMBULANCE_ERRORS = {
  NOT_FOUND: {
    code: 'AMB_001',
    message: 'Ambulance not found',
    statusCode: 404
  },
  ALREADY_REGISTERED: {
    code: 'AMB_002',
    message: 'Ambulance with this vehicle number already exists',
    statusCode: 409
  },
  NOT_AVAILABLE: {
    code: 'AMB_003',
    message: 'Ambulance is not available',
    statusCode: 400
  },
  ALREADY_ASSIGNED: {
    code: 'AMB_004',
    message: 'Ambulance is already assigned to another emergency',
    statusCode: 409
  },
  INVALID_STATUS: {
    code: 'AMB_005',
    message: 'Invalid ambulance status',
    statusCode: 400
  },
  LOCATION_UPDATE_FAILED: {
    code: 'AMB_006',
    message: 'Failed to update ambulance location',
    statusCode: 500
  }
};

// ============================================
// HOSPITAL ERRORS
// ============================================
const HOSPITAL_ERRORS = {
  NOT_FOUND: {
    code: 'HOSP_001',
    message: 'Hospital not found',
    statusCode: 404
  },
  ALREADY_REGISTERED: {
    code: 'HOSP_002',
    message: 'Hospital with this registration number already exists',
    statusCode: 409
  },
  NO_BEDS_AVAILABLE: {
    code: 'HOSP_003',
    message: 'No beds available at this hospital',
    statusCode: 503
  },
  INVALID_BED_COUNT: {
    code: 'HOSP_004',
    message: 'Available beds cannot exceed total beds',
    statusCode: 400
  },
  NO_SPECIALTY: {
    code: 'HOSP_005',
    message: 'No hospital with required specialty available',
    statusCode: 503
  }
};

// ============================================
// VOLUNTEER ERRORS
// ============================================
const VOLUNTEER_ERRORS = {
  NOT_FOUND: {
    code: 'VOL_001',
    message: 'Volunteer not found',
    statusCode: 404
  },
  NOT_VERIFIED: {
    code: 'VOL_002',
    message: 'Volunteer account not verified yet',
    statusCode: 403
  },
  PENDING_VERIFICATION: {
    code: 'VOL_003',
    message: 'Your volunteer application is pending verification',
    statusCode: 403
  },
  REJECTED: {
    code: 'VOL_004',
    message: 'Your volunteer application was rejected',
    statusCode: 403
  },
  NO_CERTIFICATE: {
    code: 'VOL_005',
    message: 'Valid CPR certificate required',
    statusCode: 400
  },
  CERTIFICATE_EXPIRED: {
    code: 'VOL_006',
    message: 'Your CPR certificate has expired',
    statusCode: 400
  },
  NOT_AVAILABLE: {
    code: 'VOL_007',
    message: 'Volunteer is not available',
    statusCode: 400
  },
  ALREADY_ASSIGNED: {
    code: 'VOL_008',
    message: 'Volunteer is already assigned to another emergency',
    statusCode: 409
  }
};

// ============================================
// BLOOD DONOR ERRORS
// ============================================
const DONOR_ERRORS = {
  NOT_FOUND: {
    code: 'DONOR_001',
    message: 'Blood donor not found',
    statusCode: 404
  },
  NOT_ELIGIBLE: {
    code: 'DONOR_002',
    message: 'You are not eligible to donate blood at this time',
    statusCode: 400
  },
  RECENTLY_DONATED: {
    code: 'DONOR_003',
    message: 'You must wait 3 months between donations',
    statusCode: 400
  },
  NOT_AVAILABLE: {
    code: 'DONOR_004',
    message: 'Donor is not available',
    statusCode: 400
  },
  NO_COMPATIBLE_DONOR: {
    code: 'DONOR_005',
    message: 'No compatible blood donor found nearby',
    statusCode: 503
  },
  INVALID_BLOOD_GROUP: {
    code: 'DONOR_006',
    message: 'Invalid blood group',
    statusCode: 400
  }
};

// ============================================
// VALIDATION ERRORS
// ============================================
const VALIDATION_ERRORS = {
  INVALID_INPUT: {
    code: 'VAL_001',
    message: 'Invalid input data',
    statusCode: 400
  },
  MISSING_FIELD: {
    code: 'VAL_002',
    message: 'Required field is missing',
    statusCode: 400
  },
  INVALID_EMAIL: {
    code: 'VAL_003',
    message: 'Invalid email format',
    statusCode: 400
  },
  INVALID_PHONE: {
    code: 'VAL_004',
    message: 'Invalid phone number format',
    statusCode: 400
  },
  WEAK_PASSWORD: {
    code: 'VAL_005',
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    statusCode: 400
  },
  INVALID_COORDINATES: {
    code: 'VAL_006',
    message: 'Invalid GPS coordinates',
    statusCode: 400
  },
  INVALID_DATE: {
    code: 'VAL_007',
    message: 'Invalid date format',
    statusCode: 400
  },
  INVALID_ID: {
    code: 'VAL_008',
    message: 'Invalid ID format',
    statusCode: 400
  }
};

// ============================================
// FILE UPLOAD ERRORS
// ============================================
const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: {
    code: 'UPLOAD_001',
    message: 'File size exceeds maximum limit (5MB)',
    statusCode: 400
  },
  INVALID_FILE_TYPE: {
    code: 'UPLOAD_002',
    message: 'Invalid file type. Only images and PDFs allowed',
    statusCode: 400
  },
  UPLOAD_FAILED: {
    code: 'UPLOAD_003',
    message: 'File upload failed',
    statusCode: 500
  },
  NO_FILE: {
    code: 'UPLOAD_004',
    message: 'No file provided',
    statusCode: 400
  }
};

// ============================================
// SERVER ERRORS
// ============================================
const SERVER_ERRORS = {
  INTERNAL_ERROR: {
    code: 'SERVER_001',
    message: 'Internal server error',
    statusCode: 500
  },
  DATABASE_ERROR: {
    code: 'SERVER_002',
    message: 'Database operation failed',
    statusCode: 500
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVER_003',
    message: 'Service temporarily unavailable',
    statusCode: 503
  },
  TIMEOUT: {
    code: 'SERVER_004',
    message: 'Request timeout',
    statusCode: 408
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'SERVER_005',
    message: 'External service error',
    statusCode: 502
  }
};

// ============================================
// RATE LIMITING ERRORS
// ============================================
const RATE_LIMIT_ERRORS = {
  TOO_MANY_REQUESTS: {
    code: 'RATE_001',
    message: 'Too many requests. Please try again later',
    statusCode: 429
  },
  EMERGENCY_SPAM: {
    code: 'RATE_002',
    message: 'Too many emergency alerts. Please wait before creating another',
    statusCode: 429
  }
};

// ============================================
// NOTIFICATION ERRORS
// ============================================
const NOTIFICATION_ERRORS = {
  SEND_FAILED: {
    code: 'NOTIF_001',
    message: 'Failed to send notification',
    statusCode: 500
  },
  INVALID_TOKEN: {
    code: 'NOTIF_002',
    message: 'Invalid device token',
    statusCode: 400
  },
  NO_RECIPIENTS: {
    code: 'NOTIF_003',
    message: 'No recipients available',
    statusCode: 400
  }
};

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Create custom error object
 * @param {object} errorTemplate - Error template from above
 * @param {string} customMessage - Optional custom message
 * @returns {object} Error object
 */
const createError = (errorTemplate, customMessage = null) => {
  return {
    success: false,
    error: {
      code: errorTemplate.code,
      message: customMessage || errorTemplate.message,
      statusCode: errorTemplate.statusCode
    }
  };
};

/**
 * Get error by code
 * @param {string} code - Error code
 * @returns {object} Error object
 */
const getErrorByCode = (code) => {
  const allErrors = {
    ...AUTH_ERRORS,
    ...USER_ERRORS,
    ...EMERGENCY_ERRORS,
    ...AMBULANCE_ERRORS,
    ...HOSPITAL_ERRORS,
    ...VOLUNTEER_ERRORS,
    ...DONOR_ERRORS,
    ...VALIDATION_ERRORS,
    ...UPLOAD_ERRORS,
    ...SERVER_ERRORS,
    ...RATE_LIMIT_ERRORS,
    ...NOTIFICATION_ERRORS
  };

  for (const key in allErrors) {
    if (allErrors[key].code === code) {
      return allErrors[key];
    }
  }

  return SERVER_ERRORS.INTERNAL_ERROR;
};

module.exports = {
  AUTH_ERRORS,
  USER_ERRORS,
  EMERGENCY_ERRORS,
  AMBULANCE_ERRORS,
  HOSPITAL_ERRORS,
  VOLUNTEER_ERRORS,
  DONOR_ERRORS,
  VALIDATION_ERRORS,
  UPLOAD_ERRORS,
  SERVER_ERRORS,
  RATE_LIMIT_ERRORS,
  NOTIFICATION_ERRORS,
  createError,
  getErrorByCode
}