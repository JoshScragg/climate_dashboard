// frontend/src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocket';

type EventCallback = (...args: any[]) => void;

const activeSubscriptions = new Map<string, Set<EventCallback>>();

export const useWebSocket = (url?: string) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const componentSubscriptionsRef = useRef<Map<string, EventCallback>>(new Map());

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        console.log('Initializing WebSocket connection...');
        await websocketService.connect(url);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        setIsConnected(false);
        setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket server'));
      }
    };

    const statusListener = (status: boolean) => {
      console.log(`WebSocket connection status changed to: ${status ? 'connected' : 'disconnected'}`);
      setIsConnected(status);
    };

    websocketService.addStatusListener(statusListener);
    
    connectWebSocket();

    return () => {
      websocketService.removeStatusListener(statusListener);
    };
  }, [url]);

  const subscribe = useCallback((event: string, callback: EventCallback) => {
    componentSubscriptionsRef.current.set(event, callback);
    
    if (!activeSubscriptions.has(event)) {
      activeSubscriptions.set(event, new Set());
    }
    
    const callbacks = activeSubscriptions.get(event)!;
    
    if (!callbacks.has(callback)) {
      console.log(`Subscribing to event: ${event}`);
      callbacks.add(callback);
      
      websocketService.on(event as any, callback);
      
      if (isConnected && callbacks.size === 1) {
        try {
          websocketService.sendMessage('subscribe', event);
        } catch (error) {
          console.warn(`Error subscribing to ${event}:`, error);
        }
      }
    }
    
    return () => {
      console.log(`Unsubscribing from event: ${event}`);
      
      componentSubscriptionsRef.current.delete(event);
      
      const callbacks = activeSubscriptions.get(event);
      if (!callbacks) return;
      
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        activeSubscriptions.delete(event);
        websocketService.off(event as any);
        
        if (isConnected) {
          try {
            websocketService.sendMessage('unsubscribe', event);
          } catch (error) {
            console.warn(`Error unsubscribing from ${event}:`, error);
          }
        }
      }
    };
  }, [isConnected]);

  useEffect(() => {
    return () => {
      componentSubscriptionsRef.current.forEach((callback, event) => {
        const callbacks = activeSubscriptions.get(event);
        if (!callbacks) return;
        
        callbacks.delete(callback);
        
        if (callbacks.size === 0) {
          activeSubscriptions.delete(event);
          websocketService.off(event as any);
          
          if (isConnected) {
            try {
              websocketService.sendMessage('unsubscribe', event);
            } catch (error) {
            }
          }
        }
      });
      
      componentSubscriptionsRef.current.clear();
    };
  }, [isConnected]);

  const requestData = useCallback((dataType: string, params: Record<string, any> = {}) => {
    if (!isConnected) {
      console.warn(`Cannot request data (${dataType}): Not connected to WebSocket server`);
      return;
    }
    
    console.log(`Requesting data of type: ${dataType}`);
    websocketService.requestData(dataType, params);
  }, [isConnected]);

  return {
    isConnected,
    error,
    subscribe,
    requestData,
  };
};

export default useWebSocket;