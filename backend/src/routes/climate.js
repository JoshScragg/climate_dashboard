const express = require('express');
const climateController = require('../controllers/climateController');
const router = express.Router();

/**
 * @route   GET /api/climate/temperature
 * @desc    Get temperature data with filtering
 * @access  Public
 */
router.get('/temperature', climateController.getTemperatureData);

/**
 * @route   GET /api/climate/co2
 * @desc    Get CO2 data with filtering
 * @access  Public
 */
router.get('/co2', climateController.getCO2Data);

/**
 * @route   GET /api/climate/precipitation
 * @desc    Get precipitation data with filtering
 * @access  Public
 */
router.get('/precipitation', climateController.getPrecipitationData);

/**
 * @route   GET /api/climate/sea-level
 * @desc    Get sea level data with filtering
 * @access  Public
 */
router.get('/sea-level', climateController.getSeaLevelData);

/**
 * @route   GET /api/climate/ice-extent
 * @desc    Get ice extent data with filtering
 * @access  Public
 */
router.get('/ice-extent', climateController.getIceExtentData);

/**
 * NEW ROUTES FOR LATEST REAL-TIME DATA
 */

/**
 * @route   GET /api/climate/temperature/latest
 * @desc    Get the latest temperature data point
 * @access  Public
 */
router.get('/temperature/latest', climateController.getLatestTemperatureData);

/**
 * @route   GET /api/climate/co2/latest
 * @desc    Get the latest CO2 data point
 * @access  Public
 */
router.get('/co2/latest', climateController.getLatestCO2Data);

/**
 * @route   GET /api/climate/sea-level/latest
 * @desc    Get the latest sea level data point
 * @access  Public
 */
router.get('/sea-level/latest', climateController.getLatestSeaLevelData);

/**
 * @route   GET /api/climate/ice-extent/latest
 * @desc    Get the latest ice extent data point
 * @access  Public
 */
router.get('/ice-extent/latest', climateController.getLatestIceExtentData);

/**
 * DEVELOPMENT/DEBUGGING ROUTES
 */

/**
 * @route   POST /api/climate/cache/clear
 * @desc    Clear all caches (Redis + service caches)
 * @access  Public (in development only)
 */
router.post('/cache/clear', climateController.clearCache);

/**
 * @route   GET /api/climate/cache/status
 * @desc    Get cache status for monitoring
 * @access  Public (in development only)
 */
router.get('/cache/status', climateController.getCacheStatus);

module.exports = router;