const storageManager = require('../services/storageManager');
const Logger = require('../utils/logger');

let cleanupInterval = null;

/**
 * Clean up expired entries
 */
function cleanup() {
  try {
    const removedCount = storageManager.cleanup();
    // Logging is handled in storageManager
  } catch (error) {
    Logger.error('Error in cleanup task', error);
  }
}

/**
 * Start cleanup task at specified interval
 */
function startCleanup() {
  const interval = parseInt(process.env.CLEANUP_INTERVAL) || 30000;
  
  // Cleanup immediately on start
  cleanup();
  
  // Then cleanup at interval
  cleanupInterval = setInterval(cleanup, interval);
  
  Logger.info(`Cleanup task started (interval: ${interval}ms)`);
}

/**
 * Stop cleanup task
 */
function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    Logger.info('Cleanup task stopped');
  }
}

module.exports = {
  startCleanup,
  stopCleanup,
  cleanup,
};

