// backend/src/services/nasaService.js
const { SeaLevel, IceExtent } = require('../models/climateData');

exports.getSeaLevelData = async (timeRange) => {
  console.log(`Generating mock sea level data for ${timeRange}`);
  
  const startYear = getStartYearFromTimeRange(timeRange);
  const currentYear = new Date().getFullYear();
  
  const data = [];
  
  const baseYear = 1993;
  
  for (let year = Math.max(startYear, baseYear); year <= currentYear; year++) {
    const yearsSince1993 = year - baseYear;
    
    const level = yearsSince1993 * 3.3 + (yearsSince1993 * yearsSince1993 * 0.01);
    
    const variation = (Math.random() * 1 - 0.5);
    
    data.push({
      date: `${year}-01-01`,
      level: parseFloat((level + variation).toFixed(1))
    });
  }
  
  return {
    data,
    metadata: {
      unit: 'mm',
      source: 'NASA Sea Level Observations (Mock)'
    }
  };
};

exports.getIceExtentData = async (region, timeRange) => {
  console.log(`Generating mock ice extent data for ${region}, ${timeRange}`);
  
  const startYear = getStartYearFromTimeRange(timeRange);
  const currentYear = new Date().getFullYear();
  
  const data = [];
  
  const actualStartYear = Math.max(startYear, 1979);
  
  const baseExtent = region === 'arctic' ? 14 : 18; 
  
  for (let year = actualStartYear; year <= currentYear; year++) {
    const yearsSince1979 = year - 1979;
    
    let decline = 0;
    if (yearsSince1979 > 0) {
      if (region === 'arctic') {
        decline = yearsSince1979 * 0.05;
      } 
      else {
        decline = yearsSince1979 * 0.01;
      }
    }
    
    const variation = (Math.random() - 0.5) * 0.4;
    
    const extent = Math.max(0, baseExtent - decline + variation);
    
    data.push({
      date: `${year}-01-01`,
      extent: parseFloat(extent.toFixed(2)),
      anomaly: parseFloat((-decline).toFixed(2))
    });
  }
  
  return {
    data,
    metadata: {
      unit: 'million square kilometers',
      region: region,
      source: 'NASA National Snow and Ice Data Center (Mock)'
    }
  };
};

function getStartYearFromTimeRange(timeRange) {
  const currentYear = new Date().getFullYear();
  switch (timeRange) {
    case '1y':
      return currentYear - 1;
    case '5y':
      return currentYear - 5;
    case '10y':
      return currentYear - 10;
    case 'max':
      return 1979; 
    default:
      return currentYear - 5;
  }
}

exports.getApiStatus = () => {
  return {
    lastApiCalls: { 
      seaLevel: Date.now(),
      iceExtent: Date.now()
    }
  };
};

exports.clearCache = () => {
  return true;
};