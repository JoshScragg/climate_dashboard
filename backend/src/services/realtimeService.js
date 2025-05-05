// backend/src/services/realtimeService.js
const { Temperature, CO2, SeaLevel, IceExtent } = require('../models/climateData');

const CLIMATE_THRESHOLDS = {
  temperature: {
    message: 'Temperature anomaly has exceeded 1.5°C above pre-industrial levels'
  },
  co2: {
    message: 'CO2 concentration has exceeded 420 ppm'
  },
  seaLevel: {
    message: 'Sea level has risen more than 100mm above 1993 baseline'
  }
};

const connectRedis = async () => {
  console.log('Mock real-time service initialized (Redis connection simulated)');
  return true;
};

const checkThresholds = async (type, data) => {
  if (!global.io) return;
  
  try {
    switch (type) {
      case 'temperature':
        if (data.anomaly > CLIMATE_THRESHOLDS.temperature.anomaly) {
          global.io.emit('threshold-alert', {
            type: 'temperature',
            value: data.anomaly,
            threshold: CLIMATE_THRESHOLDS.temperature.anomaly,
            message: CLIMATE_THRESHOLDS.temperature.message,
            timestamp: new Date().toISOString()
          });
        }
        break;
      
      case 'co2':
        if (data.ppm > CLIMATE_THRESHOLDS.co2.ppm) {
          global.io.emit('threshold-alert', {
            type: 'co2',
            value: data.ppm,
            threshold: CLIMATE_THRESHOLDS.co2.ppm,
            message: CLIMATE_THRESHOLDS.co2.message,
            timestamp: new Date().toISOString()
          });
        }
        break;
      
      case 'sea-level':
        if (data.level > CLIMATE_THRESHOLDS.seaLevel.mm) {
          global.io.emit('threshold-alert', {
            type: 'seaLevel',
            value: data.level,
            threshold: CLIMATE_THRESHOLDS.seaLevel.mm,
            message: CLIMATE_THRESHOLDS.seaLevel.message,
            timestamp: new Date().toISOString()
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error checking thresholds:', error);
  }
};

const generateCO2Data = async () => {
  try {
    console.log('Generating mock CO2 data...');
    
    const baseCO2 = 419.5; 
    const co2Variation = (Math.random() * 1 - 0.5).toFixed(1); 
    const co2Level = baseCO2 + parseFloat(co2Variation);
    
    const now = new Date();
    const dateString = now.toISOString();
    
    const co2Update = {
      date: dateString,
      ppm: co2Level
    };
    
    const co2Entry = new CO2({
      date: now,
      ppm: co2Level,
      source: 'Mock Real-time Data Service'
    });
    
    await co2Entry.save();
    console.log('Saved mock CO2 data to database');
    
    if (global.io) {
      global.io.emit('co2-update', co2Update);
      console.log('Broadcasted CO2 update to clients');
    }
    
    await checkThresholds('co2', co2Update);
    
    return co2Update;
  } catch (error) {
    console.error('Error generating CO2 data:', error);
    return null;
  }
};

const generateTemperatureData = async () => {
  try {
    console.log('Generating mock temperature data...');
    
    const baseTemp = 1.1; 
    const tempVariation = (Math.random() * 0.4 - 0.2).toFixed(2); 
    const tempAnomaly = baseTemp + parseFloat(tempVariation);
    
    const now = new Date();
    const dateString = now.toISOString();
    
    const temperatureUpdate = {
      date: dateString,
      anomaly: tempAnomaly,
      average: 14.5 + tempAnomaly
    };
    
    const tempEntry = new Temperature({
      date: now,
      anomaly: tempAnomaly,
      average: 14.5 + tempAnomaly,
      region: 'global',
      source: 'Mock Real-time Data Service'
    });
    
    await tempEntry.save();
    console.log('Saved mock temperature data to database');
    
    if (global.io) {
      global.io.emit('temperature-update', temperatureUpdate);
      console.log('Broadcasted temperature update to clients');
    }
    
    await checkThresholds('temperature', temperatureUpdate);
    
    return temperatureUpdate;
  } catch (error) {
    console.error('Error generating temperature data:', error);
    return null;
  }
};

const generateSeaLevelData = async () => {
  try {
    console.log('Generating mock sea level data...');
    
    const latestRecord = await SeaLevel.findOne().sort({ date: -1 });
    
    const baselineValue = latestRecord ? latestRecord.level : 98.0;
    const randomVariation = (Math.random() * 0.5 - 0.1);
    const newLevel = baselineValue + randomVariation;
    
    const now = new Date();
    const seaLevelUpdate = {
      date: now.toISOString(),
      level: parseFloat(newLevel.toFixed(1))
    };
    
    const seaLevelEntry = new SeaLevel({
      date: now,
      level: seaLevelUpdate.level,
      source: 'Mock Real-time Data Service'
    });
    
    await seaLevelEntry.save();
    console.log('Saved mock sea level data to database');
    
    if (global.io) {
      global.io.emit('sea-level-update', seaLevelUpdate);
      console.log('Broadcasted sea level update to clients');
    }
    
    await checkThresholds('sea-level', seaLevelUpdate);
    
    return seaLevelUpdate;
  } catch (error) {
    console.error('Error generating sea level data:', error);
    return null;
  }
};

let dataPollingIntervals = {};

const startDataCollection = () => {
  console.log('Starting mock climate data collection service');
  
  dataPollingIntervals.co2 = setInterval(generateCO2Data, 20 * 1000);
  
  dataPollingIntervals.temperature = setInterval(generateTemperatureData, 30 * 1000);
  
  dataPollingIntervals.seaLevel = setInterval(generateSeaLevelData, 45 * 1000);
  
  setTimeout(() => {
    generateCO2Data();
    generateTemperatureData();
    generateSeaLevelData();
  }, 5000);
};

const stopDataCollection = () => {
  console.log('Stopping mock climate data collection service');
  
  Object.values(dataPollingIntervals).forEach(interval => {
    clearInterval(interval);
  });
  
  dataPollingIntervals = {};
};

const initialize = async () => {
  try {
    await connectRedis();
    startDataCollection();
    return true;
  } catch (error) {
    console.error('Failed to initialize mock real-time data service:', error);
    return false;
  }
};

const cleanup = async () => {
  stopDataCollection();
  console.log('Mock real-time data service cleaned up');
};

const fetchClimateData = async (dataType, params = {}) => {
  try {
    console.log(`Handling climate data request for: ${dataType}`);
    
    switch (dataType) {
      case 'temperature':
        return await generateTemperatureData();
      case 'co2':
        return await generateCO2Data();
      case 'sea-level':
        return await generateSeaLevelData();
      default:
        console.warn(`Unknown data type: ${dataType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    return null;
  }
};

module.exports = {
  initialize,
  cleanup,
  fetchClimateData,
  generateCO2Data,
  generateTemperatureData,
  generateSeaLevelData
};