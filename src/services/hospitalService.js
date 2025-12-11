import { apiService } from './api';

class HospitalService {
  async getHospitalProfile(hospitalId = null) {
    try {
      const response = hospitalId
        ? await apiService.getHospitalProfile(hospitalId)
        : await apiService.getHospitalProfile();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  }

  async updateProfile(data) {
    try {
      const response = await apiService.updateHospitalProfile(data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
      };
    }
  }

  /**
   * Update bed availability for a specific bed type
   * @param {Object} params - Bed update parameters
   * @param {string} params.bedType - Type of bed ('general', 'icu', 'emergency')
   * @param {number} params.available - Number of available beds
   */
  async updateBedAvailability({ bedType, available, total }) {
    try {
      // Send total if provided
      const payload = { bedType, available };
      if (typeof total !== 'undefined') payload.total = total;
      console.log('Sending bed update:', payload); // Debug log
      const response = await apiService.updateBedAvailability(payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Bed update error:', error.response?.data); // Debug log
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to update bed availability',
      };
    }
  }

  async getIncomingPatients() {
    try {
      const response = await apiService.getIncomingPatients();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to fetch incoming patients',
      };
    }
  }

  async confirmPatientArrival(incidentId) {
    try {
      const response = await apiService.confirmPatientArrival(incidentId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to confirm arrival',
      };
    }
  }

  async getAvailableHospitals(location) {
    try {
      const response = await apiService.getAvailableHospitals(location);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch hospitals',
      };
    }
  }

  async searchHospitals(query) {
    try {
      const response = await apiService.searchHospitals(query);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search hospitals',
      };
    }
  }

  async getStats() {
    try {
      const response = await apiService.getHospitalStats();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stats',
      };
    }
  }
}

const hospitalService = new HospitalService();
export default hospitalService;
