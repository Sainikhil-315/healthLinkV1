import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL, SOCKET_EVENTS, STORAGE_KEYS } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        console.log('No auth token, skipping socket connection');
        return;
      }

      if (this.socket?.connected) {
        console.log('Socket already connected');
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000
      });

      this.setupEventListeners();
      
      console.log('Socket connection initiated');
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  setupEventListeners() {
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connected', { connected: true });
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.notifyListeners('disconnected', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket.disconnect();
      }
    });

    // Emergency events
    this.socket.on(SOCKET_EVENTS.EMERGENCY_CREATED, (data) => {
      console.log('Emergency created:', data.incidentId);
      this.notifyListeners('emergencyCreated', data);
    });

    this.socket.on(SOCKET_EVENTS.EMERGENCY_UPDATED, (data) => {
      console.log('Emergency updated:', data.incidentId);
      this.notifyListeners('emergencyUpdated', data);
    });

    // Location events
    this.socket.on(SOCKET_EVENTS.AMBULANCE_LOCATION, (data) => {
      this.notifyListeners('ambulanceLocation', data);
    });

    this.socket.on('volunteer:location', (data) => {
      this.notifyListeners('volunteerLocation', data);
    });

    // Notification events
    this.socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, (data) => {
      console.log('New notification:', data.type);
      this.notifyListeners('notification', data);
    });

    // Status events
    this.socket.on(SOCKET_EVENTS.STATUS_CHANGE, (data) => {
      this.notifyListeners('statusChange', data);
    });

    // Request events
    this.socket.on('ambulance:request', (data) => {
      this.notifyListeners('ambulanceRequest', data);
    });

    this.socket.on('volunteer:request', (data) => {
      this.notifyListeners('volunteerRequest', data);
    });

    this.socket.on('donor:request', (data) => {
      this.notifyListeners('donorRequest', data);
    });

    // Tracking events
    this.socket.on('incident:tracking', (data) => {
      this.notifyListeners('incidentTracking', data);
    });

    this.socket.on('route:updated', (data) => {
      this.notifyListeners('routeUpdated', data);
    });

    this.socket.on('eta:updated', (data) => {
      this.notifyListeners('etaUpdated', data);
    });

    // Arrival events
    this.socket.on('responder:arrived', (data) => {
      this.notifyListeners('responderArrived', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Join rooms
  joinIncidentRoom(incidentId) {
    if (this.socket?.connected) {
      this.socket.emit('join:incident', incidentId);
      console.log('Joined incident room:', incidentId);
    }
  }

  leaveIncidentRoom(incidentId) {
    if (this.socket?.connected) {
      this.socket.emit('leave:incident', incidentId);
      console.log('Left incident room:', incidentId);
    }
  }

  trackAmbulance(ambulanceId) {
    if (this.socket?.connected) {
      this.socket.emit('track:ambulance', ambulanceId);
      console.log('Tracking ambulance:', ambulanceId);
    }
  }

  // Send location updates
  updateLocation(location) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.LOCATION_UPDATE, location);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;