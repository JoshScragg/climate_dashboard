const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', userController.registerUser);

/**
 * @route   POST /api/users/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', userController.loginUser);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, userController.getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, userController.updateUserProfile);

/**
 * @route   GET /api/users/dashboard-settings
 * @desc    Get user dashboard settings
 * @access  Private
 */
router.get('/dashboard-settings', protect, userController.getDashboardSettings);

/**
 * @route   PUT /api/users/dashboard-settings
 * @desc    Update user dashboard settings
 * @access  Private
 */
router.put('/dashboard-settings', protect, userController.updateDashboardSettings);

module.exports = router;