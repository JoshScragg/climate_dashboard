// frontend/src/components/Dashboard/RealtimeUpdates.tsx
import React, { useState, useEffect } from 'react';
import { TemperatureData, CO2Data, SeaLevelData } from '../../types/climate';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Card from '../UI/Card';
import realtimeDataService from '../../services/realtimeDataService';

interface ThresholdAlert {
  type: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

interface DataSource {
  id: string;
  name: string;
  status: string;
  lastUpdate: number;
}

const RealtimeUpdates: React.FC = () => {
  const [latestTemperature, setLatestTemperature] = useState<TemperatureData | null>(null);
  const [latestCO2, setLatestCO2] = useState<CO2Data | null>(null);
  const [latestSeaLevel, setLatestSeaLevel] = useState<SeaLevelData | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [thresholdAlerts, setThresholdAlerts] = useState<ThresholdAlert[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showThresholdAlerts, setShowThresholdAlerts] = useState(false);
  const { isConnected, subscribe, requestData } = useWebSocket();

  useEffect(() => {
    const initService = async () => {
      try {
        await realtimeDataService.initialize();
        console.log('Real-time data service initialized');
      } catch (error) {
        console.error('Failed to initialize real-time data service:', error);
      }
    };

    initService();

    return () => {
      realtimeDataService.cleanup();
    };
  }, []);

  useEffect(() => {
    const unsubscribeTemp = subscribe('temperature-update', (data: TemperatureData) => {
      console.log('Received temperature update:', data);
      setLatestTemperature(data);
      setAlerts(prev => [
        `New temperature reading: ${data.anomaly.toFixed(2)}°C anomaly at ${new Date(data.date).toLocaleString()}`,
        ...prev.slice(0, 4) 
      ]);
    });

    const unsubscribeCO2 = subscribe('co2-update', (data: CO2Data) => {
      console.log('Received CO2 update:', data);
      setLatestCO2(data);
      setAlerts(prev => [
        `New CO₂ reading: ${data.ppm.toFixed(2)} ppm at ${new Date(data.date).toLocaleString()}`,
        ...prev.slice(0, 4) 
      ]);
    });

    const unsubscribeSeaLevel = subscribe('sea-level-update', (data: SeaLevelData) => {
      console.log('Received sea level update:', data);
      setLatestSeaLevel(data);
      setAlerts(prev => [
        `New sea level reading: ${data.level.toFixed(1)} mm at ${new Date(data.date).toLocaleString()}`,
        ...prev.slice(0, 4) 
      ]);
    });

    const unsubscribeThreshold = subscribe('threshold-alert', (data: ThresholdAlert) => {
      console.log('Received threshold alert:', data);
      setThresholdAlerts(prev => [data, ...prev.slice(0, 4)]);
      
      setAlerts(prev => [
        `ALERT: ${data.message} (${data.value.toFixed(2)} > ${data.threshold.toFixed(2)})`,
        ...prev.slice(0, 4)
      ]);
    });

    const unsubscribeDataSource = subscribe('data-source-update', (source: DataSource) => {
      console.log('Received data source update:', source);
      setDataSources(prev => {
        const exists = prev.some(s => s.id === source.id);
        if (exists) {
          return prev.map(s => s.id === source.id ? source : s);
        } else {
          return [...prev, source];
        }
      });
    });

    const unsubscribeAlert = subscribe('alert', (message: string) => {
      console.log('Received alert:', message);
      setAlerts(prev => [message, ...prev.slice(0, 4)]);
    });

    if (isConnected) {
      setTimeout(() => {
        console.log('Requesting initial data...');
        requestData('temperature');
        requestData('co2');
        requestData('sea-level');
      }, 1000);
    }

    return () => {
      console.log('Cleaning up RealtimeUpdates subscriptions');
      unsubscribeTemp();
      unsubscribeCO2();
      unsubscribeSeaLevel();
      unsubscribeThreshold();
      unsubscribeDataSource();
      unsubscribeAlert();
    };
  }, [subscribe, isConnected, requestData]);

  const formatThresholdAlert = (alert: ThresholdAlert) => {
    const date = new Date(alert.timestamp).toLocaleString();
    let typeIcon = '🌡️';
    let typeText = 'Temperature';
    
    if (alert.type === 'co2') {
      typeIcon = '🏭';
      typeText = 'CO₂ Concentration';
    } else if (alert.type === 'seaLevel') {
      typeIcon = '🌊';
      typeText = 'Sea Level';
    }
    
    return (
      <div className="p-2 border-l-4 border-red-500 bg-red-50 rounded mb-2">
        <div className="flex items-start">
          <div className="mr-2">{typeIcon}</div>
          <div>
            <div className="font-medium text-red-700">{typeText} Threshold Exceeded</div>
            <div className="text-xs text-gray-600">{date}</div>
            <div className="text-sm mt-1">{alert.message}</div>
            <div className="text-xs mt-1 text-gray-700">
              Current: {alert.value.toFixed(2)}, Threshold: {alert.threshold.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card title="Real-time Updates" className="col-span-1">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected to real-time data feed' : 'Disconnected from data feed'}
            </span>
          </div>
          
          <button 
            onClick={() => setShowThresholdAlerts(!showThresholdAlerts)}
            className={`text-xs px-2 py-1 rounded ${thresholdAlerts.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}
          >
            {thresholdAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 inline-flex items-center justify-center mr-1">
                {thresholdAlerts.length}
              </span>
            )}
            {showThresholdAlerts ? 'Hide Alerts' : 'Show Alerts'}
          </button>
        </div>
        
        {showThresholdAlerts && thresholdAlerts.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium mb-2 text-red-700 flex items-center">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Climate Threshold Alerts
            </h4>
            <div className="bg-red-50 rounded-md p-2 max-h-40 overflow-y-auto">
              {thresholdAlerts.map((alert, index) => (
                <div key={index}>
                  {formatThresholdAlert(alert)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium mb-2">Latest Readings</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-xs text-blue-500 font-medium">Temperature</div>
              {latestTemperature ? (
                <div className="text-lg font-semibold">
                  {latestTemperature.anomaly > 0 ? '+' : ''}{latestTemperature.anomaly.toFixed(2)}°C
                </div>
              ) : (
                <div className="text-sm text-gray-500">Waiting for data...</div>
              )}
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md">
              <div className="text-xs text-yellow-600 font-medium">CO₂ Level</div>
              {latestCO2 ? (
                <div className="text-lg font-semibold">
                  {latestCO2.ppm.toFixed(1)} ppm
                </div>
              ) : (
                <div className="text-sm text-gray-500">Waiting for data...</div>
              )}
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-xs text-green-600 font-medium">Sea Level</div>
              {latestSeaLevel ? (
                <div className="text-lg font-semibold">
                  +{latestSeaLevel.level.toFixed(1)} mm
                </div>
              ) : (
                <div className="text-sm text-gray-500">Waiting for data...</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
          <div className="bg-gray-50 rounded-md p-2 max-h-40 overflow-y-auto">
            {alerts.length > 0 ? (
              <ul className="space-y-2">
                {alerts.map((alert, index) => (
                  <li key={index} className={`text-xs p-2 ${alert.startsWith('ALERT:') ? 'bg-red-50 text-red-800' : 'bg-white'} rounded shadow-sm`}>
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No updates yet
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium mb-2">Data Sources</h4>
          <div className="bg-gray-50 rounded-md p-2 overflow-hidden">
            {dataSources.length > 0 ? (
              <ul className="space-y-2">
                {dataSources.map((source) => (
                  <li key={source.id} className="text-xs p-2 bg-white rounded shadow-sm flex justify-between items-center">
                    <span>{source.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      source.status === 'active' ? 'bg-green-100 text-green-800' :
                      source.status === 'fetching' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {source.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No data sources registered
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RealtimeUpdates;