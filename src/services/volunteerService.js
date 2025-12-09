import { apiService } from './api';

class VolunteerService {
  async getVolunteerProfile(volunteerId = null) {
    try {
      const response = volunteerId 
        ? await apiService.getVolunteerProfile(volunteerId)
        : await apiService.getVolunteerProfile();
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
      const response = await apiService.updateVolunteerProfile(data);
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
      const response = await apiService.updateVolunteerLocation(location);
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
      const response = await apiService.updateVolunteerStatus(status);
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

  async uploadCertificate(formData) {
    try {
      const response = await apiService.uploadCertificate(formData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload certificate'
      };
    }
  }

  async getCurrentMission() {
    try {
      const response = await apiService.getCurrentMission();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch current mission'
      };
    }
  }

  async getMissionHistory(params = {}) {
    try {
      const response = await apiService.getMissionHistory(params);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch mission history'
      };
    }
  }

  async acceptMission(incidentId) {
    try {
      const response = await apiService.acceptMission(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to accept mission'
      };
    }
  }

  async arrivedAtScene(incidentId) {
    try {
      const response = await apiService.arrivedAtScene(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to confirm arrival'
      };
    }
  }

  async completeMission(incidentId, notes) {
    try {
      const response = await apiService.completeMission(incidentId, notes);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to complete mission'
      };
    }
  }

  async declineMission(incidentId, reason) {
    try {
      const response = await apiService.declineMission(incidentId, reason);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to decline mission'
      };
    }
  }

  async getStats() {
    try {
      const response = await apiService.getVolunteerStats();
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

const volunteerService = new VolunteerService();
export default volunteerService;