import dotenv from 'dotenv';
import bot from './bot.js';
import app from './api/server.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Webhook configuration — strip trailing slash from domain if present
const rawDomain = process.env.MINI_APP_URL || 'http://localhost:3000';
const domain = rawDomain.replace(/\/+$/, '');
const webhookPath = `/telegraf/${process.env.BOT_TOKEN}`;
const fullWebhookUrl = `${domain}${webhookPath}`;

// Register the bot's webhook handler with Express BEFORE app.listen
app.use(bot.webhookCallback(webhookPath));

// Start Express API server (serves API + static frontend + webhook)
const server = app.listen(PORT, async () => {
  console.log(`🌐 Express API server running on port ${PORT}`);

  // Set the Telegram webhook after the server is live
  try {
    console.log('Attempting to set webhook to:', fullWebhookUrl);
    await bot.telegram.setWebhook(fullWebhookUrl);
    console.log('🔗 Webhook set successfully:', fullWebhookUrl);
  } catch (err) {
    console.error('❌ Failed to set Telegram webhook:', err.message);
  }
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    await bot.telegram.deleteWebhook();
    console.log('Webhook removed.');
  } catch (err) {
    console.error('Failed to delete webhook on shutdown:', err.message);
  }
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
