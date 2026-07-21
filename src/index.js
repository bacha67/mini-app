import dotenv from 'dotenv';
import bot from './bot.js';
import app from './api/server.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start Express API server
const server = app.listen(PORT, () => {
  console.log(`🌐 Express API server running on port ${PORT}`);
});

// Launch Telegram Bot
bot.launch()
  .then(() => {
    console.log('🤖 Telegram bot launched successfully!');
  })
  .catch((err) => {
    console.error('❌ Failed to launch Telegram bot:', err);
  });

// Graceful shutdown handler
const shutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  bot.stop(signal);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
