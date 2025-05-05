export interface TemperatureData {
    date: string;
    anomaly: number;  
    average?: number; 
    min?: number;     
    max?: number;     
  }
  
  export interface CO2Data {
    date: string;
    ppm: number;     
  }
  
  export interface PrecipitationData {
    latitude: number;
    longitude: number;
    value: number;    
    anomaly?: number; 
  }
  
  export interface SeaLevelData {
    date: string;
    level: number;   
  }
  
  export interface IceExtentData {
    date: string;
    extent: number;  
    anomaly: number;  
  }
  
  export interface NOAATemperatureResponse {
    data: TemperatureData[];
    metadata: {
      baselineStart: number;
      baselineEnd: number;
      unit: string;
      source: string;
    };
  }
  
  export interface NOAACO2Response {
    data: CO2Data[];
    metadata: {
      unit: string;
      source: string;
    };
  }
  
  export interface NOAAPrecipitationResponse {
    data: PrecipitationData[];
    metadata: {
      unit: string;
      source: string;
    };
  }
  
  export type Region = 'global' | 'usa' | 'europe' | 'asia';
  export type TimeRange = '1y' | '5y' | '10y' | 'max';