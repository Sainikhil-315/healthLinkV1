import { useEffect } from 'react';
import socketService from '../services/socketService';
import useAuthStore from '../store/authStore';

export default function useSocket() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    }

    return () => {
      if (isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated]);

  const on = (event, callback) => {
    return socketService.on(event, callback);
  };

  const off = (event, callback) => {
    socketService.off(event, callback);
  };

  const joinIncidentRoom = (incidentId) => {
    socketService.joinIncidentRoom(incidentId);
  };

  const leaveIncidentRoom = (incidentId) => {
    socketService.leaveIncidentRoom(incidentId);
  };

  return {
    on,
    off,
    joinIncidentRoom,
    leaveIncidentRoom,
    isConnected: socketService.isConnected()
  };
}