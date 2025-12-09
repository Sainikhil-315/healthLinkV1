import { useState, useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';
import socketService from '../services/socketService';

// Background task options
const backgroundOptions = {
  taskName: 'Location Tracking',
  taskTitle: 'HealthLink Tracking',
  taskDesc: 'Location tracking active for emergency response',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#DC2626',
  linkingURI: 'healthlink://',
  parameters: {
    delay: 5000, // Update every 5 seconds
  },
};

// Background task function
const backgroundTask = async (taskData) => {
  await new Promise(async (resolve) => {
    // This loop will run continuously in the background
    for (let i = 0; BackgroundService.isRunning(); i++) {
      try {
        // Get current location
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Send location update via socket
            socketService.updateLocation({
              lat: latitude,
              lng: longitude,
              timestamp: position.timestamp,
            });

            console.log('Background location updated:', { latitude, longitude });
          },
          (error) => {
            console.error('Background location error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 1000,
          }
        );
      } catch (error) {
        console.error('Background task error:', error);
      }

      // Wait for specified delay before next update
      await new Promise((resolve) => 
        setTimeout(resolve, taskData.delay || 5000)
      );
    }
  });
};

export default function useBackgroundLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkBackgroundTracking();
    
    return () => {
      // Cleanup on unmount
      if (BackgroundService.isRunning()) {
        stopBackgroundTracking();
      }
    };
  }, []);

  const checkBackgroundTracking = () => {
    const isRunning = BackgroundService.isRunning();
    setIsTracking(isRunning);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'HealthLink needs access to your location for emergency tracking',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // For Android 10+ (API 29+), also request background location
        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'HealthLink needs background location access to track emergencies',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          return (
            granted === PermissionsAndroid.RESULTS.GRANTED &&
            backgroundGranted === PermissionsAndroid.RESULTS.GRANTED
          );
        }

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    
    // iOS permissions are handled via Info.plist
    return true;
  };

  const startBackgroundTracking = async () => {
    try {
      setError(null);

      // Check if already running
      if (BackgroundService.isRunning()) {
        console.log('Background tracking already running');
        return true;
      }

      // Request location permission
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        setError('Location permission denied');
        return false;
      }

      // Start background service
      await BackgroundService.start(backgroundTask, backgroundOptions);
      
      setIsTracking(true);
      console.log('Background tracking started');
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Start background tracking error:', err);
      return false;
    }
  };

  const stopBackgroundTracking = async () => {
    try {
      if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
        setIsTracking(false);
        console.log('Background tracking stopped');
      }
    } catch (err) {
      console.error('Stop background tracking error:', err);
      setError(err.message);
    }
  };

  return {
    isTracking,
    error,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
}