import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import locationService from '../services/locationService';
import { apiService } from '../services/api';

export default function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadStoredAuth,
    clearError
  } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Start location tracking when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeLocationTracking();
    }

    return () => {
      if (isAuthenticated) {
        locationService.stopTracking();
      }
    };
  }, [isAuthenticated, user]);

  const initializeLocationTracking = async () => {
    try {
      // Get initial location
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        // Update location in database
        await apiService.updateLocation(location);
        console.log('Initial location updated:', location);
      }

      // Start continuous tracking for real-time updates
      await locationService.startTracking(async (newLocation) => {
        try {
          // Update location in database every time it changes
          await apiService.updateLocation(newLocation);
          console.log('Location updated:', newLocation);
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      });
    } catch (error) {
      console.error('Location tracking initialization error:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };
}a