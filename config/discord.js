require('dotenv').config();

const webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;

module.exports = {
  webhookUrl,
};

