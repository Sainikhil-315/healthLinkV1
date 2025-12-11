import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import socketService from './socketService';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchSubscription = null;
    this.isTracking = false;
  }

  // Request location permissions
  async requestPermissions() {
    try {
      // Check if permission already granted
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION);
      if (stored === 'granted') {
        return { granted: true };
      }

      // Android permission request
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
      // iOS permissions handled in Info.plist
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION, 'granted');
      return { granted: true };
    } catch (error) {
      console.error('Permission request error:', error);
      return { granted: false, error: error.message };
    }
  }

  // Get current location once
  async getCurrentLocation() {
    try {
      const { granted } = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission not granted');
      }
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            this.currentLocation = loc;
            resolve(loc);
          },
          (error) => {
            console.error('Get current location error:', error);
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      console.error('Get current location error:', error);
      throw error;
    }
  }

  // Start watching location (for ambulance/volunteer)
  async startTracking(callback) {
    try {
      if (this.isTracking) {
        console.log('Already tracking location');
        return;
      }
      const { granted } = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission not granted');
      }
      this.watchId = Geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.currentLocation = pos;
          socketService.updateLocation(pos);
          if (callback) {
            callback(pos);
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
      );
      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Start tracking error:', error);
      throw error;
    }
  }

  // Stop watching location
  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoords(lat, lng) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });

      if (result && result.length > 0) {
        const address = result[0];
        return {
          street: address.street || '',
          city: address.city || '',
          region: address.region || '',
          country: address.country || '',
          postalCode: address.postalCode || '',
          formattedAddress: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimals
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Format distance for display
  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  // Calculate ETA based on distance
  calculateETA(distanceKm, speedKmh = 40) {
    const hours = distanceKm / speedKmh;
    const minutes = Math.ceil(hours * 60);
    return minutes;
  }

  // Format ETA for display
  formatETA(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  // Get current location data
  getCurrentLocationData() {
    return this.currentLocation;
  }

  // Check if tracking
  isCurrentlyTracking() {
    return this.isTracking;
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;