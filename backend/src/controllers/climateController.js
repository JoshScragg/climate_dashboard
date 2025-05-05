const axios = require('axios');
const { createClient } = require('redis');
const noaaService = require('../services/noaaService');
const nasaService = require('../services/nasaService');
const worldBankService = require('../services/worldBankService');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

connectRedis();

const cacheData = async (key, callback, expiration = 3600) => {
  try {
    if (redisClient && redisClient.isReady) {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      } else {
        const freshData = await callback();
        
        await redisClient.set(key, JSON.stringify(freshData), {
          EX: expiration
        });
        
        return freshData;
      }
    } else {
      return await callback();
    }
  } catch (error) {
    console.error('Cache error:', error);
    return await callback();
  }
};

exports.getTemperatureData = async (req, res) => {
  try {
    const { region = 'global', timeRange = '5y' } = req.query;
    
    const cacheKey = `temperature:${region}:${timeRange}`;
    
    const data = await cacheData(cacheKey, async () => {
      return await noaaService.getTemperatureData(region, timeRange);
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    res.status(500).json({ message: 'Error fetching temperature data' });
  }
};

exports.getCO2Data = async (req, res) => {
  try {
    const { timeRange = '5y' } = req.query;
    
    const cacheKey = `co2:${timeRange}`;
    
    const data = await cacheData(cacheKey, async () => {
      return await noaaService.getCO2Data(timeRange);
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching CO2 data:', error);
    res.status(500).json({ message: 'Error fetching CO2 data' });
  }
};

exports.getPrecipitationData = async (req, res) => {
  try {
    const { region = 'global' } = req.query;
    
    const cacheKey = `precipitation:${region}`;
    
    const data = await cacheData(cacheKey, async () => {
      return await noaaService.getPrecipitationData(region);
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching precipitation data:', error);
    res.status(500).json({ message: 'Error fetching precipitation data' });
  }
};

exports.getSeaLevelData = async (req, res) => {
  try {
    const { timeRange = '5y' } = req.query;
    
    const cacheKey = `sea-level:${timeRange}`;
    
    const data = await cacheData(cacheKey, async () => {
      return await nasaService.getSeaLevelData(timeRange);
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sea level data:', error);
    res.status(500).json({ message: 'Error fetching sea level data' });
  }
};

exports.getIceExtentData = async (req, res) => {
  try {
    const { timeRange = '5y', region = 'arctic' } = req.query;
    
    const cacheKey = `ice-extent:${region}:${timeRange}`;
    
    const data = await cacheData(cacheKey, async () => {
      return await nasaService.getIceExtentData(region, timeRange);
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching ice extent data:', error);
    res.status(500).json({ message: 'Error fetching ice extent data' });
  }
};

exports.getLatestTemperatureData = async (req, res) => {
  try {
    const { region = 'global' } = req.query;
    
    const temperatureData = await noaaService.getTemperatureData(region, '1y');
    
    const latestData = temperatureData.data.length > 0 
      ? temperatureData.data[temperatureData.data.length - 1] 
      : null;
    
    if (!latestData) {
      return res.status(404).json({ message: 'No temperature data available' });
    }
    
    res.status(200).json(latestData);
  } catch (error) {
    console.error('Error fetching latest temperature data:', error);
    res.status(500).json({ message: 'Error fetching latest temperature data' });
  }
};

exports.getLatestCO2Data = async (req, res) => {
  try {
    const co2Data = await noaaService.getCO2Data('1y');
    
    const latestData = co2Data.data.length > 0 
      ? co2Data.data[co2Data.data.length - 1] 
      : null;
    
    if (!latestData) {
      return res.status(404).json({ message: 'No CO2 data available' });
    }
    
    res.status(200).json(latestData);
  } catch (error) {
    console.error('Error fetching latest CO2 data:', error);
    res.status(500).json({ message: 'Error fetching latest CO2 data' });
  }
};

exports.getLatestSeaLevelData = async (req, res) => {
  try {
    const seaLevelData = await nasaService.getSeaLevelData('1y');
    
    const latestData = seaLevelData.data.length > 0 
      ? seaLevelData.data[seaLevelData.data.length - 1] 
      : null;
    
    if (!latestData) {
      return res.status(404).json({ message: 'No sea level data available' });
    }
    
    res.status(200).json(latestData);
  } catch (error) {
    console.error('Error fetching latest sea level data:', error);
    res.status(500).json({ message: 'Error fetching latest sea level data' });
  }
};

exports.getLatestIceExtentData = async (req, res) => {
  try {
    const { region = 'arctic' } = req.query;
    
    const iceExtentData = await nasaService.getIceExtentData(region, '1y');
    
    const latestData = iceExtentData.data.length > 0 
      ? iceExtentData.data[iceExtentData.data.length - 1] 
      : null;
    
    if (!latestData) {
      return res.status(404).json({ message: 'No ice extent data available' });
    }
    
    res.status(200).json(latestData);
  } catch (error) {
    console.error('Error fetching latest ice extent data:', error);
    res.status(500).json({ message: 'Error fetching latest ice extent data' });
  }
};

exports.clearCache = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'This operation is only allowed in development mode' });
    }
    
    let redisCleared = false;
    if (redisClient && redisClient.isReady) {
      await redisClient.flushAll();
      redisCleared = true;
    }
    
    const noaaCacheCleared = noaaService.clearCache();
    const nasaCacheCleared = nasaService.clearCache();
    
    res.status(200).json({ 
      message: 'Cache cleared successfully',
      redisCleared,
      noaaCacheCleared,
      nasaCacheCleared
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Error clearing cache' });
  }
};

exports.getCacheStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'This operation is only allowed in development mode' });
    }
    
    let redisStatus = null;
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys('*');
      redisStatus = {
        connected: true,
        keyCount: keys.length,
        keys: keys
      };
    } else {
      redisStatus = { connected: false };
    }
    
    const noaaCacheStatus = noaaService.getCacheStatus();
    const nasaCacheStatus = nasaService.getCacheStatus();
    
    res.status(200).json({
      redis: redisStatus,
      noaaService: noaaCacheStatus,
      nasaService: nasaCacheStatus
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({ message: 'Error getting cache status' });
  }
};