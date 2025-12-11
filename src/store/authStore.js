import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import socketService from '../services/socketService';
import locationService from '../services/locationService';
import { STORAGE_KEYS } from '../utils/constants';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      console.log('Logging in with credentials:', credentials);
      const response = await apiService.login(credentials);
      const { user, token, refreshToken } = response.data;
      console.log('Login response:', response);
      
      // Save to AsyncStorage with error handling
      try {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.AUTH_TOKEN, token],
          [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(user)]
        ]);
      } catch (storageError) {
        console.warn('Failed to save auth data to AsyncStorage:', storageError);
      }

      set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false
      });

      // Connect socket
      try {
        await socketService.connect();
      } catch (socketError) {
        console.warn('Socket connection error:', socketError);
      }

      // 🔥 GET AND UPDATE LOCATION IMMEDIATELY AFTER LOGIN
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          await apiService.updateLocation(location);
          console.log('✅ Location updated after login:', location);
        }
      } catch (locationError) {
        console.warn('Failed to update location after login:', locationError);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  register: async (userData) => {
    try {
      console.log('Registering user with data:', userData);
      set({ isLoading: true, error: null });
      
      // Use different endpoint for hospital registration
      let response;
      if (userData.role === 'hospital') {
        response = await apiService.registerHospital(userData);
      } else {
        response = await apiService.register(userData);
      }
      
      console.log('Registration response:', response);
      const { user, token, refreshToken } = response.data;

      try {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.AUTH_TOKEN, token],
          [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(user)]
        ]);
      } catch (storageError) {
        console.warn('Failed to save auth data to AsyncStorage:', storageError);
      }

      set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false
      });

      try {
        await socketService.connect();
      } catch (socketError) {
        console.warn('Socket connection error:', socketError);
      }

      // 🔥 GET AND UPDATE LOCATION IMMEDIATELY AFTER REGISTRATION
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          await apiService.updateLocation(location);
          console.log('✅ Location updated after registration:', location);
        }
      } catch (locationError) {
        console.warn('Failed to update location after registration:', locationError);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Stop location tracking
      locationService.stopTracking();

      // Clear storage with error handling
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA
        ]);
      } catch (storageError) {
        console.warn('Failed to clear AsyncStorage:', storageError);
      }

      // Disconnect socket
      try {
        socketService.disconnect();
      } catch (socketError) {
        console.warn('Socket disconnect error:', socketError);
      }

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      // Safely get AsyncStorage data with error handling
      let token = null;
      let refreshToken = null;
      let userData = null;

      try {
        const data = await AsyncStorage.multiGet([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA
        ]);
        
        if (data && data.length === 3) {
          token = data[0][1];
          refreshToken = data[1][1];
          userData = data[2][1];
        }
      } catch (storageError) {
        console.warn('AsyncStorage access error:', storageError);
      }

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          
          // Verify user has a valid role
          if (!user || !user.role) {
            console.warn('Invalid user data - no role found');
            set({ isLoading: false, isAuthenticated: false });
            return false;
          }

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Reconnect socket
          try {
            await socketService.connect();
          } catch (socketError) {
            console.warn('Socket connection error:', socketError);
          }

          // 🔥 UPDATE LOCATION ON APP RESTART
          try {
            const location = await locationService.getCurrentLocation();
            if (location) {
              await apiService.updateLocation(location);
              console.log('✅ Location updated on app restart:', location);
            }
          } catch (locationError) {
            console.warn('Failed to update location on restart:', locationError);
          }

          // Refresh user data to ensure it's current
          try {
            const response = await apiService.getCurrentUser();
            if (response?.data) {
              set({ user: response.data });
            }
          } catch (error) {
            console.log('Failed to refresh user data:', error);
          }

          return true;
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
      } else {
        console.log('No stored auth data found');
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
    } catch (error) {
      console.error('Load stored auth error:', error);
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  },

  setError: (error) => set({ error }),

  clearError: () => set({ error: null })
}));

export default useAuthStore;