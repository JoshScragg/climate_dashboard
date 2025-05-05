// backend/src/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const noaaService = require('./services/noaaService');
const nasaService = require('./services/nasaService');
const { Temperature, CO2, SeaLevel, IceExtent } = require('./models/climateData');

dotenv.config();

const climateRoutes = require('./routes/climate');
const userRoutes = require('./routes/users');
const proxyRoutes = require('./routes/proxy');

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log('Using frontend URL for CORS:', frontendUrl);

const io = socketIo(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  ...(process.env.NODE_ENV === 'development' ? { debug: true } : {})
});

global.io = io;

app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/climate-dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/climate', climateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/proxy', proxyRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const activeSources = {
  'temperature': {
    name: 'Global Temperature Data',
    status: 'active',
    lastUpdate: Date.now()
  },
  'co2': {
    name: 'CO₂ Concentration',
    status: 'active',
    lastUpdate: Date.now()
  },
  'sea-level': {
    name: 'Sea Level Rise',
    status: 'active',
    lastUpdate: Date.now()
  },
  'ice-extent': {
    name: 'Arctic Ice Extent',
    status: 'active',
    lastUpdate: Date.now()
  }
};

const updateSourceStatus = (sourceId, status) => {
  if (activeSources[sourceId]) {
    activeSources[sourceId].status = status;
    activeSources[sourceId].lastUpdate = Date.now();
  }
};

const getLatestDataFromDB = async (dataType, params = {}) => {
  try {
    switch (dataType) {
      case 'temperature': {
        const region = params.region || 'global';
        const latestRecord = await Temperature.findOne({ region })
          .sort({ date: -1 })
          .limit(1);
        
        if (latestRecord) {
          return {
            date: latestRecord.date.toISOString().split('T')[0],
            anomaly: latestRecord.anomaly,
            average: latestRecord.average || null
          };
        }
        break;
      }
      
      case 'co2': {
        const latestRecord = await CO2.findOne()
          .sort({ date: -1 })
          .limit(1);
        
        if (latestRecord) {
          return {
            date: latestRecord.date.toISOString().split('T')[0],
            ppm: latestRecord.ppm
          };
        }
        break;
      }
      
      case 'sea-level': {
        const latestRecord = await SeaLevel.findOne()
          .sort({ date: -1 })
          .limit(1);
        
        if (latestRecord) {
          return {
            date: latestRecord.date.toISOString().split('T')[0],
            level: latestRecord.level
          };
        }
        break;
      }
      
      case 'ice-extent': {
        const region = params.region || 'arctic';
        const latestRecord = await IceExtent.findOne({ region })
          .sort({ date: -1 })
          .limit(1);
        
        if (latestRecord) {
          return {
            date: latestRecord.date.toISOString().split('T')[0],
            extent: latestRecord.extent,
            anomaly: latestRecord.anomaly
          };
        }
        break;
      }
      
      default:
        return null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting latest ${dataType} data from MongoDB:`, error);
    return null;
  }
};

const fetchAndEmitClimateData = async (socket, dataType, params = {}) => {
  try {
    updateSourceStatus(dataType, 'fetching');
    socket.emit('data-source-update', {
      id: dataType,
      name: activeSources[dataType].name,
      status: 'fetching',
      lastUpdate: Date.now()
    });
    
    const latestData = await getLatestDataFromDB(dataType, params);
    
    if (latestData) {
      socket.emit(`${dataType}-update`, latestData);
      
      updateSourceStatus(dataType, 'active');
      socket.emit('data-source-update', {
        id: dataType,
        name: activeSources[dataType].name,
        status: 'active',
        lastUpdate: Date.now()
      });
      
      const lastUpdateTime = activeSources[dataType].lastUpdate;
      const now = Date.now();
      const refreshInterval = 15 * 60 * 1000;
      
      if (now - lastUpdateTime < refreshInterval) {
        return;
      }
    }
    
    try {
      let data;
      
      switch (dataType) {
        case 'temperature':
          data = await noaaService.getTemperatureData(
            params.region || 'global', 
          );
          
          if (data && data.data && data.data.length > 0) {
            socket.emit('temperature-update', data.data[data.data.length - 1]);
          }
          break;
          
        case 'co2':
          data = await noaaService.getCO2Data('1y'); 
          
          if (data && data.data && data.data.length > 0) {
            socket.emit('co2-update', data.data[data.data.length - 1]);
          }
          break;
          
        case 'sea-level':
          data = await nasaService.getSeaLevelData('1y');
          
          if (data && data.data && data.data.length > 0) {
            socket.emit('sea-level-update', data.data[data.data.length - 1]);
          }
          break;
          
        case 'ice-extent':
          data = await nasaService.getIceExtentData(
            params.region || 'arctic',
            '1y' 
          );
          
          if (data && data.data && data.data.length > 0) {
            socket.emit('ice-extent-update', data.data[data.data.length - 1]);
          }
          break;
          
        default:
          socket.emit('alert', `Unknown data type: ${dataType}`);
          return;
      }
      
      updateSourceStatus(dataType, 'active');
      socket.emit('data-source-update', {
        id: dataType,
        name: activeSources[dataType].name,
        status: 'active',
        lastUpdate: Date.now()
      });
      
    } catch (error) {
      console.error(`Error fetching ${dataType} data from API:`, error);
      
      if (!latestData) {
        updateSourceStatus(dataType, 'error');
        socket.emit('data-source-update', {
          id: dataType,
          name: activeSources[dataType].name,
          status: 'error',
          lastUpdate: Date.now()
        });
        
        socket.emit('alert', `Error fetching fresh ${dataType} data: ${error.message}. Using cached data if available.`);
      }
    }
  } catch (error) {
    console.error(`Error in fetchAndEmitClimateData for ${dataType}:`, error);
    
    updateSourceStatus(dataType, 'error');
    socket.emit('data-source-update', {
      id: dataType,
      name: activeSources[dataType].name,
      status: 'error',
      lastUpdate: Date.now()
    });
    
    socket.emit('alert', `Error processing ${dataType} data: ${error.message}`);
  }
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.emit('alert', 'Connected to Climate Dashboard real-time data feed');
  socket.emit('connection-status', { connected: true, timestamp: Date.now() });
  
  Object.entries(activeSources).forEach(([id, source]) => {
    socket.emit('data-source-update', {
      id,
      name: source.name,
      status: source.status,
      lastUpdate: source.lastUpdate
    });
  });
  
  socket.on('subscribe', (channel) => {
    console.log(`Client ${socket.id} subscribing to channel: ${channel}`);
  });
  
  socket.on('unsubscribe', (channel) => {
    console.log(`Client ${socket.id} unsubscribing from channel: ${channel}`);
  });
  
  socket.on('data-request', (request) => {
    console.log(`Received data request from client ${socket.id}:`, request);
    
    if (!request || !request.type) {
      socket.emit('alert', 'Invalid data request format');
      return;
    }
    
    fetchAndEmitClimateData(socket, request.type, request.params || {});
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected (${socket.id}):`, reason);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
});

module.exports = { app, server, io };