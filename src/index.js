import dotenv from 'dotenv';
import bot from './bot.js';
import app from './api/server.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Webhook configuration
const domain = process.env.MINI_APP_URL; // e.g. https://552e01d4b4107c.lhr.life
const webhookPath = `/telegraf/${process.env.BOT_TOKEN}`; // secret path prevents spoofed updates

// Register the bot's webhook handler with Express BEFORE app.listen
app.use(bot.webhookCallback(webhookPath));

// Start Express API server (serves API + static frontend + webhook)
const server = app.listen(PORT, async () => {
  console.log(`🌐 Express API server running on port ${PORT}`);

  // Set the Telegram webhook after the server is live
  try {
    await bot.telegram.setWebhook(`${domain}${webhookPath}`);
    console.log('🔗 Webhook set:', `${domain}${webhookPath}`);
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
