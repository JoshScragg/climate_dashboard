const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret_for_dev", {
    expiresIn: process.env.JWT_EXPIRE || "30d"
  });
};

exports.registerUser = async (req, res) => {
  try {
    console.log("Register attempt with:", { 
      name: req.body.name, 
      email: req.body.email,
      passwordProvided: !!req.body.password 
    });

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    console.log("Checking if user exists...");
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists with this email");
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log("Hashing password...");
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log("Password hashed successfully");
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return res.status(500).json({ message: 'Password hashing failed' });
    }

    console.log("Creating user in database...");
    let user;
    try {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        dashboardSettings: {
          defaultRegion: 'global',
          defaultTimeRange: '5y',
          widgets: ['temperature', 'co2', 'precipitation'],
          theme: 'light'
        }
      });
      console.log("User created successfully with ID:", user._id);
    } catch (createError) {
      console.error("User creation error:", createError);
      if (createError.name === 'ValidationError') {
        const validationErrors = Object.keys(createError.errors).map(field => ({
          field,
          message: createError.errors[field].message
        }));
        console.log("Validation errors:", validationErrors);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationErrors 
        });
      }
      return res.status(500).json({ message: 'Failed to create user in database' });
    }

    console.log("Generating token...");
    let token;
    try {
      token = generateToken(user._id);
      console.log("Token generated successfully");
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return res.status(500).json({ message: 'Failed to generate authentication token' });
    }

    console.log("Registration successful");
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Registration error (full trace):', error);
    res.status(500).json({ message: 'Failed to register user: ' + (error.message || 'Unknown error') });
  }
};

exports.loginUser = async (req, res) => {
  try {
    console.log("Login attempt with email:", req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    console.log("Finding user...");
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with this email");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log("Checking password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log("Generating token...");
    const token = generateToken(user._id);

    console.log("Login successful for user:", user._id);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login: ' + (error.message || 'Unknown error') });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { name, email, password } = req.body;
    
    if (name) user.name = name;
    if (email) user.email = email;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

exports.getDashboardSettings = async (req, res) => {
  try {
    res.status(200).json(req.user.dashboardSettings);
  } catch (error) {
    console.error('Get dashboard settings error:', error);
    res.status(500).json({ message: 'Failed to get dashboard settings' });
  }
};

exports.updateDashboardSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { defaultRegion, defaultTimeRange, widgets, theme } = req.body;
    
    if (defaultRegion) user.dashboardSettings.defaultRegion = defaultRegion;
    if (defaultTimeRange) user.dashboardSettings.defaultTimeRange = defaultTimeRange;
    if (widgets) user.dashboardSettings.widgets = widgets;
    if (theme) user.dashboardSettings.theme = theme;
    
    await user.save();
    
    res.status(200).json(user.dashboardSettings);
  } catch (error) {
    console.error('Update dashboard settings error:', error);
    res.status(500).json({ message: 'Failed to update dashboard settings' });
  }
};