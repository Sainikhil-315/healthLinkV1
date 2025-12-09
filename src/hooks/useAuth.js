import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

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
}