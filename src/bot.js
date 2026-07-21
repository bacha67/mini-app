import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// 1. Load BOT_TOKEN from .env using dotenv
dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken || botToken === 'paste_your_botfather_token_here' || botToken === 'your_bot_token_here') {
  console.error('❌ Please set a valid BOT_TOKEN in your .env file.');
  process.exit(1);
}

// 2. Initialize Telegraf bot instance
const bot = new Telegraf(botToken);

// 3. Respond to /start with "Bot is connected! ✅"
bot.start((ctx) => ctx.reply('Bot is connected! ✅'));

// 4. Launch the bot with bot.launch()
bot.launch()
  .then(() => {
    console.log('🤖 Bot is connected! ✅');
  })
  .catch((err) => {
    console.error('❌ Failed to launch Telegram bot:', err);
  });

// 5. Add graceful stop handlers for SIGINT and SIGTERM (bot.stop())
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
