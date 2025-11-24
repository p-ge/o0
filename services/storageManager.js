const Logger = require('../utils/logger');

class StorageManager {
  constructor() {
    this.servers = [];
    this.stats = {
      totalFound: 0,
      totalExpired: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Add a server entry as-is so duplicates are preserved
   */
  addServer(serverData) {
    const now = Date.now();
    const expirationTime = parseInt(process.env.EXPIRATION_TIME, 10) || 300000;
    const server = {
      id: `${now}-${serverData.jobId}`,
      ...serverData,
      timestamp: now,
      expiresAt: now + expirationTime,
    };

    this.servers.push(server);
    this.stats.totalFound++;
    Logger.store(`Added server entry: ${serverData.displayName} (${serverData.jobId})`);
    return server;
  }

  /**
   * Get all active (non-expired) servers
   */
  getActiveServers() {
    const now = Date.now();
    return this.servers.filter(s => s.expiresAt > now);
  }

  /**
   * Get all active server entries for a jobId
   */
  getServerByJobId(jobId) {
    const now = Date.now();
    return this.servers.filter(s => s.jobId === jobId && s.expiresAt > now);
  }

  /**
   * Remove server by jobId
   */
  removeServer(jobId) {
    const remaining = [];
    const removed = [];

    for (const server of this.servers) {
      if (server.jobId === jobId) {
        removed.push(server);
      } else {
        remaining.push(server);
      }
    }

    this.servers = remaining;

    if (removed.length > 0) {
      Logger.store(`Removed ${removed.length} server entr${removed.length === 1 ? 'y' : 'ies'} for job ${jobId}`);
    }

    return removed;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const beforeCount = this.servers.length;
    this.servers = this.servers.filter(s => {
      if (s.expiresAt <= now) {
        this.stats.totalExpired++;
        return false;
      }
      return true;
    });
    
    const removedCount = beforeCount - this.servers.length;
    if (removedCount > 0) {
      Logger.expire(`Removed ${removedCount} expired server(s)`);
    }
    return removedCount;
  }

  /**
   * Get statistics
   */
  getStats() {
    const activeCount = this.getActiveServers().length;
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      active: activeCount,
      uptime: Math.floor(uptime / 1000), // seconds
      uptimeFormatted: this.formatUptime(uptime),
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Filter servers by minimum value
   */
  filterByMinValue(minValue) {
    const active = this.getActiveServers();
    return active.filter(s => s.value >= minValue);
  }
}

// Singleton instance
const storageManager = new StorageManager();

module.exports = storageManager;

