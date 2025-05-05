// frontend/src/components/Charts/ScatterPlotChart.tsx
import React, { useState } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ZAxis,
  Label
} from 'recharts';
import { useTemperatureData, useCO2Data } from '../../hooks/useClimateData';
import { Region, TimeRange } from '../../types/climate';

interface ScatterPlotChartProps {
  timeRange: TimeRange;
  region: Region;
  isFullScreen?: boolean;
}

interface CorrelationDataPoint {
  year: number;
  temperature: number;
  co2: number;
  size?: number;
}

interface CO2YearlyData {
  sum: number;
  count: number;
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({ 
  timeRange, 
  region, 
  isFullScreen = false 
}) => {
  const [yAxisMetric, setYAxisMetric] = useState<'anomaly' | 'average'>('anomaly');
  
  const { data: tempData, loading: tempLoading, error: tempError } = useTemperatureData(region, timeRange);
  const { data: co2Data, loading: co2Loading, error: co2Error } = useCO2Data(timeRange);

  const combinedData = React.useMemo(() => {
    if (!tempData?.data || !co2Data?.data) return [];
    
    const co2ByYear: Record<string, CO2YearlyData> = {};
    
    co2Data.data.forEach(item => {
      const year = item.date.substring(0, 4);
      if (!co2ByYear[year]) {
        co2ByYear[year] = { sum: 0, count: 0 };
      }
      co2ByYear[year].sum += item.ppm;
      co2ByYear[year].count += 1;
    });

    const yearlyAverages: Record<string, number> = {};
    
    Object.keys(co2ByYear).forEach(year => {
      yearlyAverages[year] = co2ByYear[year].sum / co2ByYear[year].count;
    });
    
    const correlationData: CorrelationDataPoint[] = [];
    tempData.data.forEach(tempItem => {
      const year = tempItem.date.substring(0, 4);
      if (yearlyAverages[year] !== undefined) {
        correlationData.push({
          year: parseInt(year),
          temperature: yAxisMetric === 'anomaly' ? tempItem.anomaly : (tempItem.average || 0),
          co2: yearlyAverages[year],
          size: 20 
        });
      }
    });
    
    return correlationData;
  }, [tempData, co2Data, yAxisMetric]);

  const isLoading = tempLoading || co2Loading;
  const hasError = tempError || co2Error;

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-red-500`}>
        <p>Error loading data. Please try again later.</p>
      </div>
    );
  }

  if (!combinedData || combinedData.length === 0) {
    return (
      <div className={`flex justify-center items-center ${isFullScreen ? 'h-full' : 'h-64'} text-gray-500`}>
        <p>No correlation data available for this selection.</p>
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
    <div className={isFullScreen ? 'h-full' : 'h-64'}>
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {getRegionName(region)} Temperature vs CO₂ Concentration
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Y-Axis:</span>
          <select 
            value={yAxisMetric}
            onChange={(e) => setYAxisMetric(e.target.value as 'anomaly' | 'average')}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="anomaly">Temperature Anomaly</option>
            <option value="average">Absolute Temperature</option>
          </select>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={isFullScreen ? 600 : 300}>
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="co2" 
            name="CO₂ (ppm)"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: isFullScreen ? 14 : 12 }}
          >
            <Label 
              value="CO₂ Concentration (ppm)" 
              offset={-5} 
              position="insideBottom" 
              style={{ textAnchor: 'middle', fontSize: isFullScreen ? 14 : 12 }}
            />
          </XAxis>
          <YAxis 
            type="number"
            dataKey="temperature" 
            name={yAxisMetric === 'anomaly' ? 'Temperature Anomaly (°C)' : 'Temperature (°C)'}
            domain={yAxisMetric === 'anomaly' ? [-1, 'auto'] : ['auto', 'auto']}
            tick={{ fontSize: isFullScreen ? 14 : 12 }}
          >
            <Label 
              value={yAxisMetric === 'anomaly' ? 'Temperature Anomaly (°C)' : 'Temperature (°C)'} 
              angle={-90} 
              position="insideLeft" 
              style={{ textAnchor: 'middle', fontSize: isFullScreen ? 14 : 12 }}
            />
          </YAxis>
          <ZAxis dataKey="size" range={[40, 400]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number) => [`${value.toFixed(2)}`, null]}
            labelFormatter={(_, payload) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload as CorrelationDataPoint;
                return `Year: ${data.year}, CO₂: ${data.co2.toFixed(1)} ppm, Temp: ${data.temperature.toFixed(2)}°C`;
              }
              return '';
            }}
            contentStyle={{ fontSize: isFullScreen ? 14 : 12 }}
          />
          <Legend wrapperStyle={{ fontSize: isFullScreen ? 14 : 12 }} />
          <Scatter 
            name="Temperature vs CO₂" 
            data={combinedData}
            fill="#ff7300"
            line={{ stroke: '#ff7300', strokeWidth: 1 }}
            lineType="fitting"
          />
        </ScatterChart>
      </ResponsiveContainer>
      
      {isFullScreen && (
        <div className="mt-6 p-4 bg-yellow-50 rounded max-w-3xl mx-auto">
          <h4 className="font-medium mb-2">About CO₂ & Temperature Correlation:</h4>
          <p className="text-sm">This scatter plot shows the relationship between atmospheric CO₂ concentration and temperature. Each point represents a year, with CO₂ levels on the x-axis and temperature on the y-axis. The trend line shows the general relationship between these variables - as CO₂ increases, global temperatures also tend to rise.</p>
          <p className="text-sm mt-2">This correlation is a key indicator of climate change, demonstrating how greenhouse gas increases are linked to warming temperatures.</p>
        </div>
      )}
    </div>
  );
};

export default ScatterPlotChart;