// backend/src/services/worldBankService.js
exports.getClimateIndicators = async (country, indicator, timeRange) => {
  try {
    console.log(`Generating mock climate indicators for ${country}, ${indicator}, ${timeRange}`);
    
    const startYear = getStartYearFromTimeRange(timeRange);
    const currentYear = new Date().getFullYear();
    
    const data = [];
    
    let baseValue, unit, trend;
    
    switch (indicator) {
      case 'temperature':
        baseValue = 15; 
        unit = '°C';
        trend = 0.02; 
        break;
      case 'precipitation':
        baseValue = 1000; 
        unit = 'mm';
        trend = 0; 
        break;
      case 'drought':
        baseValue = 0.2; 
        unit = 'index';
        trend = 0.005; 
        break;
      default:
        baseValue = 1;
        unit = 'value';
        trend = 0;
    }
    
    if (country !== 'global') {
      const countryHash = hashCode(country);
      const countryFactor = (countryHash % 100) / 100; 
      
      baseValue = baseValue * (0.7 + countryFactor * 0.6);
    }
    
    for (let year = startYear; year <= currentYear; year++) {
      const yearsSinceStart = year - startYear;
      
      const trendEffect = yearsSinceStart * trend;
      
      const variation = (Math.random() - 0.5) * (baseValue * 0.1);
      
      data.push({
        year: year,
        value: parseFloat((baseValue + trendEffect + variation).toFixed(2)),
        country: country
      });
    }
    
    return {
      data,
      metadata: {
        indicator: indicator,
        unit: unit,
        country: country,
        source: 'World Bank Climate Change Knowledge Portal (Mock)'
      }
    };
  } catch (error) {
    console.error('Error generating climate indicators:', error);
    throw error;
  }
};

exports.getClimateProjections = async (country, scenario, indicator) => {
  try {
    console.log(`Generating mock climate projections for ${country}, ${scenario}, ${indicator}`);
    
    const currentYear = new Date().getFullYear();
    const endYear = 2100;
    
    const data = [];
    
    let baseValue, unit, lowTrend, highTrend;
    
    switch (indicator) {
      case 'temperature':
        baseValue = 15;
        unit = '°C';
        lowTrend = 0.02; 
        highTrend = 0.05;
        break;
      case 'precipitation':
        baseValue = 1000; 
        unit = 'mm';
        lowTrend = 0.001; 
        highTrend = 0.003; 
        break;
      case 'sea-level':
        baseValue = 0; 
        unit = 'cm';
        lowTrend = 0.5;
        highTrend = 1.1;
        break;
      default:
        baseValue = 1;
        unit = 'value';
        lowTrend = 0.01;
        highTrend = 0.03;
    }
    
    if (country !== 'global') {
      const countryHash = hashCode(country);
      const countryFactor = (countryHash % 100) / 100;
      
      baseValue = baseValue * (0.8 + countryFactor * 0.4);
    }
    
    const trend = scenario === 'rcp26' ? lowTrend : highTrend;
    
    for (let year = currentYear; year <= endYear; year += 5) {
      const yearsSinceCurrent = year - currentYear;
      
      const trendEffect = yearsSinceCurrent * trend * (1 + yearsSinceCurrent / 200);
      
      const variation = (Math.random() - 0.5) * (baseValue * 0.05) * (1 - yearsSinceCurrent / 160);
      
      data.push({
        year: year,
        value: parseFloat((baseValue + trendEffect + variation).toFixed(2)),
        country: country,
        scenario: scenario
      });
    }
    
    return {
      data,
      metadata: {
        indicator: indicator,
        unit: unit,
        country: country,
        scenario: scenario,
        source: 'World Bank Climate Change Knowledge Portal Projections (Mock)'
      }
    };
  } catch (error) {
    console.error('Error generating climate projections:', error);
    throw error;
  }
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
      return 1960; 
    default:
      return currentYear - 5;
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
}