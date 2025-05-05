// backend/src/routes/proxy.js
const express = require('express');
const proxyController = require('../controllers/proxyController');
const router = express.Router();

/**
 * @route   GET /api/proxy
 * @desc    Proxy requests to external APIs to avoid CORS issues
 * @access  Public
 */
router.get('/', proxyController.proxyRequest);

module.exports = router;