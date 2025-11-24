const express = require('express');
const router = express.Router();
const storageManager = require('../services/storageManager');
const Logger = require('../utils/logger');
const { formatValue } = require('../utils/valueParser');
const { sendDiscordNotification } = require('../services/discordNotifier');

/**
 * POST /api/notify
 * Receive notifications from Roblox notifier clients.
 */
router.post('/', async (req, res) => {
  try {
    const {
      displayName,
      value,
      valueFormatted,
      mutation,
      rarity,
      players,
      jobId,
      placeId,
      teleportScript,
    } = req.body || {};

    if (!displayName || !jobId || !placeId) {
      return res.status(400).json({
        error: 'Missing required fields (displayName, jobId, placeId)',
      });
    }

    const numericValue = typeof value === 'number'
      ? value
      : parseInt(value, 10) || 0;

    const serverData = {
      displayName: String(displayName),
      value: numericValue,
      valueFormatted: valueFormatted || formatValue(numericValue),
      mutation: mutation || 'Unknown',
      rarity: rarity || 'Unknown',
      players: players || 'N/A',
      jobId: String(jobId),
      placeId: typeof placeId === 'number' ? placeId : parseInt(placeId, 10) || null,
      teleportScript: teleportScript || null,
    };

    const storedServer = storageManager.addServer(serverData);

    // Fire-and-forget Discord notification.
    sendDiscordNotification(storedServer).catch((error) => {
      Logger.error('Discord notification error', error);
    });

    Logger.api(`POST /api/notify - stored ${serverData.displayName} (${serverData.jobId})`);
    res.json({
      message: 'Notification stored',
      server: storedServer,
    });
  } catch (error) {
    Logger.error('Error handling /api/notify', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

