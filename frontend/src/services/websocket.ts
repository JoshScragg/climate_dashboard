// frontend/src/services/websocket.ts
import { io, Socket } from 'socket.io-client';

type ClimateDataEvents = {
  'temperature-update': (data: any) => void;
  'co2-update': (data: any) => void;
  'precipitation-update': (data: any) => void;
  'sea-level-update': (data: any) => void;
  'ice-extent-update': (data: any) => void;
  'alert': (message: string) => void;
  'threshold-alert': (data: { type: string; value: number; threshold: number; message: string }) => void;
  'connection-status': (status: { connected: boolean; timestamp: number }) => void;
  'data-source-update': (source: { id: string; name: string; status: string; lastUpdate: number }) => void;
  'data-request': (request: { type: string; params?: Record<string, any>; timestamp?: number }) => void;
  'subscribe': (channel: string) => void;
  'unsubscribe': (channel: string) => void;
};

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private dataSources: Record<string, { name: string; status: string; lastUpdate: number }> = {};
  private statusListeners: ((status: boolean) => void)[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  connect(url: string = process.env.REACT_APP_WS_URL || 'http://localhost:5000'): Promise<void> {
    if (this.isConnected && this.socket) {
      return Promise.resolve();
    }
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`Attempting to connect to WebSocket server at: ${url}`);
        
        if (this.socket) {
          this.socket.disconnect();
        }
        
        this.socket = io(url, {
          reconnectionAttempts: this.maxReconnectAttempts,
          timeout: 10000,
          transports: ['websocket', 'polling'],
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          forceNew: false,
          autoConnect: true 
        });
        
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected successfully');
          
          
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          
          
          this.notifyStatusListeners(true);
          
          
          if (this.socket) {
            this.socket.emit('connection-status', {
              connected: true,
              timestamp: Date.now(),
              client: 'climate-dashboard-frontend'
            });
          }
          
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.notifyStatusListeners(false);
            this.connectionPromise = null;
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts: ${error.message}`));
          }
        });
        
        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.log('WebSocket disconnected:', reason);
          this.notifyStatusListeners(false);
          
          
          if (reason === 'io server disconnect') {
            
            this.reconnectSocket();
          }
        });
        
        
        this.socket.on('data-source-update', (source) => {
          this.dataSources[source.id] = {
            name: source.name,
            status: source.status,
            lastUpdate: source.lastUpdate
          };
        });
        
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.notifyStatusListeners(false);
        this.connectionPromise = null;
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }
  
  
  private reconnectSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect to WebSocket server...');
      if (this.socket) {
        this.socket.connect();
      } else {
        
        this.connectionPromise = null;
        this.connect();
      }
    }, 2000);
  }
  
  
  private notifyStatusListeners(status: boolean): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in WebSocket status listener:', error);
      }
    });
  }
  
  
  addStatusListener(listener: (status: boolean) => void): void {
    this.statusListeners.push(listener);
    
    listener(this.isConnected);
  }
  
  
  removeStatusListener(listener: (status: boolean) => void): void {
    const index = this.statusListeners.indexOf(listener);
    if (index !== -1) {
      this.statusListeners.splice(index, 1);
    }
  }
  
  
  getDataSources(): Record<string, { name: string; status: string; lastUpdate: number }> {
    return { ...this.dataSources };
  }
  
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyStatusListeners(false);
      this.connectionPromise = null;
    }
  }
  
  
  on<T extends keyof ClimateDataEvents>(
    event: T,
    callback: ClimateDataEvents[T]
  ): void {
    if (!this.socket) {
      console.error('Cannot subscribe to event: WebSocket not connected');
      return;
    }
    
    this.socket.on(event as string, callback as (...args: any[]) => void);
  }
  
  
  off<T extends keyof ClimateDataEvents>(event: T): void {
    if (!this.socket) {
      return;
    }
    
    this.socket.off(event as string);
  }
  
  
  isSocketConnected(): boolean {
    return this.isConnected;
  }
  
  
  requestData(dataType: string, params: Record<string, any> = {}): void {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot request data: WebSocket not connected');
      return;
    }
    
    this.socket.emit('data-request', {
      type: dataType,
      params,
      timestamp: Date.now()
    });
  }
  
  
  sendMessage(channel: string, message: any): void {
    if (!this.socket || !this.isConnected) {
      
      console.warn(`Cannot send message to ${channel}: WebSocket not connected`);
      return;
    }
    
    try {
      this.socket.emit(channel, message);
    } catch (error) {
      console.error(`Error sending message to ${channel}:`, error);
    }
  }
}


const websocketService = WebSocketService.getInstance();
export default websocketService;