// frontend/src/services/dataTransformationService.ts
import { TemperatureData, CO2Data, PrecipitationData } from '../types/climate';

interface CO2YearData {
  [year: string]: {
    sum: number;
    count: number;
  };
}

interface CorrelationDataPoint {
  year: number;
  temperature: number;
  absoluteTemp: number | null;
  co2: number;
}

export const dataTransformationService = {
  /**
   * Transform temperature data into a format suitable for heat maps
   * @param data Array of temperature data points
   * @returns Transformed data for heat map visualization
   */
  transformTemperatureDataForHeatMap: (data: TemperatureData[]) => {
    
    const heatMapData = data.reduce((acc, item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      
      if (!acc[year]) {
        acc[year] = {};
      }
      
      acc[year][month] = {
        anomaly: item.anomaly,
        average: item.average || null,
        min: item.min || null,
        max: item.max || null
      };
      
      return acc;
    }, {} as Record<number, Record<number, { anomaly: number; average: number | null; min: number | null; max: number | null }>>);
    
    
    return Object.entries(heatMapData).flatMap(([year, months]) => {
      return Object.entries(months).map(([month, values]) => ({
        year: parseInt(year),
        month: parseInt(month),
        anomaly: values.anomaly,
        average: values.average,
        min: values.min,
        max: values.max
      }));
    });
  },
  
  /**
   * Transform temperature and CO2 data for scatter plot correlation analysis
   * @param tempData Temperature data array
   * @param co2Data CO2 data array
   * @returns Transformed data for scatter plot visualization
   */
  transformDataForCorrelation: (tempData: TemperatureData[], co2Data: CO2Data[]) => {
    
    const co2ByYear: CO2YearData = {};
    
    co2Data.forEach(item => {
      const year = new Date(item.date).getFullYear();
      const yearStr = year.toString();
      
      if (!co2ByYear[yearStr]) {
        co2ByYear[yearStr] = { sum: 0, count: 0 };
      }
      
      co2ByYear[yearStr].sum += item.ppm;
      co2ByYear[yearStr].count += 1;
    });
    
    
    const yearlyAverages: Record<string, number> = {};
    Object.keys(co2ByYear).forEach(yearStr => {
      const year = parseInt(yearStr);
      yearlyAverages[yearStr] = co2ByYear[yearStr].sum / co2ByYear[yearStr].count;
    });
    
    
    const correlationData: CorrelationDataPoint[] = [];
    
    tempData.forEach(tempItem => {
      const year = new Date(tempItem.date).getFullYear();
      const yearStr = year.toString();
      
      if (yearlyAverages[yearStr] !== undefined) {
        correlationData.push({
          year,
          temperature: tempItem.anomaly,
          absoluteTemp: tempItem.average || null,
          co2: yearlyAverages[yearStr]
        });
      }
    });
    
    return correlationData;
  },
  
  /**
   * Transform precipitation data for geographic visualization
   * @param data Precipitation data array
   * @returns Transformed data for geographic visualization
   */
  transformPrecipDataForMap: (data: PrecipitationData[]) => {
    
    const gridData = data.reduce((acc, item) => {
      const key = `${item.latitude},${item.longitude}`;
      
      if (!acc[key]) {
        acc[key] = {
          latitude: item.latitude,
          longitude: item.longitude,
          values: [],
          anomalies: []
        };
      }
      
      acc[key].values.push(item.value);
      if (item.anomaly !== undefined) {
        acc[key].anomalies.push(item.anomaly);
      }
      
      return acc;
    }, {} as Record<string, { latitude: number; longitude: number; values: number[]; anomalies: number[] }>);
    
    
    return Object.values(gridData).map(cell => ({
      latitude: cell.latitude,
      longitude: cell.longitude,
      value: cell.values.reduce((sum, val) => sum + val, 0) / cell.values.length,
      anomaly: cell.anomalies.length > 0 
        ? cell.anomalies.reduce((sum, val) => sum + val, 0) / cell.anomalies.length 
        : undefined
    }));
  },
  
  /**
   * Generate time series data for analysis 
   * @param data Array of data points with dates and values
   * @param valueKey Key for the value to extract
   * @returns Processed time series data
   */
  processTimeSeriesData: <T extends { date: string }>(
    data: T[], 
    valueKey: keyof T
  ) => {
    
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    
    const values = sortedData.map(item => item[valueKey]);
    const dates = sortedData.map(item => new Date(item.date));
    
    
    const movingAvg = values.map((val, idx) => {
      if (idx < 2 || idx >= values.length - 2) {
        return null; 
      }
      
      const sum = values
        .slice(idx - 2, idx + 3)
        .reduce((acc, v) => acc + (typeof v === 'number' ? v as number : 0), 0);
      
      return sum / 5;
    });
    
    return {
      dates,
      values,
      movingAvg
    };
  },
  
  /**
   * Generate statistics from temperature data
   * @param data Temperature data array
   * @returns Statistical summary
   */
  generateTemperatureStats: (data: TemperatureData[]) => {
    if (!data || data.length === 0) {
      return null;
    }
    
    
    const anomalies = data.map(d => d.anomaly);
    
    
    const min = Math.min(...anomalies);
    const max = Math.max(...anomalies);
    const avg = anomalies.reduce((sum, val) => sum + val, 0) / anomalies.length;
    
    
    
    let rateOfChange = null;
    if (data.length >= 10) {
      const firstFiveYrs = anomalies.slice(0, 5);
      const lastFiveYrs = anomalies.slice(-5);
      
      const firstAvg = firstFiveYrs.reduce((sum, val) => sum + val, 0) / firstFiveYrs.length;
      const lastAvg = lastFiveYrs.reduce((sum, val) => sum + val, 0) / lastFiveYrs.length;
      
      const yearSpan = new Date(data[data.length - 1].date).getFullYear() - 
                        new Date(data[0].date).getFullYear();
      
      rateOfChange = (lastAvg - firstAvg) / yearSpan;
    }
    
    return {
      min,
      max,
      average: avg,
      rateOfChange,
      totalChange: anomalies[anomalies.length - 1] - anomalies[0]
    };
  },
  
  /**
   * Calculate anomalies based on a baseline period
   * @param data Array of data with values
   * @param valueKey Key for the value to use
   * @param baselineStartYear Start year for baseline period
   * @param baselineEndYear End year for baseline period
   * @returns Data with anomalies added
   */
  calculateAnomalies: <T extends { date: string }>(
    data: T[],
    valueKey: keyof T,
    baselineStartYear: number,
    baselineEndYear: number
  ) => {
    
    const baselineValues = data
      .filter(item => {
        const year = new Date(item.date).getFullYear();
        return year >= baselineStartYear && year <= baselineEndYear;
      })
      .map(item => item[valueKey]);
    
    if (baselineValues.length === 0) {
      return data; 
    }
    
    const baselineAvg = baselineValues.reduce((sum, val) => 
      sum + (typeof val === 'number' ? val as number : 0), 0
    ) / baselineValues.length;
    
    
    return data.map(item => ({
      ...item,
      anomaly: typeof item[valueKey] === 'number'
        ? (item[valueKey] as unknown as number) - baselineAvg
        : null
    }));
  }
};

export default dataTransformationService;