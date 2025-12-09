import { apiService } from './api';

class AmbulanceService {
  async getAmbulanceProfile(ambulanceId = null) {
    try {
      const response = ambulanceId 
        ? await apiService.getAmbulanceProfile(ambulanceId)
        : await apiService.getAmbulanceProfile();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  }

  async updateProfile(data) {
    try {
      const response = await apiService.updateAmbulanceProfile(data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }

  async updateLocation(location) {
    try {
      const response = await apiService.updateAmbulanceLocation(location);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update location'
      };
    }
  }

  async updateStatus(status) {
    try {
      const response = await apiService.updateAmbulanceStatus(status);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update status'
      };
    }
  }

  async getCurrentTrip() {
    try {
      const response = await apiService.getCurrentTrip();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch current trip'
      };
    }
  }

  async getTripHistory(params = {}) {
    try {
      const response = await apiService.getTripHistory(params);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch trip history'
      };
    }
  }

  async acceptTrip(incidentId) {
    try {
      const response = await apiService.acceptTrip(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to accept trip'
      };
    }
  }

  async startTrip(incidentId) {
    try {
      const response = await apiService.startTrip(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start trip'
      };
    }
  }

  async completeTrip(incidentId) {
    try {
      const response = await apiService.completeTrip(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to complete trip'
      };
    }
  }

  async getStats() {
    try {
      const response = await apiService.getAmbulanceStats();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stats'
      };
    }
  }
}

const ambulanceService = new AmbulanceService();
export default ambulanceService;