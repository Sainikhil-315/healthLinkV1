// API Configuration
export const API_URL = 'http://10.254.57.6:5000/api/v1';
export const SOCKET_URL = 'http://10.254.57.6:5000';

// User Roles
export const USER_ROLES = {
  USER: 'user',
  HOSPITAL: 'hospital',
  AMBULANCE: 'ambulance',
  VOLUNTEER: 'volunteer',
  DONOR: 'donor',
  ADMIN: 'admin',
};

// Emergency Severity Levels
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Emergency Types
export const EMERGENCY_TYPES = {
  SELF: 'self',
  BYSTANDER: 'bystander',
};

// Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Ambulance Types
export const AMBULANCE_TYPES = {
  BASIC: 'Basic',
  ALS: 'ALS',
  CARDIAC: 'Cardiac',
  NEONATAL: 'Neonatal',
};

// Status Colors
export const STATUS_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#10B981',
  available: '#10B981',
  on_duty: '#F59E0B',
  offline: '#6B7280',
};

// Triage Questions
export const TRIAGE_QUESTIONS = [
  {
    id: 'conscious',
    question: 'Is the person conscious?',
    type: 'boolean',
  },
  {
    id: 'breathing',
    question: 'Is the person breathing?',
    type: 'boolean',
  },
  {
    id: 'bleeding',
    question: 'Is there heavy bleeding?',
    type: 'boolean',
  },
];

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@healthlink:auth_token',
  REFRESH_TOKEN: '@healthlink:refresh_token',
  USER_DATA: '@healthlink:user_data',
  FCM_TOKEN: '@healthlink:fcm_token',
  LOCATION_PERMISSION: '@healthlink:location_permission',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 5,
    longitudeDelta: 5,
  },
  ZOOM_LEVEL: 15,
  AMBULANCE_MARKER_SIZE: 40,
  USER_MARKER_SIZE: 35,
  HOSPITAL_MARKER_SIZE: 45,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  EMERGENCY_ALERT: 'emergency_alert',
  AMBULANCE_REQUEST: 'ambulance_request',
  VOLUNTEER_REQUEST: 'volunteer_request',
  BLOOD_REQUEST: 'blood_request',
  STATUS_UPDATE: 'status_update',
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EMERGENCY_CREATED: 'emergency:created',
  EMERGENCY_UPDATED: 'emergency:updated',
  LOCATION_UPDATE: 'location:update',
  AMBULANCE_LOCATION: 'ambulance:location',
  STATUS_CHANGE: 'status:change',
  NEW_NOTIFICATION: 'notification:new',
};

// Permissions
export const PERMISSIONS = {
  LOCATION: 'location',
  CAMERA: 'camera',
  NOTIFICATIONS: 'notifications',
  MICROPHONE: 'microphone',
};

// Theme Colors
export const COLORS = {
  primary: '#DC2626',
  secondary: '#059669',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  error: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
};

// Screen Names
export const SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  ONBOARDING: 'Onboarding',

  // User
  USER_DASHBOARD: 'UserDashboard',
  EMERGENCY_SOS: 'EmergencySOS',
  TRACK_AMBULANCE: 'TrackAmbulance',
  USER_PROFILE: 'UserProfile',

  // Hospital
  HOSPITAL_DASHBOARD: 'HospitalDashboard',
  MANAGE_BEDS: 'ManageBeds',
  INCOMING_ALERTS: 'IncomingAlerts',

  // Ambulance
  DRIVER_DASHBOARD: 'DriverDashboard',
  ACTIVE_EMERGENCY: 'ActiveEmergency',
  NAVIGATION: 'Navigation',

  // Volunteer
  VOLUNTEER_DASHBOARD: 'VolunteerDashboard',
  NEARBY_EMERGENCIES: 'NearbyEmergencies',

  // Donor
  DONOR_DASHBOARD: 'DonorDashboard',
  REQUESTS_LIST: 'RequestsList',

  // Admin
  ADMIN_DASHBOARD: 'AdminDashboard',
};

// Validation Patterns
export const PATTERNS = {
  EMAIL: /^\S+@\S+\.\S+$/,
  PHONE: /^[6-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  VEHICLE_NUMBER: /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOCATION_DENIED: 'Location permission is required for emergency services.',
  CAMERA_DENIED: 'Camera permission is required to capture photos.',
  NOTIFICATION_DENIED:
    'Notification permission is required for emergency alerts.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NO_AMBULANCE: 'No ambulance available in your area.',
  ALREADY_ACTIVE: 'You already have an active emergency.',
};

export default {
  API_URL,
  SOCKET_URL,
  USER_ROLES,
  SEVERITY_LEVELS,
  EMERGENCY_TYPES,
  BLOOD_GROUPS,
  AMBULANCE_TYPES,
  STATUS_COLORS,
  TRIAGE_QUESTIONS,
  STORAGE_KEYS,
  MAP_CONFIG,
  NOTIFICATION_TYPES,
  SOCKET_EVENTS,
  PERMISSIONS,
  COLORS,
  SCREENS,
  PATTERNS,
  ERROR_MESSAGES,
};
