import axios from 'axios';
import { 
  NOAATemperatureResponse, 
  NOAACO2Response, 
  NOAAPrecipitationResponse,
  Region,
  TimeRange 
} from '../types/climate';

const NOAA_BASE_URL = 'https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series';
const NASA_BASE_URL = 'https://data.giss.nasa.gov/gistemp';
const WORLD_BANK_URL = 'https://climateknowledgeportal.worldbank.org/api';

// In a real app, this would call the actual APIs
export const getTemperatureData = async (region: Region, timeRange: TimeRange): Promise<NOAATemperatureResponse> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const startYear = getStartYearFromTimeRange(timeRange);
  const currentYear = new Date().getFullYear();
  const baseTemp = region === 'global' ? 14.5 : 
                  region === 'usa' ? 12.5 : 
                  region === 'europe' ? 10.5 : 9.5;
  
  const data = [];
  for (let year = startYear; year <= currentYear; year++) {
    const yearsSince1950 = year - 1950;
    const warming = yearsSince1950 > 0 ? (yearsSince1950 * yearsSince1950 * 0.0001) : 0;
    const variation = (Math.random() - 0.5) * 0.3;
    
    data.push({
      date: `${year}-01-01`,
      anomaly: parseFloat((warming + variation).toFixed(2)),
      average: parseFloat((baseTemp + warming + variation).toFixed(2)),
    });
  }
  
  return {
    data,
    metadata: {
      baselineStart: 1950,
      baselineEnd: 1980,
      unit: '°C',
      source: 'NOAA Global Temperature Analysis'
    }
  };
};

export const getCO2Data = async (timeRange: TimeRange): Promise<NOAACO2Response> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const startYear = getStartYearFromTimeRange(timeRange);
  const currentYear = new Date().getFullYear();
  
  const data = [];
  for (let year = startYear; year <= currentYear; year++) {
    const yearsSince1950 = year - 1950;

    const basePPM = 310;
    let ppm = basePPM + yearsSince1950 * 0.9;
    
    if (year > 1980) {
      ppm += (year - 1980) * 0.5;
    }
    
    for (let month = 0; month < 12; month++) {

      const seasonalVariation = Math.sin((month - 3) * Math.PI / 6) * 3;
      
      data.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-15`,
        ppm: parseFloat((ppm + seasonalVariation).toFixed(2))
      });
    }
  }
  
  return {
    data,
    metadata: {
      unit: 'parts per million (ppm)',
      source: 'NOAA Global Monitoring Laboratory'
    }
  };
};

export const getPrecipitationData = async (region: Region): Promise<NOAAPrecipitationResponse> => {

  await new Promise(resolve => setTimeout(resolve, 600));
  
  const data = [];
  
  let minLat = -60, maxLat = 75, minLon = -180, maxLon = 180;
  
  if (region === 'usa') {
    minLat = 25; maxLat = 50; minLon = -125; maxLon = -65;
  } else if (region === 'europe') {
    minLat = 35; maxLat = 70; minLon = -10; maxLon = 40;
  } else if (region === 'asia') {
    minLat = 0; maxLat = 60; minLon = 60; maxLon = 150;
  }
  
  for (let lat = minLat; lat <= maxLat; lat += 5) {
    for (let lon = minLon; lon <= maxLon; lon += 5) {

      let basePrecip = 100 - Math.abs(lat) * 1.5;
      
      if (lon > 0 && lon < 100 && lat > 0 && lat < 30) {
        // Monsoon Asia
        basePrecip += 50;
      } else if (lon > -120 && lon < -60 && lat > -20 && lat < 20) {
        // Amazon
        basePrecip += 80;
      } else if (lon > -10 && lon < 40 && lat > 35 && lat < 60) {
        // Europe
        basePrecip += 20;
      }
      
      const variation = (Math.random() - 0.5) * 30;
      
      data.push({
        latitude: lat,
        longitude: lon,
        value: Math.max(0, parseFloat((basePrecip + variation).toFixed(1))),
        anomaly: parseFloat((Math.random() * 20 - 10).toFixed(1))
      });
    }
  }
  
  return {
    data,
    metadata: {
      unit: 'mm',
      source: 'NOAA Precipitation Analysis'
    }
  };
};

function getStartYearFromTimeRange(timeRange: TimeRange): number {
  const currentYear = new Date().getFullYear();
  switch (timeRange) {
    case '1y':
      return currentYear - 1;
    case '5y':
      return currentYear - 5;
    case '10y':
      return currentYear - 10;
    case 'max':
      return 1950;
    default:
      return currentYear - 5;
  }
}