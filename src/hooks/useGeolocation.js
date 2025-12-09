import { useState, useEffect } from 'react';
import locationService from '../services/locationService';

export default function useGeolocation(autoStart = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (autoStart) {
      getCurrentLocation();
    }
  }, [autoStart]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const position = await locationService.getCurrentLocation();
      setLocation(position);
      
      setLoading(false);
      return position;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const startTracking = async () => {
    try {
      setError(null);
      
      await locationService.startTracking((position) => {
        setLocation(position);
      });
      
      setTracking(true);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const stopTracking = () => {
    locationService.stopTracking();
    setTracking(false);
  };

  const getAddress = async (lat, lng) => {
    try {
      const address = await locationService.getAddressFromCoords(lat, lng);
      return address;
    } catch (err) {
      console.error('Get address error:', err);
      return null;
    }
  };

  return {
    location,
    error,
    loading,
    tracking,
    getCurrentLocation,
    startTracking,
    stopTracking,
    getAddress
  };
}