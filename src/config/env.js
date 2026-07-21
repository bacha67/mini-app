import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN,
};

const isPlaceholder = !config.botToken || config.botToken.includes('paste_your_botfather_token_here') || config.botToken.includes('your_bot_token_here');

if (isPlaceholder) {
  console.warn('⚠️ WARNING: BOT_TOKEN is missing or set to placeholder value in .env');
}
