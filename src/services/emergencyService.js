import { apiService } from './api';

class EmergencyService {
  // Create emergency
  async createEmergency(emergencyData) {
    try {
      const response = await apiService.createEmergency(emergencyData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create emergency'
      };
    }
  }

  // Get emergency details
  async getEmergency(incidentId) {
    try {
      const response = await apiService.getEmergency(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch emergency'
      };
    }
  }

  // Get my emergencies
  async getMyEmergencies() {
    try {
      const response = await apiService.getMyEmergencies();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch emergencies'
      };
    }
  }

  // Get emergency tracking
  async getEmergencyTracking(incidentId) {
    try {
      const response = await apiService.getEmergencyTracking(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch tracking'
      };
    }
  }

  // Cancel emergency
  async cancelEmergency(incidentId, reason) {
    try {
      const response = await apiService.cancelEmergency(incidentId, reason);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel emergency'
      };
    }
  }

  // Get timeline
  async getEmergencyTimeline(incidentId) {
    try {
      const response = await apiService.getEmergencyTimeline(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch timeline'
      };
    }
  }
}

const emergencyService = new EmergencyService();
export default emergencyService;