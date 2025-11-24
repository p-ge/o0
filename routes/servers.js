const express = require('express');
const router = express.Router();
const storageManager = require('../services/storageManager');
const Logger = require('../utils/logger');

/**
 * GET /api/servers
 * Get all active servers
 */
router.get('/', (req, res) => {
  try {
    const servers = storageManager.getActiveServers();
    Logger.api(`GET /api/servers - returned ${servers.length} servers`);
    res.json(servers);
  } catch (error) {
    Logger.error('Error fetching servers', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/servers/filter
 * Filter servers by minimum value
 * Query params: minValue (number)
 */
router.get('/filter', (req, res) => {
  try {
    const minValue = parseInt(req.query.minValue) || 0;
    const servers = storageManager.filterByMinValue(minValue);
    Logger.api(`GET /api/servers/filter?minValue=${minValue} - returned ${servers.length} servers`);
    res.json(servers);
  } catch (error) {
    Logger.error('Error filtering servers', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/servers/:jobId
 * Get specific server by job ID
 */
router.get('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const serverEntries = storageManager.getServerByJobId(jobId);
    
    if (!serverEntries || serverEntries.length === 0) {
      Logger.api(`GET /api/servers/${jobId} - not found`);
      return res.status(404).json({ error: 'Server not found or expired' });
    }
    
    Logger.api(`GET /api/servers/${jobId} - returned ${serverEntries.length} entries`);
    res.json(serverEntries);
  } catch (error) {
    Logger.error('Error fetching server by jobId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/servers/:jobId
 * Remove server when user joins
 */
router.delete('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const removedEntries = storageManager.removeServer(jobId);
    
    if (!removedEntries || removedEntries.length === 0) {
      Logger.api(`DELETE /api/servers/${jobId} - not found`);
      return res.status(404).json({ error: 'Server not found' });
    }
    
    Logger.api(`DELETE /api/servers/${jobId} - removed ${removedEntries.length} entries`);
    res.json({ message: 'Server removed', removed: removedEntries });
  } catch (error) {
    Logger.error('Error removing server', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

