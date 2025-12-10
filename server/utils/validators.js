const Joi = require('joi');
const { BLOOD_GROUPS, USER_ROLES, AMBULANCE_TYPES, SEVERITY_LEVELS } = require('./constants.js');

// ============================================
// PHONE NORMALIZATION UTILITY
// ============================================

const normalizePhone = (value, helpers) => {
  if (!value) return value;
  
  let cleaned = value.toString().replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return helpers.error('string.pattern.base');
  }
  
  return cleaned;
};

const phoneValidation = Joi.string()
  .custom(normalizePhone, 'phone normalization')
  .required()
  .messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian number starting with 6-9',
    'any.required': 'Phone number is required'
  });

const phoneValidationOptional = Joi.string()
  .custom(normalizePhone, 'phone normalization')
  .optional()
  .messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian number starting with 6-9'
  });

// ============================================
// COMMON SCHEMAS
// ============================================

const coordinatesSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

const objectIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format'
});

// ============================================
// AUTH SCHEMAS
// ============================================

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  phone: phoneValidation,

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required'
    }),

  role: Joi.string().valid(...Object.values(USER_ROLES)).default('user'),

  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).optional(),

  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: phoneValidation,
      relation: Joi.string().required()
    })
  ).max(3).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: phoneValidationOptional,
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  address: Joi.string().max(500).optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  medications: Joi.array().items(Joi.string()).optional(),
  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: phoneValidation,
      relation: Joi.string().required()
    })
  ).max(3).optional()
}).min(1);

// ============================================
// EMERGENCY SCHEMAS
// ============================================

const createEmergencySchema = Joi.object({
  type: Joi.string().valid('self', 'bystander').required(),

  location: coordinatesSchema.required(),

  address: Joi.string().max(500).optional(),

  description: Joi.string().max(1000).when('type', {
    is: 'self',
    then: Joi.optional()
  }),

  triageAnswers: Joi.object({
    conscious: Joi.boolean().required(),
    breathing: Joi.boolean().required(),
    bleeding: Joi.boolean().required()
  }).when('type', {
    is: 'bystander',
    then: Joi.required()
  }),

  victimDescription: Joi.string().max(500).when('type', {
    is: 'bystander',
    then: Joi.optional()
  }),

  photoUrl: Joi.string().uri().optional(),

  requestBlood: Joi.boolean().default(false),

  requestVolunteer: Joi.boolean().default(false)
});

// ============================================
// HOSPITAL SCHEMAS
// ============================================

const registerHospitalSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  email: Joi.string().email().required(),
  phone: phoneValidation,
  password: Joi.string().min(8).required(),
  role: Joi.string().optional(), // Allow role field from frontend

  // Optional fields for initial registration - can be updated later
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional()
  }).optional(),
  
  address: Joi.object({
    street: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    pincode: Joi.string().pattern(/^\d{6}$/).optional()
  }).optional(),

  registrationNumber: Joi.string().optional(),

  beds: Joi.object({
    general: Joi.object({
      total: Joi.number().integer().min(0).optional().default(0),
      available: Joi.number().integer().min(0).optional().default(0)
    }).optional(),
    icu: Joi.object({
      total: Joi.number().integer().min(0).optional().default(0),
      available: Joi.number().integer().min(0).optional().default(0)
    }).optional(),
    emergency: Joi.object({
      total: Joi.number().integer().min(0).optional().default(0),
      available: Joi.number().integer().min(0).optional().default(0)
    }).optional()
  }).optional(),

  specialties: Joi.array().items(Joi.string()).optional().default([]),

  type: Joi.string().valid('Government', 'Private', 'Charitable').optional().default('Private'),

  emergencyPhone: Joi.string().optional()
}).unknown(true);

const updateHospitalBedsSchema = Joi.object({
  bedType: Joi.string().valid('general', 'icu', 'emergency').required(),
  available: Joi.number().integer().min(0).required()
});

// ============================================
// AMBULANCE SCHEMAS
// ============================================

const registerAmbulanceSchema = Joi.object({
  driverName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: phoneValidation,
  password: Joi.string().min(8).required(),

  vehicleNumber: Joi.string().uppercase().required(),
  ambulanceType: Joi.string().valid(...Object.values(AMBULANCE_TYPES)).required(),

  hospitalId: objectIdSchema.optional(),

  equipment: Joi.array().items(Joi.string()).optional(),

  licenseNumber: Joi.string().required()
});

const updateAmbulanceLocationSchema = Joi.object({
  location: coordinatesSchema.required()
});

const updateAmbulanceStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'on_duty', 'busy', 'offline').required()
});

// ============================================
// VOLUNTEER SCHEMAS
// ============================================

const registerVolunteerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: phoneValidation,
  password: Joi.string().min(8).required(),

  dateOfBirth: Joi.date().max('now').required().custom((value, helpers) => {
    const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18 || age > 65) {
      return helpers.error('any.invalid');
    }
    return value;
  }).messages({
    'any.invalid': 'Volunteer must be between 18-65 years old'
  }),

  address: Joi.string().max(500).required(),
  location: coordinatesSchema.required(),

  certifications: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      issuedBy: Joi.string().required(),
      issueDate: Joi.date().max('now').required(),
      expiryDate: Joi.date().greater(Joi.ref('issueDate')).optional(),
      certificateUrl: Joi.string().uri().optional()
    })
  ).min(1).required(),

  skills: Joi.array().items(Joi.string()).min(1).required()
});

// ============================================
// DONOR SCHEMAS
// ============================================

const registerDonorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: phoneValidation,
  password: Joi.string().min(8).required(),

  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).required(),

  dateOfBirth: Joi.date().max('now').required().custom((value, helpers) => {
    const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18 || age > 65) {
      return helpers.error('any.invalid');
    }
    return value;
  }).messages({
    'any.invalid': 'Donor must be between 18-65 years old'
  }),

  location: coordinatesSchema.required(),
  address: Joi.string().max(500).required(),

  lastDonationDate: Joi.date().max('now').optional(),

  medicalConditions: Joi.array().items(Joi.string()).optional()
});

const updateDonorAvailabilitySchema = Joi.object({
  status: Joi.string().valid('available', 'busy', 'off_duty').required()
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

function validate(schema) {
  return (req, res, next) => {
    console.log('Validation input for', req.originalUrl, req.body);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      // Debugging aid to surface validation issues during development
      console.error('Validation failed:', errors);

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  coordinatesSchema,
  objectIdSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createEmergencySchema,
  registerHospitalSchema,
  updateHospitalBedsSchema,
  registerAmbulanceSchema,
  updateAmbulanceLocationSchema,
  updateAmbulanceStatusSchema,
  registerVolunteerSchema,
  registerDonorSchema,
  updateDonorAvailabilitySchema,
  validate
};