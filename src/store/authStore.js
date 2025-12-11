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
  login: async credentials => {
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
          [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
        ]);
      } catch (storageError) {
        console.warn('Failed to save auth data to AsyncStorage:', storageError);
      }

      set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
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

  register: async userData => {
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
          [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
        ]);
      } catch (storageError) {
        console.warn('Failed to save auth data to AsyncStorage:', storageError);
      }

      set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
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
        console.warn(
          'Failed to update location after registration:',
          locationError,
        );
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed';
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
          STORAGE_KEYS.USER_DATA,
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
        error: null,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      // Get tokens from AsyncStorage
      let token = null;
      let refreshToken = null;
      try {
        const data = await AsyncStorage.multiGet([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
        if (data && data.length === 2) {
          token = data[0][1];
          refreshToken = data[1][1];
        }
      } catch (storageError) {
        console.warn('AsyncStorage access error:', storageError);
      }

      if (token) {
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

        // Always fetch user from backend for latest donor status
        try {
          const response = await apiService.getCurrentUser();
          if (response?.data?.user) {
            set({
              user: response.data.user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({ isLoading: false, isAuthenticated: false });
            return false;
          }
        } catch (error) {
          console.log('Failed to fetch user from backend:', error);
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
    } catch (error) {
      console.error('Load stored auth error:', error);
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  updateUser: userData => {
    set({ user: { ...get().user, ...userData } });
  },

  setError: error => set({ error }),

  clearError: () => set({ error: null }),

  becomeDonor: async (payload = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.becomeDonor(payload);
      if (response.success) {
        // Always use getCurrentUser for profile refresh
        const profileRes = await apiService.getCurrentUser();
        if (profileRes.success && profileRes.data?.user) {
          set(state => ({
            user: profileRes.data.user,
            isLoading: false,
          }));
        } else {
          set(state => ({
            user: {
              ...state.user,
              isDonor: true,
              lastDonationDate:
                response.data?.lastDonationDate || state.user.lastDonationDate,
              healthProfile:
                response.data?.healthProfile || state.user.healthProfile,
            },
            isLoading: false,
          }));
        }
      } else {
        set({ error: response.message, isLoading: false });
      }
      return response;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  becomeVolunteer: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.becomeVolunteer();
      if (response.success) {
        // Always use getCurrentUser for profile refresh
        const profileRes = await apiService.getCurrentUser();
        if (profileRes.success && profileRes.data?.user) {
          set(state => ({
            user: profileRes.data.user,
            isLoading: false,
          }));
        } else {
          set(state => ({
            user: {
              ...state.user,
              isVolunteer: true,
              volunteerStatus: 'pending',
            },
            isLoading: false,
          }));
          return { success: true };
        }
      } else {
        set({ error: response.message, isLoading: false });
      }
      return response;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useAuthStore;
