import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../UI/Card';
import Button from '../UI/Button';
import TemperatureChart from '../Charts/TemperatureChart';
import PrecipitationMap from '../Charts/PrecipitationMap';
import CO2Chart from '../Charts/CO2Chart';
import RealtimeUpdates from '../Dashboard/RealtimeUpdates';
import { useAuth } from '../../contexts/AuthContext';
import useWebSocket from '../../hooks/useWebSocket';

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1y' | '5y' | '10y' | 'max'>('5y');
  const [region, setRegion] = useState<'global' | 'usa' | 'europe' | 'asia'>('global');
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWebSocket();

  const handleTimeRangeChange = (range: '1y' | '5y' | '10y' | 'max') => {
    setTimeRange(range);
  };

  const handleRegionChange = (selectedRegion: 'global' | 'usa' | 'europe' | 'asia') => {
    setRegion(selectedRegion);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Climate Dashboard</h1>
        <div className="flex space-x-2">
          <div className="bg-white p-1 rounded-md shadow-sm">
            <div className="flex space-x-1">
              {(['1y', '5y', '10y', 'max'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === range
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {range === 'max' ? 'Max' : range}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white p-1 rounded-md shadow-sm">
            <div className="flex space-x-1">
              {(['global', 'usa', 'europe', 'asia'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRegionChange(r)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    region === r
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {r === 'global' ? 'Global' : r === 'usa' ? 'USA' : r === 'europe' ? 'Europe' : 'Asia'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Global Temperature</p>
              <p className="text-2xl font-semibold text-gray-900">+1.1°C</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">CO₂ Level</p>
              <p className="text-2xl font-semibold text-gray-900">417 ppm</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sea Level Rise</p>
              <p className="text-2xl font-semibold text-gray-900">+3.6 mm/yr</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Arctic Ice</p>
              <p className="text-2xl font-semibold text-gray-900">-13% decade</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            <Card title="Global Temperature Anomalies" className="col-span-1">
              <TemperatureChart timeRange={timeRange} region={region} />
            </Card>
            
            <Card title="CO₂ Concentration" className="col-span-1">
              <CO2Chart timeRange={timeRange} />
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 gap-6">
            <RealtimeUpdates />
          </div>
        </div>
      </div>
      
      <Card title="Precipitation Patterns" className="w-full">
        <PrecipitationMap region={region} />
      </Card>
    </div>
  );
};

export default Dashboard;