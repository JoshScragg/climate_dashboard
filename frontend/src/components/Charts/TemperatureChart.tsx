import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useTemperatureData } from '../../hooks/useClimateData';
import { Region, TimeRange } from '../../types/climate';

interface TemperatureChartProps {
  timeRange: TimeRange;
  region: Region;
  isFullScreen?: boolean;
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ 
  timeRange, 
  region, 
  isFullScreen = false 
}) => {
  const { data, loading, error } = useTemperatureData(region, timeRange);

  const chartData = data?.data.map(item => ({
    date: parseInt(item.date.substring(0, 4)),
    anomaly: item.anomaly,
    average: item.average
  }));
  
  const chartHeight = isFullScreen ? 'calc(100vh - 12rem)' : 300;

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-red-500`}>
        <p>Error loading temperature data. Please try again later.</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-gray-500`}>
        <p>No temperature data available for this selection.</p>
      </div>
    );
  }

  const getRegionName = (region: Region): string => {
    switch (region) {
      case 'global': return 'Global';
      case 'usa': return 'United States';
      case 'europe': return 'Europe';
      case 'asia': return 'Asia';
      default: return 'Global';
    }
  };

  return (
    <div className={`${isFullScreen ? 'h-full' : 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: isFullScreen ? 14 : 12 }}
            tickCount={isFullScreen ? 10 : 5}
            domain={['dataMin', 'dataMax']}
          />
          <YAxis 
            yAxisId="left"
            tickCount={isFullScreen ? 10 : 5}
            domain={[-1, 'auto']}
            tick={{ fontSize: isFullScreen ? 14 : 12 }}
            label={{ 
              value: 'Temperature Anomaly (°C)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: isFullScreen ? 14 : 12 }
            }}
          />
          {chartData && chartData[0]?.average && (
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tickCount={isFullScreen ? 10 : 5}
              domain={['auto', 'auto']}
              tick={{ fontSize: isFullScreen ? 14 : 12 }}
              label={{ 
                value: 'Temperature (°C)', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: isFullScreen ? 14 : 12 }
              }}
            />
          )}
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}°C`, null]}
            labelFormatter={(label) => `Year: ${label}`}
            contentStyle={{ fontSize: isFullScreen ? 14 : 12 }}
          />
          <Legend 
            wrapperStyle={{ fontSize: isFullScreen ? 14 : 12 }}
          />
          <ReferenceLine 
            y={0} 
            yAxisId="left"
            stroke="#666" 
            strokeDasharray="3 3" 
          />
          <ReferenceLine 
            y={1.5} 
            yAxisId="left"
            stroke="#ff4d4d" 
            strokeDasharray="3 3" 
            label={{ 
              position: 'top', 
              value: 'Paris Agreement Goal', 
              fill: '#ff4d4d',
              fontSize: isFullScreen ? 14 : 12 
            }} 
          />
          <Line
            type="monotone"
            dataKey="anomaly"
            stroke="#ef4444"
            name={`${getRegionName(region)} Temp. Anomaly`}
            dot={false}
            strokeWidth={isFullScreen ? 3 : 2}
            yAxisId="left"
          />
          {chartData && chartData[0]?.average && (
            <Line
              type="monotone"
              dataKey="average"
              stroke="#3b82f6"
              name={`${getRegionName(region)} Avg. Temp.`}
              dot={false}
              strokeWidth={isFullScreen ? 3 : 2}
              yAxisId="right"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemperatureChart;