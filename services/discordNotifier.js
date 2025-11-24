const axios = require('axios');
const { webhookUrl } = require('../config/discord');
const Logger = require('../utils/logger');
const { formatValue } = require('../utils/valueParser');

/**
 * Send a Discord notification using the configured webhook URL.
 * Falls back gracefully when webhook is not configured.
 */
async function sendDiscordNotification(server) {
  if (!webhookUrl) {
    return;
  }

  try {
    const payload = {
      username: 'JX-NOTIFIER',
      embeds: [
        {
          title: '🔔 Brainrot Found!',
          color: 0x5865F2,
          fields: [
            { name: '🐾 Brainrot', value: server.displayName || 'Unknown', inline: false },
            { name: '💰 Value', value: server.valueFormatted || formatValue(server.value), inline: true },
            { name: '✨ Mutation', value: server.mutation || 'Unknown', inline: true },
            { name: '🎯 Rarity', value: server.rarity || 'Unknown', inline: true },
            { name: '👥 Players', value: server.players || 'N/A', inline: true },
            { name: '🆔 Job ID', value: `\`\`\`${server.jobId || 'Unknown'}\`\`\``, inline: false },
            server.teleportScript
              ? { name: '🚀 Teleport Script', value: `\`\`\`lua\n${server.teleportScript}\n\`\`\``, inline: false }
              : { name: '📍 Place ID', value: `${server.placeId || 'Unknown'}`, inline: true },
          ].filter(Boolean),
          timestamp: new Date(server.timestamp || Date.now()).toISOString(),
        },
      ],
    };

    await axios.post(webhookUrl, payload, { timeout: 5000 });
    Logger.store(`Discord webhook notified for ${server.displayName} (${server.jobId})`);
  } catch (error) {
    Logger.error('Failed to send Discord webhook notification', error);
  }
}

module.exports = {
  sendDiscordNotification,
};

