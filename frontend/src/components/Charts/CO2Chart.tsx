import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useCO2Data } from '../../hooks/useClimateData';
import { TimeRange } from '../../types/climate';

interface CO2ChartProps {
  timeRange: TimeRange;
  isFullScreen?: boolean; 
}

const CO2Chart: React.FC<CO2ChartProps> = ({ timeRange, isFullScreen = false }) => {
  const { data, loading, error } = useCO2Data(timeRange);

  const chartData = React.useMemo(() => {
    if (!data?.data) return [];
    const yearlyData = data.data.reduce((acc, item) => {
      const year = item.date.substring(0, 4);
      if (!acc[year]) {
        acc[year] = { sum: 0, count: 0 };
      }
      acc[year].sum += item.ppm;
      acc[year].count += 1;
      return acc;
    }, {} as Record<string, { sum: number, count: number }>);
    
    return Object.entries(yearlyData).map(([year, values]) => ({
      date: parseInt(year),
      ppm: parseFloat((values.sum / values.count).toFixed(2))
    }));
  }, [data]);

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
        <p>Error loading CO₂ data. Please try again later.</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-gray-500`}>
        <p>No CO₂ data available for this time range.</p>
      </div>
    );
  }

  const preindustrialLevel = 280;
  
  return (
    <div className={`${isFullScreen ? 'h-full' : 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
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
          />
          <YAxis 
            domain={[preindustrialLevel, 'auto']}
            tick={{ fontSize: isFullScreen ? 14 : 12 }}
            tickCount={isFullScreen ? 10 : 5}
            label={{ 
              value: 'CO₂ Concentration (ppm)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: isFullScreen ? 14 : 12 }
            }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} ppm`, 'CO₂ Concentration']}
            labelFormatter={(label) => `Year: ${label}`}
            contentStyle={{ fontSize: isFullScreen ? 14 : 12 }}
          />
          <ReferenceLine 
            y={preindustrialLevel} 
            stroke="#666" 
            strokeDasharray="3 3" 
            label={{ 
              position: 'top', 
              value: 'Pre-industrial Level', 
              fill: '#666',
              fontSize: isFullScreen ? 14 : 12
            }} 
          />
          <ReferenceLine 
            y={350} 
            stroke="#f59e0b" 
            strokeDasharray="3 3" 
            label={{ 
              position: 'insideTopLeft', 
              value: '350 ppm (Safe Level)', 
              fill: '#f59e0b',
              fontSize: isFullScreen ? 14 : 12
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="ppm" 
            stroke="#f59e0b" 
            fill="rgba(245, 158, 11, 0.3)" 
            strokeWidth={isFullScreen ? 3 : 2}
            name="CO₂ Concentration" 
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {isFullScreen && (
        <div className="mt-4 text-sm text-gray-600 p-2 bg-yellow-50 rounded">
          <h4 className="font-medium mb-1">About CO₂ Levels:</h4>
          <p>Pre-industrial CO₂ levels averaged around 280 ppm. Scientists suggest 350 ppm as a "safe" upper boundary to avoid dangerous climate change. Current levels are now over 410 ppm and rising at approximately 2-3 ppm annually.</p>
        </div>
      )}
    </div>
  );
};

export default CO2Chart;