import React, { useState, useEffect } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  autoDismiss?: boolean;
}

interface ThresholdAlert {
  type: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'temperature':
      return (
        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'co2':
      return (
        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      );
    case 'seaLevel':
      return (
        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const ClimateNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribeAlert = subscribe('threshold-alert', (alert: ThresholdAlert) => {
      const alertType = alert.type as string;
      const isHighAlert = alert.value > alert.threshold * 1.1; 
      
      let alertTypeText = 'Temperature';
      if (alertType === 'co2') alertTypeText = 'CO₂ Concentration';
      if (alertType === 'seaLevel') alertTypeText = 'Sea Level';
      
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: isHighAlert ? 'error' : 'warning',
        title: `${alertTypeText} Threshold Exceeded`,
        message: alert.message,
        timestamp: Date.now(),
        read: false,
        autoDismiss: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('Cannot play notification sound', err));
      } catch (err) {
        console.log('Audio not supported');
      }
    });
    
    const unsubscribeInfo = subscribe('alert', (message: string) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'info',
        title: 'System Notification',
        message,
        timestamp: Date.now(),
        read: false,
        autoDismiss: true,
      };
      
      setNotifications(prev => [notification, ...prev]);
    });
    
    const unsubscribeConnection = subscribe('connection-status', (status: { connected: boolean }) => {
      if (status.connected) {
        const notification: Notification = {
          id: `connection-${Date.now()}`,
          type: 'success',
          title: 'Connection Established',
          message: 'Connected to real-time climate data feed',
          timestamp: Date.now(),
          read: false,
          autoDismiss: true,
        };
        
        setNotifications(prev => [notification, ...prev]);
      } else {
        const notification: Notification = {
          id: `connection-${Date.now()}`,
          type: 'error',
          title: 'Connection Lost',
          message: 'Disconnected from real-time climate data feed. Trying to reconnect...',
          timestamp: Date.now(),
          read: false,
          autoDismiss: false,
        };
        
        setNotifications(prev => [notification, ...prev]);
      }
    });
    
    return () => {
      unsubscribeAlert();
      unsubscribeInfo();
      unsubscribeConnection();
    };
  }, [subscribe]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    if (unread > 0) {
      document.title = `(${unread}) Climate Dashboard`;
    } else {
      document.title = 'Climate Dashboard';
    }
    
    const autoDismissIds = notifications
      .filter(n => n.autoDismiss && !n.read)
      .map(n => n.id);
    
    if (autoDismissIds.length > 0) {
      const timeout = setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => 
            autoDismissIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <span className="sr-only">View notifications</span>
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-30">
          <div className="px-4 py-3 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Mark all as read
              </button>
              <button 
                onClick={clearAll}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 flex ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {notification.type === 'warning' || notification.type === 'error' ? (
                        <NotificationIcon type={notification.title.toLowerCase().includes('co₂') ? 'co2' : 
                                               notification.title.toLowerCase().includes('sea') ? 'seaLevel' : 
                                               'temperature'} />
                      ) : notification.type === 'success' ? (
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Delete</span>
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="rounded-full p-1 text-blue-400 hover:text-blue-500"
                        >
                          <span className="sr-only">Mark as read</span>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClimateNotifications;