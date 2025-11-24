const Logger = require('../utils/logger');

/**
 * API Key authentication middleware
 */
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    Logger.error('API_KEY not configured in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!apiKey) {
    Logger.api(`Unauthorized request to ${req.path} - missing API key`);
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  if (apiKey !== expectedKey) {
    Logger.api(`Unauthorized request to ${req.path} - invalid API key`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = { authenticateApiKey };

