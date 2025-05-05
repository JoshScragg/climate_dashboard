const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  anomaly: {
    type: Number,
    required: true
  },
  average: {
    type: Number
  },
  min: {
    type: Number
  },
  max: {
    type: Number
  },
  region: {
    type: String,
    enum: ['global', 'usa', 'europe', 'asia'],
    default: 'global'
  },
  source: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const co2Schema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  ppm: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const precipitationSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  anomaly: {
    type: Number
  },
  region: {
    type: String,
    enum: ['global', 'usa', 'europe', 'asia'],
    default: 'global'
  },
  source: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const seaLevelSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const iceExtentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  extent: {
    type: Number,
    required: true
  },
  anomaly: {
    type: Number,
    required: true
  },
  region: {
    type: String,
    enum: ['arctic', 'antarctic'],
    required: true
  },
  source: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Temperature = mongoose.model('Temperature', temperatureSchema);
const CO2 = mongoose.model('CO2', co2Schema);
const Precipitation = mongoose.model('Precipitation', precipitationSchema);
const SeaLevel = mongoose.model('SeaLevel', seaLevelSchema);
const IceExtent = mongoose.model('IceExtent', iceExtentSchema);

module.exports = {
  Temperature,
  CO2,
  Precipitation,
  SeaLevel,
  IceExtent
};