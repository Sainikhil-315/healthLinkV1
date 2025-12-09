import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import socketService from '../services/socketService';
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

      const response = await apiService.login(credentials);
      const { user, token, refreshToken } = response.data;

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
      const response = await apiService.register(userData);
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
        const user = JSON.parse(userData);
        
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

        // Refresh user data
        try {
          const response = await apiService.getCurrentUser();
          set({ user: response.data.user });
        } catch (error) {
          console.log('Failed to refresh user data:', error);
        }

        return true;
      } else {
        set({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Load stored auth error:', error);
      set({ isLoading: false });
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