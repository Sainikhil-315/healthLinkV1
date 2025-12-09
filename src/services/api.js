import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { token } = response.data.data;
          await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed - logout user
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA
        ]);
        
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const apiService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  sendOTP: () => api.post('/auth/send-otp'),
  verifyOTP: (otp) => api.post('/auth/verify-otp', { otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),

  // User
  getUserProfile: (userId) => api.get(`/users/${userId || 'profile'}`),
  updateUserProfile: (data) => api.put('/users/profile', data),
  updateLocation: (location) => api.put('/users/location', { location }),
  addEmergencyContact: (contact) => api.post('/users/emergency-contacts', contact),
  getEmergencyContacts: () => api.get('/users/emergency-contacts'),
  updateEmergencyContact: (contactId, data) => api.put(`/users/emergency-contacts/${contactId}`, data),
  deleteEmergencyContact: (contactId) => api.delete(`/users/emergency-contacts/${contactId}`),
  updateHealthProfile: (data) => api.put('/users/health-profile', data),
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUserStats: () => api.get('/users/stats'),
  deleteAccount: () => api.delete('/users/account'),

  // Emergency
  createEmergency: (data) => api.post('/emergency/create', data),
  getEmergency: (incidentId) => api.get(`/emergency/${incidentId}`),
  getMyEmergencies: () => api.get('/emergency/my/all'),
  getAllEmergencies: (params) => api.get('/emergency', { params }),
  getNearbyEmergencies: (location) => api.get('/emergency/nearby/active', { params: location }),
  updateEmergencyStatus: (incidentId, status) => api.put(`/emergency/${incidentId}/status`, { status }),
  cancelEmergency: (incidentId, reason) => api.post(`/emergency/${incidentId}/cancel`, { reason }),
  resolveEmergency: (incidentId, outcome) => api.post(`/emergency/${incidentId}/resolve`, { outcome }),
  acceptEmergencyRequest: (incidentId) => api.post(`/emergency/${incidentId}/accept`),
  declineEmergencyRequest: (incidentId, reason) => api.post(`/emergency/${incidentId}/decline`, { reason }),
  getEmergencyTracking: (incidentId) => api.get(`/emergency/${incidentId}/tracking`),
  getEmergencyTimeline: (incidentId) => api.get(`/emergency/${incidentId}/timeline`),
  rateResponder: (incidentId, rating) => api.post(`/emergency/${incidentId}/rate`, rating),

  // Hospital
  registerHospital: (data) => api.post('/hospitals/register', data),
  getHospitalProfile: (hospitalId) => api.get(`/hospitals/${hospitalId || 'profile'}`),
  updateHospitalProfile: (data) => api.put('/hospitals/profile', data),
  updateBedAvailability: (beds) => api.put('/hospitals/beds', beds),
  getIncomingPatients: () => api.get('/hospitals/patients/incoming'),
  confirmPatientArrival: (incidentId) => api.post(`/hospitals/patients/${incidentId}/arrived`),
  getAvailableHospitals: (location) => api.get('/hospitals/available/nearby', { params: location }),
  searchHospitals: (query) => api.get('/hospitals/search', { params: query }),
  getHospitalStats: () => api.get('/hospitals/stats'),

  // Ambulance
  registerAmbulance: (data) => api.post('/ambulances/register', data),
  getAmbulanceProfile: (ambulanceId) => api.get(`/ambulances/${ambulanceId || 'profile'}`),
  updateAmbulanceProfile: (data) => api.put('/ambulances/profile', data),
  updateAmbulanceLocation: (location) => api.put('/ambulances/location', { location }),
  updateAmbulanceStatus: (status) => api.put('/ambulances/status', { status }),
  getAvailableAmbulances: (location) => api.get('/ambulances/available/nearby', { params: location }),
  getCurrentTrip: () => api.get('/ambulances/trip/current'),
  getTripHistory: (params) => api.get('/ambulances/trip/history', { params }),
  acceptTrip: (incidentId) => api.post(`/ambulances/trip/${incidentId}/accept`),
  startTrip: (incidentId) => api.post(`/ambulances/trip/${incidentId}/start`),
  completeTrip: (incidentId) => api.post(`/ambulances/trip/${incidentId}/complete`),
  getAmbulanceStats: () => api.get('/ambulances/stats'),

  // Volunteer
  registerVolunteer: (data) => api.post('/volunteers/register', data),
  getVolunteerProfile: (volunteerId) => api.get(`/volunteers/${volunteerId || 'profile'}`),
  updateVolunteerProfile: (data) => api.put('/volunteers/profile', data),
  updateVolunteerLocation: (location) => api.put('/volunteers/location', { location }),
  updateVolunteerStatus: (status) => api.put('/volunteers/status', { status }),
  uploadCertificate: (formData) => api.post('/volunteers/certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCurrentMission: () => api.get('/volunteers/mission/current'),
  getMissionHistory: (params) => api.get('/volunteers/mission/history', { params }),
  acceptMission: (incidentId) => api.post(`/volunteers/mission/${incidentId}/accept`),
  arrivedAtScene: (incidentId) => api.post(`/volunteers/mission/${incidentId}/arrived`),
  completeMission: (incidentId, notes) => api.post(`/volunteers/mission/${incidentId}/complete`, { notes }),
  declineMission: (incidentId, reason) => api.post(`/volunteers/mission/${incidentId}/decline`, { reason }),
  getVolunteerStats: () => api.get('/volunteers/stats'),

  // Donor
  registerDonor: (data) => api.post('/donors/register', data),
  getDonorProfile: (donorId) => api.get(`/donors/${donorId || 'profile'}`),
  updateDonorProfile: (data) => api.put('/donors/profile', data),
  updateDonorLocation: (location) => api.put('/donors/location', { location }),
  updateDonorStatus: (status) => api.put('/donors/status', { status }),
  checkEligibility: () => api.get('/donors/eligibility'),
  getDonationHistory: (params) => api.get('/donors/history', { params }),
  acceptDonationRequest: (incidentId) => api.post(`/donors/request/${incidentId}/accept`),
  declineDonationRequest: (incidentId, reason) => api.post(`/donors/request/${incidentId}/decline`, { reason }),
  completeDonation: (incidentId) => api.post(`/donors/request/${incidentId}/complete`),
  getDonorStats: () => api.get('/donors/stats'),
  findCompatibleDonors: (params) => api.get('/donors/find/compatible', { params }),

  // Admin
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAllAmbulances: (params) => api.get('/admin/ambulances', { params }),
  verifyAmbulance: (ambulanceId) => api.put(`/admin/ambulances/${ambulanceId}/verify`),
  getAllHospitals: (params) => api.get('/admin/hospitals', { params }),
  verifyHospital: (hospitalId) => api.put(`/admin/hospitals/${hospitalId}/verify`),
  getAllVolunteers: (params) => api.get('/admin/volunteers', { params }),
  verifyVolunteer: (volunteerId) => api.put(`/admin/volunteers/${volunteerId}/verify`),
  rejectVolunteer: (volunteerId, reason) => api.put(`/admin/volunteers/${volunteerId}/reject`, { reason }),
  getAllDonors: (params) => api.get('/admin/donors', { params }),
  getAllIncidents: (params) => api.get('/admin/incidents', { params }),
  getIncidentStats: () => api.get('/admin/incidents/stats'),
  cancelIncident: (incidentId, reason) => api.put(`/admin/incidents/${incidentId}/cancel`, { reason })
};

export default api;