import { useState, useEffect } from 'react';
import permissionManager from '../utils/permissions';

export default function usePermissions() {
  const [permissions, setPermissions] = useState({
    location: false,
    notification: false,
    camera: false,
    mediaLibrary: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      
      const perms = await permissionManager.checkAllCriticalPermissions();
      
      setPermissions(prev => ({
        ...prev,
        ...perms
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Check permissions error:', error);
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    const granted = await permissionManager.requestLocationPermission();
    setPermissions(prev => ({ ...prev, location: granted }));
    return granted;
  };

  const requestNotification = async () => {
    const granted = await permissionManager.requestNotificationPermission();
    setPermissions(prev => ({ ...prev, notification: granted }));
    return granted;
  };

  const requestCamera = async () => {
    const granted = await permissionManager.requestCameraPermission();
    setPermissions(prev => ({ ...prev, camera: granted }));
    return granted;
  };

  const requestMediaLibrary = async () => {
    const granted = await permissionManager.requestMediaLibraryPermission();
    setPermissions(prev => ({ ...prev, mediaLibrary: granted }));
    return granted;
  };

  const requestAll = async () => {
    const perms = await permissionManager.requestAllCriticalPermissions();
    setPermissions(prev => ({ ...prev, ...perms }));
    return perms;
  };

  const openSettings = () => {
    permissionManager.openSettings();
  };

  return {
    permissions,
    loading,
    requestLocation,
    requestNotification,
    requestCamera,
    requestMediaLibrary,
    requestAll,
    openSettings,
    checkPermissions
  };
}