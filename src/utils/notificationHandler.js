import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX
  })
});

// Initialize notification channels (Android)
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    // Emergency channel
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#DC2626',
      enableVibrate: true,
      enableLights: true,
      showBadge: true
    });

    // Updates channel
    await Notifications.setNotificationChannelAsync('updates', {
      name: 'Status Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#3B82F6'
    });

    // Requests channel
    await Notifications.setNotificationChannelAsync('requests', {
      name: 'Service Requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#F59E0B'
    });
  }
};

// Get Expo push token
export const getExpoPushToken = async () => {
  try {
    const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
    
    if (storedToken) {
      return storedToken;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
    
    return token;
  } catch (error) {
    console.error('Get push token error:', error);
    return null;
  }
};

// Handle notification received while app is foregrounded
export const handleNotificationReceived = (notification) => {
  console.log('Notification received:', notification);
  
  const { data } = notification.request.content;
  
  // Handle different notification types
  switch (data.type) {
    case 'emergency_alert':
      // Handle emergency alert
      break;
    case 'ambulance_request':
      // Handle ambulance request
      break;
    case 'status_update':
      // Handle status update
      break;
    default:
      break;
  }
};

// Handle notification tap
export const handleNotificationTap = (response, navigation) => {
  console.log('Notification tapped:', response);
  
  const { data } = response.notification.request.content;
  
  // Navigate based on notification type
  if (data.type === 'emergency') {
    navigation.navigate('TrackAmbulance', { incidentId: data.incidentId });
  } else if (data.type === 'ambulance_request') {
    navigation.navigate('ActiveEmergency', { incidentId: data.incidentId });
  } else if (data.type === 'volunteer_request') {
    navigation.navigate('NearbyEmergencies');
  } else if (data.type === 'blood_request') {
    navigation.navigate('RequestsList');
  }
};

// Show local notification
export const showLocalNotification = async (title, body, data = {}, channelId = 'updates') => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: channelId === 'emergency' ? 'default' : 'default',
        priority: channelId === 'emergency' 
          ? Notifications.AndroidNotificationPriority.MAX 
          : Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        badge: 1
      },
      trigger: null,
      ...(Platform.OS === 'android' && { channelId })
    });
  } catch (error) {
    console.error('Show notification error:', error);
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Clear notifications error:', error);
  }
};

// Set badge count
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Set badge count error:', error);
  }
};

// Get badge count
export const getBadgeCount = async () => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Get badge count error:', error);
    return 0;
  }
};

export default {
  setupNotificationChannels,
  getExpoPushToken,
  handleNotificationReceived,
  handleNotificationTap,
  showLocalNotification,
  clearAllNotifications,
  setBadgeCount,
  getBadgeCount
};