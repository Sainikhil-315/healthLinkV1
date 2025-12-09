import { create } from 'zustand';
import { apiService } from '../services/api';
import socketService from '../services/socketService';

const useEmergencyStore = create((set, get) => ({
  // State
  activeEmergency: null,
  emergencies: [],
  tracking: null,
  isCreating: false,
  isLoading: false,
  error: null,

  // Actions
  createEmergency: async (emergencyData) => {
    try {
      set({ isCreating: true, error: null });

      const response = await apiService.createEmergency(emergencyData);
      const incident = response.data.incident;

      set({
        activeEmergency: incident,
        isCreating: false
      });

      // Join incident room for real-time updates
      socketService.joinIncidentRoom(incident.id);

      return { success: true, incident };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create emergency';
      set({ error: errorMessage, isCreating: false });
      return { success: false, error: errorMessage };
    }
  },

  getEmergency: async (incidentId) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.getEmergency(incidentId);
      const incident = response.data.incident;

      set({
        activeEmergency: incident,
        isLoading: false
      });

      return { success: true, incident };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch emergency';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  getMyEmergencies: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.getMyEmergencies();
      const incidents = response.data.incidents;

      set({
        emergencies: incidents,
        isLoading: false
      });

      return { success: true, incidents };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch emergencies';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  getEmergencyTracking: async (incidentId) => {
    try {
      const response = await apiService.getEmergencyTracking(incidentId);
      const tracking = response.data.tracking;

      set({ tracking });

      return { success: true, tracking };
    } catch (error) {
      console.error('Failed to get tracking:', error);
      return { success: false };
    }
  },

  cancelEmergency: async (incidentId, reason) => {
    try {
      set({ isLoading: true, error: null });

      await apiService.cancelEmergency(incidentId, reason);

      // Leave incident room
      socketService.leaveIncidentRoom(incidentId);

      set({
        activeEmergency: null,
        tracking: null,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel emergency';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateEmergencyStatus: (incidentId, statusData) => {
    const activeEmergency = get().activeEmergency;
    
    if (activeEmergency?.id === incidentId) {
      set({
        activeEmergency: {
          ...activeEmergency,
          ...statusData
        }
      });
    }
  },

  updateTracking: (trackingData) => {
    set({ tracking: trackingData });
  },

  clearActiveEmergency: () => {
    const activeEmergency = get().activeEmergency;
    if (activeEmergency) {
      socketService.leaveIncidentRoom(activeEmergency.id);
    }
    set({ activeEmergency: null, tracking: null });
  },

  setError: (error) => set({ error }),

  clearError: () => set({ error: null })
}));

export default useEmergencyStore;