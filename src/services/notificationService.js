import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

class NotificationService {
  constructor() {
    this.configure();
  }

  configure() {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Notification token:', token);
        AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.createChannels();
  }

  createChannels() {
    PushNotification.createChannel(
      {
        channelId: 'emergency',
        channelName: 'Emergency Alerts',
        channelDescription: 'Critical emergency notifications',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      () => {}
    );

    PushNotification.createChannel(
      {
        channelId: 'updates',
        channelName: 'Status Updates',
        channelDescription: 'Emergency status updates',
        importance: 3,
      },
      () => {}
    );
  }

  async requestPermissions() {
    return new Promise((resolve) => {
      PushNotification.checkPermissions((permissions) => {
        if (permissions.alert) {
          resolve({ granted: true });
        } else {
          PushNotification.requestPermissions().then((perms) => {
            resolve({ granted: perms.alert });
          });
        }
      });
    });
  }

  showNotification(title, message, data = {}, channelId = 'updates') {
    PushNotification.localNotification({
      channelId,
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      priority: channelId === 'emergency' ? 'high' : 'default',
    });
  }

  showEmergencyAlert(incident) {
    this.showNotification(
      '🚨 Emergency Alert',
      `Emergency ${incident.severity} at ${incident.location.address}`,
      { type: 'emergency', incidentId: incident.id },
      'emergency'
    );
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  setBadgeCount(count) {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
}

const notificationService = new NotificationService();
export default notificationService;