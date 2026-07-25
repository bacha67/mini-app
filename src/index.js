import dotenv from 'dotenv';
dotenv.config();

import bot from './bot.js';
import app from './api/server.js';
import { releaseExpiredReservations } from './jobs/releaseExpiredReservations.js';

const PORT = process.env.PORT || 3000;

// Webhook configuration — strip trailing slash and ensure HTTPS for public domains
const rawDomain = process.env.MINI_APP_URL || 'http://localhost:3000';
let domain = rawDomain.replace(/\/+$/, '');
if (domain.startsWith('http://') && !domain.includes('localhost')) {
  domain = domain.replace('http://', 'https://');
}

const webhookPath = `/telegraf/${process.env.BOT_TOKEN}`;
const fullWebhookUrl = `${domain}${webhookPath}`;

// Start Express API server (serves API + static frontend + webhook)
const server = app.listen(PORT, async () => {
  console.log(`🌐 Express API server running on port ${PORT}`);

  // Schedule background cleanup job for expired ticket reservations (runs every 5 minutes)
  setInterval(releaseExpiredReservations, 5 * 60 * 1000);
  // Also run once immediately on startup
  releaseExpiredReservations();

  // Set the Telegram webhook after the server is live
  try {
    console.log('Attempting to set webhook to:', `${domain}/telegraf/[REDACTED_TOKEN]`);
    await bot.telegram.setWebhook(fullWebhookUrl);
    console.log('🔗 Webhook set successfully:', `${domain}/telegraf/[REDACTED_TOKEN]`);
  } catch (err) {
    console.error('❌ Failed to set Telegram webhook:', err.message);
  }
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
