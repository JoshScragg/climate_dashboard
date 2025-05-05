import { useState, useEffect } from 'react';
import { 
  getTemperatureData, 
  getCO2Data, 
  getPrecipitationData 
} from '../services/api';
import { 
  NOAATemperatureResponse, 
  NOAACO2Response, 
  NOAAPrecipitationResponse,
  Region,
  TimeRange
} from '../types/climate';

export const useTemperatureData = (region: Region, timeRange: TimeRange) => {
  const [data, setData] = useState<NOAATemperatureResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getTemperatureData(region, timeRange);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred while fetching temperature data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region, timeRange]);

  return { data, loading, error };
};

export const useCO2Data = (timeRange: TimeRange) => {
  const [data, setData] = useState<NOAACO2Response | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getCO2Data(timeRange);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred while fetching CO2 data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { data, loading, error };
};

export const usePrecipitationData = (region: Region) => {
  const [data, setData] = useState<NOAAPrecipitationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getPrecipitationData(region);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred while fetching precipitation data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region]);

  return { data, loading, error };
};