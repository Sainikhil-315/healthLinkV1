import { create } from 'zustand';

const useSocketStore = create((set, get) => ({
  // State
  isConnected: false,
  connectionError: null,
  listeners: new Map(),

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),

  setConnectionError: (error) => set({ connectionError: error }),

  addListener: (event, callback) => {
    const listeners = get().listeners;
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push(callback);
    set({ listeners: new Map(listeners) });
  },

  removeListener: (event, callback) => {
    const listeners = get().listeners;
    if (listeners.has(event)) {
      const callbacks = listeners.get(event).filter(cb => cb !== callback);
      if (callbacks.length === 0) {
        listeners.delete(event);
      } else {
        listeners.set(event, callbacks);
      }
      set({ listeners: new Map(listeners) });
    }
  },

  clearListeners: () => set({ listeners: new Map() }),

  reset: () => set({
    isConnected: false,
    connectionError: null,
    listeners: new Map()
  })
}));

export default useSocketStore;