import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import socketService from './socketService';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = null;
    this.lastUpdateTime = 0;
    this.minUpdateInterval = 5000; // Minimum 5 seconds between updates
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'HealthLink needs access to your location for emergency services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // Request background location for Android 10+
        if (Platform.Version >= 29 && granted === PermissionsAndroid.RESULTS.GRANTED) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'HealthLink needs background location for continuous tracking.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
        }

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION, 'granted');
          return { granted: true };
        } else {
          return { granted: false, error: 'Location permission denied' };
        }
      }
      
      // iOS permissions are handled in Info.plist
      return { granted: true };
    } catch (error) {
      console.error('Permission request error:', error);
      return { granted: false, error: error.message };
    }
  }

  async getCurrentLocation() {
    try {
      const { granted } = await this.requestPermissions();
      
      if (!granted) {
        throw new Error('Location permission not granted');
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            this.currentLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            console.log('📍 Current location obtained:', this.currentLocation);
            resolve(this.currentLocation);
          },
          (error) => {
            // Only log error if both attempts fail
            if (error.code === 3) { // TIMEOUT
              Geolocation.getCurrentPosition(
                (position) => {
                  this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                  };
                  console.log('📍 Current location obtained (low accuracy):', this.currentLocation);
                  resolve(this.currentLocation);
                },
                (err) => {
                  console.error('Geolocation error (both attempts failed):', err);
                  reject(err);
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
              );
            } else {
              console.error('Geolocation error:', error);
              reject(error);
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      });
    } catch (error) {
      console.error('Get current location error:', error);
      throw error;
    }
  }

  async startTracking(callback) {
    try {
      if (this.isTracking) {
        console.log('⚠️ Already tracking location');
        return;
      }

      const { granted } = await this.requestPermissions();
      
      if (!granted) {
        throw new Error('Location permission not granted');
      }

      console.log('🎯 Starting location tracking...');

      this.watchId = Geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          
          // Throttle updates to avoid too frequent calls
          if (now - this.lastUpdateTime < this.minUpdateInterval) {
            return;
          }

          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          // Check if location has actually changed significantly (>10 meters)
          if (this.currentLocation) {
            const distance = this.calculateDistance(
              this.currentLocation.lat,
              this.currentLocation.lng,
              location.lat,
              location.lng
            );

            // Only update if moved more than 10 meters
            if (distance < 0.01) {
              return;
            }
          }

          this.currentLocation = location;
          this.lastUpdateTime = now;

          console.log('📍 Location updated:', location);

          // Send to socket for real-time updates
          socketService.updateLocation(location);

          // Call the callback
          if (callback) {
            callback(location);
          }
        },
        (error) => console.error('❌ Location tracking error:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: 5000, // Check every 5 seconds
          fastestInterval: 3000 // Fastest update rate
        }
      );

      this.isTracking = true;
      console.log('✅ Location tracking started');
    } catch (error) {
      console.error('Start tracking error:', error);
      throw error;
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('🛑 Location tracking stopped');
    }
  }

  async getAddressFromCoords(lat, lng) {
    try {
      // Implement reverse geocoding using Google Maps or other service
      // For now, return null
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  calculateETA(distanceKm, speedKmh = 40) {
    return Math.ceil((distanceKm / speedKmh) * 60);
  }

  formatETA(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  getCurrentLocationData() {
    return this.currentLocation;
  }

  isCurrentlyTracking() {
    return this.isTracking;
  }
}

const locationService = new LocationService();
export default locationService;