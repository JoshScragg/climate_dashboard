// backend/src/controllers/proxyController.js
const axios = require('axios');

exports.proxyRequest = async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL parameter is required'
    });
  }
  
  try {
    console.log(`Proxying request to: ${url}`);
    
    const response = await axios.get(url, {
      params: { ...req.query, url: undefined },
      timeout: 10000,
      responseType: url.endsWith('.csv') ? 'text' : 'json'
    });
    
    if (typeof response.data === 'string') {
      res.set('Content-Type', 'text/plain');
      res.send(response.data);
    } else {
      res.json(response.data);
    }
  } catch (error) {
    console.error('Proxy request error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: `Error proxying request: ${error.message}`,
      error: error.response?.data || error.message
    });
  }
};