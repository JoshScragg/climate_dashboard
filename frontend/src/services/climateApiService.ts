// frontend/src/services/climateApiService.ts
import axios from 'axios';
import { TemperatureData, CO2Data, SeaLevelData, IceExtentData } from '../types/climate';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


const CACHE_EXPIRATION = 15 * 60 * 1000; 


interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache: Record<string, CacheEntry<any>> = {};


const isCacheValid = <T>(cacheKey: string): boolean => {
  const cacheEntry = apiCache[cacheKey] as CacheEntry<T> | undefined;
  
  if (!cacheEntry) return false;
  
  const now = Date.now();
  const cacheAge = now - cacheEntry.timestamp;
  
  return cacheAge < CACHE_EXPIRATION;
};


const getCachedData = <T>(cacheKey: string): T | null => {
  if (!isCacheValid<T>(cacheKey)) return null;
  
  return (apiCache[cacheKey] as CacheEntry<T>).data;
};


const setCacheData = <T>(cacheKey: string, data: T): void => {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
};

/**
 * Fetch CO2 data from the backend API
 */
export const fetchCO2Data = async (timeRange: string = '5y'): Promise<CO2Data[]> => {
  const cacheKey = `CO2_${timeRange}`;
  
  
  const cachedData = getCachedData<CO2Data[]>(cacheKey);
  if (cachedData) {
    console.log('Using cached CO2 data');
    return cachedData;
  }
  
  try {
    console.log('Fetching CO2 data from backend API');
    
    const response = await axios.get(`${API_BASE_URL}/climate/co2`, {
      params: { timeRange }
    });
    
    
    const data = response.data.data;
    
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch CO2 data:', error);
    throw error;
  }
};

/**
 * Fetch temperature data from the backend API
 */
export const fetchTemperatureData = async (region: string = 'global', timeRange: string = '5y'): Promise<TemperatureData[]> => {
  const cacheKey = `TEMP_${region}_${timeRange}`;
  
  
  const cachedData = getCachedData<TemperatureData[]>(cacheKey);
  if (cachedData) {
    console.log('Using cached temperature data');
    return cachedData;
  }
  
  try {
    console.log('Fetching temperature data from backend API');
    
    const response = await axios.get(`${API_BASE_URL}/climate/temperature`, {
      params: { region, timeRange }
    });
    
    
    const data = response.data.data;
    
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch temperature data:', error);
    throw error;
  }
};

/**
 * Fetch sea level data from the backend API
 */
export const fetchSeaLevelData = async (timeRange: string = '5y'): Promise<SeaLevelData[]> => {
  const cacheKey = `SEA_LEVEL_${timeRange}`;
  
  
  const cachedData = getCachedData<SeaLevelData[]>(cacheKey);
  if (cachedData) {
    console.log('Using cached sea level data');
    return cachedData;
  }
  
  try {
    console.log('Fetching sea level data from backend API');
    
    
    const response = await axios.get(`${API_BASE_URL}/climate/sea-level`, {
      params: { timeRange }
    });
    
    const data = response.data.data;
    
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch sea level data:', error);
    throw error;
  }
};

/**
 * Fetch ice extent data from the backend API
 */
export const fetchIceExtentData = async (region: string = 'arctic', timeRange: string = '5y'): Promise<IceExtentData[]> => {
  const cacheKey = `ICE_EXTENT_${region}_${timeRange}`;
  
  
  const cachedData = getCachedData<IceExtentData[]>(cacheKey);
  if (cachedData) {
    console.log('Using cached ice extent data');
    return cachedData;
  }
  
  try {
    console.log('Fetching ice extent data from backend API');
    
    const response = await axios.get(`${API_BASE_URL}/climate/ice-extent`, {
      params: { region, timeRange }
    });
    
    
    const data = response.data.data;
    
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch ice extent data:', error);
    throw error;
  }
};

/**
 * Get the latest climate data point for real-time updates
 */
export const getLatestClimateData = async (dataType: string): Promise<any> => {
  try {
    console.log(`Fetching latest ${dataType} data from backend API`);
    
    const response = await axios.get(`${API_BASE_URL}/climate/${dataType}/latest`);
    
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch latest ${dataType} data:`, error);
    throw error;
  }
};

/**
 * Get cache status for monitoring purposes
 */
export const getCacheStatus = () => {
  return Object.entries(apiCache).map(([key, entry]) => ({
    key,
    lastUpdated: new Date(entry.timestamp).toISOString(),
    isValid: isCacheValid(key),
    age: Math.round((Date.now() - entry.timestamp) / 1000) 
  }));
};

/**
 * Clear the cache
 */
export const clearCache = () => {
  Object.keys(apiCache).forEach(key => {
    delete apiCache[key];
  });
};