import Geolocation from '@react-native-community/geolocation';
import PushNotification from 'react-native-push-notification';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

class PermissionManager {
  // Request location permissions
  async requestLocationPermission() {
    try {
      const status = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );

      if (status !== RESULTS.GRANTED) {
        this.showPermissionDeniedAlert('Location', 'location services');
        return false;
      }

      // For ambulance/volunteer roles, also request background location
      if (Platform.OS === 'android') {
        await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
      }

      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  // Request notification permissions
  async requestNotificationPermission() {
    try {
      const status = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.NOTIFICATIONS
          : PERMISSIONS.ANDROID.POST_NOTIFICATIONS
      );

      if (status !== RESULTS.GRANTED) {
        this.showPermissionDeniedAlert('Notification', 'emergency alerts');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  // Request camera permissions
  async requestCameraPermission() {
    try {
      const status = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA
      );

      if (status !== RESULTS.GRANTED) {
        this.showPermissionDeniedAlert('Camera', 'take photos');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermission() {
    try {
      const status = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      );

      if (status !== RESULTS.GRANTED) {
        this.showPermissionDeniedAlert('Media Library', 'access photos');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Media library permission error:', error);
      return false;
    }
  }

  // Check if location permission is granted
  async hasLocationPermission() {
    const status = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    );
    return status === RESULTS.GRANTED;
  }

  // Check if notification permission is granted
  async hasNotificationPermission() {
    const status = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.NOTIFICATIONS
        : PERMISSIONS.ANDROID.POST_NOTIFICATIONS
    );
    return status === RESULTS.GRANTED;
  }

  // Show permission denied alert
  showPermissionDeniedAlert(permissionName, purpose) {
    Alert.alert(
      `${permissionName} Permission Required`,
      `HealthLink needs ${permissionName.toLowerCase()} access to ${purpose}. Please enable it in Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => this.openSettings() }
      ]
    );
  }

  // Open app settings
  openSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  // Request all critical permissions
  async requestAllCriticalPermissions() {
    const permissions = {
      location: await this.requestLocationPermission(),
      notification: await this.requestNotificationPermission()
    };

    return permissions;
  }

  // Check all critical permissions
  async checkAllCriticalPermissions() {
    const permissions = {
      location: await this.hasLocationPermission(),
      notification: await this.hasNotificationPermission()
    };

    return permissions;
  }
}

const permissionManager = new PermissionManager();
export default permissionManager;