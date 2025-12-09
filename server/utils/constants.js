// User Roles
const USER_ROLES = {
  USER: 'user',
  HOSPITAL: 'hospital',
  AMBULANCE: 'ambulance',
  VOLUNTEER: 'volunteer',
  DONOR: 'donor',
  ADMIN: 'admin'
};

// Emergency Severity Levels
const SEVERITY_LEVELS = {
  CRITICAL: 'CRITICAL',    // Unconscious, not breathing
  HIGH: 'HIGH',            // Heavy bleeding, severe pain
  MEDIUM: 'MEDIUM',        // Conscious, moderate injury
  LOW: 'LOW'               // Minor injury, stable
};

// Emergency Types
const EMERGENCY_TYPES = {
  SELF: 'self',            // User's own emergency
  BYSTANDER: 'bystander'   // Reporting for someone else
};

// Incident Status
const INCIDENT_STATUS = {
  PENDING: 'pending',           // Just created
  DISPATCHED: 'dispatched',     // Ambulance assigned
  EN_ROUTE: 'en_route',         // Ambulance moving to patient
  ARRIVED: 'arrived',           // Ambulance at scene
  TRANSPORTING: 'transporting', // Moving to hospital
  COMPLETED: 'completed',       // Delivered to hospital
  CANCELLED: 'cancelled'        // Cancelled by user/admin
};

// Ambulance Types
const AMBULANCE_TYPES = {
  BASIC: 'basic',           // Basic Life Support
  ALS: 'als',               // Advanced Life Support
  CARDIAC: 'cardiac',       // Cardiac ambulance
  TRAUMA: 'trauma',         // Trauma ambulance
  NEONATAL: 'neonatal'      // Neonatal ambulance
};

// Ambulance Status
const AMBULANCE_STATUS = {
  AVAILABLE: 'available',
  ON_DUTY: 'on_duty',
  BUSY: 'busy',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance'
};

// Blood Groups
const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

// Blood Group Compatibility (who can receive from whom)
const BLOOD_COMPATIBILITY = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

// Volunteer Status
const VOLUNTEER_STATUS = {
  PENDING: 'pending',       // Awaiting verification
  VERIFIED: 'verified',     // Approved by admin
  AVAILABLE: 'available',   // Ready to respond
  BUSY: 'busy',             // Currently on a case
  OFF_DUTY: 'off_duty',     // Not available
  REJECTED: 'rejected',     // Admin rejected
  SUSPENDED: 'suspended'    // Temporarily suspended
};

// Donor Availability Status
const DONOR_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFF_DUTY: 'off_duty',
  RECENTLY_DONATED: 'recently_donated' // Within 3 months
};

// Hospital Bed Types
const BED_TYPES = {
  GENERAL: 'general',
  ICU: 'icu',
  EMERGENCY: 'emergency',
  ISOLATION: 'isolation'
};

// Medical Specialties
const SPECIALTIES = [
  'general',
  'cardiology',
  'neurology',
  'trauma',
  'pediatrics',
  'orthopedics',
  'emergency_medicine'
];

// Notification Types
const NOTIFICATION_TYPES = {
  EMERGENCY_ALERT: 'emergency_alert',
  AMBULANCE_ASSIGNED: 'ambulance_assigned',
  AMBULANCE_ARRIVED: 'ambulance_arrived',
  BLOOD_REQUEST: 'blood_request',
  VOLUNTEER_REQUEST: 'volunteer_request',
  STATUS_UPDATE: 'status_update',
  SYSTEM: 'system'
};

// Distance & Time Constants
const DISTANCE_CONSTANTS = {
  MAX_AMBULANCE_RADIUS_KM: parseInt(process.env.MAX_AMBULANCE_SEARCH_RADIUS_KM) || 20,
  MAX_VOLUNTEER_RADIUS_KM: parseInt(process.env.MAX_VOLUNTEER_SEARCH_RADIUS_KM) || 5,
  MAX_DONOR_RADIUS_KM: parseInt(process.env.MAX_DONOR_SEARCH_RADIUS_KM) || 10,
  CRITICAL_RESPONSE_TIME_MIN: parseInt(process.env.CRITICAL_RESPONSE_TIME_MINUTES) || 5
};

// Triage Questions for Bystander Emergency
const TRIAGE_QUESTIONS = [
  {
    id: 'conscious',
    question: 'Is the person conscious?',
    type: 'boolean',
    weight: 40
  },
  {
    id: 'breathing',
    question: 'Is the person breathing?',
    type: 'boolean',
    weight: 40
  },
  {
    id: 'bleeding',
    question: 'Is there heavy bleeding?',
    type: 'boolean',
    weight: 20
  }
];

// Redis Key Prefixes
const REDIS_KEYS = {
  AMBULANCE_LOCATION: 'ambulance:location:',
  VOLUNTEER_LOCATION: 'volunteer:location:',
  INCIDENT_CACHE: 'incident:',
  HOSPITAL_BEDS: 'hospital:beds:',
  ACTIVE_EMERGENCIES: 'emergency:active'
};

// Socket Events
const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Emergency events
  EMERGENCY_CREATED: 'emergency:created',
  EMERGENCY_UPDATED: 'emergency:updated',
  
  // Location tracking
  LOCATION_UPDATE: 'location:update',
  AMBULANCE_LOCATION: 'ambulance:location',
  
  // Notifications
  NEW_NOTIFICATION: 'notification:new',
  
  // Status updates
  STATUS_CHANGE: 'status:change'
};

// Email Templates
const EMAIL_TEMPLATES = {
  EMERGENCY_ALERT: 'emergency_alert',
  BLOOD_REQUEST: 'blood_request',
  VOLUNTEER_REQUEST: 'volunteer_request',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset'
};

// Response Messages
const MESSAGES = {
  SUCCESS: {
    EMERGENCY_CREATED: 'Emergency alert created successfully',
    AMBULANCE_DISPATCHED: 'Ambulance dispatched successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful'
  },
  ERROR: {
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    NO_AMBULANCE_AVAILABLE: 'No ambulance available in your area',
    ALREADY_EXISTS: 'Resource already exists'
  }
};

module.exports = {
  USER_ROLES,
  SEVERITY_LEVELS,
  EMERGENCY_TYPES,
  INCIDENT_STATUS,
  AMBULANCE_TYPES,
  AMBULANCE_STATUS,
  BLOOD_GROUPS,
  BLOOD_COMPATIBILITY,
  VOLUNTEER_STATUS,
  DONOR_STATUS,
  BED_TYPES,
  SPECIALTIES,
  NOTIFICATION_TYPES,
  DISTANCE_CONSTANTS,
  TRIAGE_QUESTIONS,
  REDIS_KEYS,
  SOCKET_EVENTS,
  EMAIL_TEMPLATES,
  MESSAGES
}