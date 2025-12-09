import { apiService } from './api';

class DonorService {
  async getDonorProfile(donorId = null) {
    try {
      const response = donorId 
        ? await apiService.getDonorProfile(donorId)
        : await apiService.getDonorProfile();
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
      const response = await apiService.updateDonorProfile(data);
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
      const response = await apiService.updateDonorLocation(location);
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
      const response = await apiService.updateDonorStatus(status);
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

  async checkEligibility() {
    try {
      const response = await apiService.checkEligibility();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check eligibility'
      };
    }
  }

  async getDonationHistory(params = {}) {
    try {
      const response = await apiService.getDonationHistory(params);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch donation history'
      };
    }
  }

  async acceptDonationRequest(incidentId) {
    try {
      const response = await apiService.acceptDonationRequest(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to accept request'
      };
    }
  }

  async declineDonationRequest(incidentId, reason) {
    try {
      const response = await apiService.declineDonationRequest(incidentId, reason);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to decline request'
      };
    }
  }

  async completeDonation(incidentId) {
    try {
      const response = await apiService.completeDonation(incidentId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to complete donation'
      };
    }
  }

  async getStats() {
    try {
      const response = await apiService.getDonorStats();
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

  async findCompatibleDonors(params) {
    try {
      const response = await apiService.findCompatibleDonors(params);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to find donors'
      };
    }
  }
}

const donorService = new DonorService();
export default donorService;