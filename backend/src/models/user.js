const mongoose = require('mongoose');

const dashboardSettingsSchema = new mongoose.Schema({
  defaultRegion: {
    type: String,
    enum: ['global', 'usa', 'europe', 'asia'],
    default: 'global'
  },
  defaultTimeRange: {
    type: String,
    enum: ['1y', '5y', '10y', 'max'],
    default: '5y'
  },
  widgets: {
    type: [String],
    default: ['temperature', 'co2', 'precipitation']
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'light'
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  dashboardSettings: {
    type: dashboardSettingsSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;