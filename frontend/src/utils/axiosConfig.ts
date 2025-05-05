// frontend/src/utils/axiosConfig.ts
import axios from 'axios';

const pendingRequests = new Map();

const getRequestKey = (config: any) => {
  return `${config.method}:${config.url}`;
};

axios.interceptors.request.use(
  (config) => {
    const isWriteOperation = (
      config.method === 'post' || 
      config.method === 'put' || 
      config.method === 'delete'
    );
    
    if (isWriteOperation) {
      return config;
    }
    
    const requestKey = getRequestKey(config);
    
    if (pendingRequests.has(requestKey)) {
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort(`Duplicate request canceled: ${requestKey}`);
      console.log(`Prevented duplicate request: ${requestKey}`);
    } else {
      pendingRequests.set(requestKey, true);
      
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: new Date().getTime()
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config);
    pendingRequests.delete(requestKey);
    return response;
  },
  (error) => {
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }
    return Promise.reject(error);
  }
);

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = baseURL;

const initializeAuthHeader = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        console.log('Auth token initialized from local storage');
      }
    } catch (error) {
      console.error('Error initializing auth token:', error);
      localStorage.removeItem('user');
    }
  }
};

initializeAuthHeader();

export default axios;