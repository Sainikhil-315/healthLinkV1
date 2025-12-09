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
            resolve(this.currentLocation);
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
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
        return;
      }

      const { granted } = await this.requestPermissions();
      
      if (!granted) {
        throw new Error('Location permission not granted');
      }

      this.watchId = Geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          this.currentLocation = location;
          socketService.updateLocation(location);

          if (callback) {
            callback(location);
          }
        },
        (error) => console.error('Location tracking error:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 3000
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
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
      console.log('Location tracking stopped');
    }
  }

  async getAddressFromCoords(lat, lng) {
    try {
      // Use a geocoding API (Google, Mapbox, etc.)
      // For now, return null - implement based on your preference
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
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