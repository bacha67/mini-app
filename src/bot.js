import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import {
  getUserByTelegramId,
  createUser,
  updateUserPhone,
} from './db/usersRepo.js';

dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken || botToken === 'paste_your_botfather_token_here' || botToken === 'your_bot_token_here') {
  console.error('❌ Please set a valid BOT_TOKEN in your .env file.');
  process.exit(1);
}

const bot = new Telegraf(botToken);

/**
 * Reusable helper function to send the "Open App" inline keyboard message
 */
function sendOpenAppMessage(ctx, user) {
  const webAppUrl = process.env.MINI_APP_URL || 'https://placeholder.com';
  const firstName = user?.first_name || ctx.from.first_name || 'User';

  return ctx.reply(
    `Welcome, ${firstName}! Click the button below to open the app:`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Open App', webAppUrl)],
    ])
  );
}

// 2. bot.start(ctx) handler
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';

  let user = await getUserByTelegramId(telegramId);

  if (!user) {
    user = await createUser(telegramId, firstName);
  }

  // If user exists and already has a phone saved
  if (user && user.phone) {
    return sendOpenAppMessage(ctx, user);
  }

  // If user needs to share phone number
  return ctx.reply(
    `Hello ${firstName}! Please share your phone number to continue:`,
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Share Phone Number')],
    ]).resize().oneTime()
  );
});

// 3. bot.on('contact') handler
bot.on('contact', async (ctx) => {
  const telegramId = ctx.from.id;
  const contact = ctx.message.contact;

  // Security check: verify contact belongs to the current user
  if (contact.user_id !== telegramId) {
    return ctx.reply('Please share your own contact');
  }

  // Save phone number to database
  const updatedUser = await updateUserPhone(telegramId, contact.phone_number);

  // Remove reply keyboard and send Open App message
  await ctx.reply('Phone number saved! ✅', Markup.removeKeyboard());
  return sendOpenAppMessage(ctx, updatedUser);
});

// 4. Launch the bot
bot.launch()
  .then(() => {
    console.log('🤖 Telegram bot is running!');
  })
  .catch((err) => {
    console.error('❌ Failed to launch Telegram bot:', err);
  });

// Graceful stop handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
