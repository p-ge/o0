const express = require('express');
const router = express.Router();
const storageManager = require('../services/storageManager');
const Logger = require('../utils/logger');

/**
 * GET /api/stats
 * Get statistics about the API
 */
router.get('/', (req, res) => {
  try {
    const stats = storageManager.getStats();
    Logger.api('GET /api/stats');
    res.json(stats);
  } catch (error) {
    Logger.error('Error fetching stats', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

