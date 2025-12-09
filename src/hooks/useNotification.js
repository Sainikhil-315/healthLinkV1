import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';

export default function useNotification() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Setup listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationTapped
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      await notificationService.setupNotificationChannels();
      const result = await notificationService.requestPermissions();
      
      if (result.granted) {
        console.log('Notifications enabled:', result.token);
      }
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  };

  const handleNotificationReceived = (notification) => {
    console.log('Notification received:', notification);
  };

  const handleNotificationTapped = (response) => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    // Handle navigation based on notification type
    if (data.type === 'emergency') {
      // Navigate to track ambulance screen
    } else if (data.type === 'ambulance_request') {
      // Navigate to ambulance request screen
    }
  };

  return {
    showNotification: notificationService.showNotification.bind(notificationService),
    clearAll: notificationService.clearAllNotifications.bind(notificationService)
  };
}