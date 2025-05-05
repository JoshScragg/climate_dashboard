// frontend/src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

type EventCallback = (...args: any[]) => void;

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (event: string, callback: EventCallback) => () => void;
  unsubscribe: (event: string, callback: EventCallback) => void;
  requestData: (dataType: string, params?: Record<string, any>) => void;
  sendMessage: (channel: string, message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

let socket: Socket | null = null;
let isInitialized = false;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url = process.env.REACT_APP_WS_URL || 'http://localhost:5000'
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    console.log("🌐 Initializing WebSocket connection (outside React lifecycle)");
    
    socket = io(url, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: false,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log("🌐 WebSocket connected");
      setIsConnected(true);

      socket?.emit('connection-status', {
        connected: true,
        timestamp: Date.now(),
        client: 'climate-dashboard-frontend'
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🌐 WebSocket disconnected: ${reason}`);
      setIsConnected(false);
    });

    isInitialized = true;

    return () => {
    };
  }, [url]);

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    if (!socket) {
      console.warn(`Cannot subscribe to ${event}: Socket not initialized`);
      return () => {};
    }

    console.log(`Subscribing to WebSocket event: ${event}`);
    
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
      
      if (isConnected) {
        socket.emit('subscribe', event);
      }
    }
    
    const listeners = eventListeners.get(event)!;
    
    if (!listeners.has(callback)) {
      listeners.add(callback);
      socket.on(event, callback);
    }

    return () => {
      unsubscribe(event, callback);
    };
  }, [isConnected]);

  const unsubscribe = useCallback((event: string, callback: EventCallback) => {
    if (!socket) return;

    console.log(`Unsubscribing from WebSocket event: ${event}`);
    
    const listeners = eventListeners.get(event);
    if (!listeners) return;

    listeners.delete(callback);
    
    if (listeners.size === 0) {
      eventListeners.delete(event);
      socket.off(event);
      
      if (isConnected) {
        socket.emit('unsubscribe', event);
      }
    }
  }, [isConnected]);

  const requestData = useCallback((dataType: string, params: Record<string, any> = {}) => {
    if (!socket || !isConnected) {
      console.warn(`Cannot request data (${dataType}): Socket not connected`);
      return;
    }

    console.log(`Requesting data: ${dataType}`);
    socket.emit('data-request', {
      type: dataType,
      params,
      timestamp: Date.now()
    });
  }, [isConnected]);

  const sendMessage = useCallback((channel: string, message: any) => {
    if (!socket || !isConnected) {
      console.warn(`Cannot send message to ${channel}: Socket not connected`);
      return;
    }

    socket.emit(channel, message);
  }, [isConnected]);

  const value = {
    isConnected,
    subscribe,
    unsubscribe,
    requestData,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;