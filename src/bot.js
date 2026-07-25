import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import {
  getUserByTelegramId,
  getUserById,
  createUser,
  updateUserPhone,
} from './db/usersRepo.js';
import { getDrawById, incrementTicketsSold } from './db/drawsRepo.js';
import {
  getRandomAvailableTickets,
  assignTicketsToUser,
} from './db/ticketsRepo.js';
import {
  getTransactionById,
  approveTransaction,
  rejectTransaction,
} from './db/transactionsRepo.js';

import pool from './db/pool.js';
import { botStrings } from './i18n/botStrings.js';

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
function sendOpenAppMessage(ctx, user, lang = 'en') {
  const webAppUrl = process.env.MINI_APP_URL || 'https://placeholder.com';
  const strings = botStrings[lang] || botStrings.en;
  const firstName = user?.first_name || ctx.from.first_name || 'User';

  return ctx.reply(
    `Hello ${firstName}! ${strings.welcomeBack}`,
    Markup.inlineKeyboard([
      [Markup.button.webApp(strings.openApp, webAppUrl)],
    ])
  );
}

// bot.start(ctx) handler
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';

  const user = await getUserByTelegramId(telegramId);

  // 1. If user doesn't exist yet: prompt language selection
  if (!user) {
    return ctx.reply(
      '🌐 Please choose your language / እባክዎ ቋንቋዎን ይምረጡ / Maaloo afaan keessan filadhaa:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇹 አማርኛ', 'lang_am')],
        [Markup.button.callback('🇪🇹 Afaan Oromoo', 'lang_om')],
      ])
    );
  }

  const lang = user.language || 'en';
  const strings = botStrings[lang] || botStrings.en;

  // 2. If user exists and already has phone saved: greet in saved language directly
  if (user.phone) {
    return sendOpenAppMessage(ctx, user, lang);
  }

  // 3. If user exists but needs to share phone number
  return ctx.reply(
    strings.sharePhone,
    Markup.keyboard([
      [Markup.button.contactRequest(strings.shareButtonText)],
    ]).resize().oneTime()
  );
});

// bot.action language selection handler
bot.action(/^lang_(en|am|om)$/, async (ctx) => {
  const langCode = ctx.match[1];
  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';

  // Create user with selected language
  const user = await createUser(telegramId, firstName, langCode);
  const strings = botStrings[langCode] || botStrings.en;

  await ctx.answerCbQuery();

  // If user already has phone (e.g. re-selected language), send open app
  if (user.phone) {
    return sendOpenAppMessage(ctx, user, langCode);
  }

  // Ask for phone number in selected language
  return ctx.reply(
    strings.sharePhone,
    Markup.keyboard([
      [Markup.button.contactRequest(strings.shareButtonText)],
    ]).resize().oneTime()
  );
});

// bot.on('contact') handler
bot.on('contact', async (ctx) => {
  const telegramId = ctx.from.id;
  const contact = ctx.message.contact;

  // Security check: verify contact belongs to the current user
  if (contact.user_id !== telegramId) {
    return ctx.reply('Please share your own contact');
  }

  // Save phone number to database
  const updatedUser = await updateUserPhone(telegramId, contact.phone_number);
  const lang = updatedUser?.language || 'en';

  // Remove reply keyboard and send Open App message in user's language
  await ctx.reply('Phone number saved! ✅', Markup.removeKeyboard());
  return sendOpenAppMessage(ctx, updatedUser, lang);
});

// bot.action approve handler
bot.action(/^approve_(\d+)$/, async (ctx) => {
  const transactionId = ctx.match[1];
  const adminName = ctx.from.first_name || 'Admin';

  try {
    // 1 & 2. Get transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return ctx.answerCbQuery('Transaction not found ❌', { show_alert: true });
    }

    // 3. Check if already processed
    if (transaction.status !== 'pending') {
      return ctx.answerCbQuery(`Already processed (${transaction.status})`, { show_alert: true });
    }

    // 4 & 5. Get tickets (reserved vs random quick-pick)
    let ticketIds = [];
    let ticketNumbers = [];
    let tickets = [];

    if (transaction.reserved_ticket_ids) {
      // Choose Your Numbers path — use exact reserved tickets
      const reservedIds = typeof transaction.reserved_ticket_ids === 'string'
        ? JSON.parse(transaction.reserved_ticket_ids)
        : transaction.reserved_ticket_ids;

      const res = await pool.query('SELECT id, ticket_number FROM tickets WHERE id = ANY($1::int[])', [reservedIds]);
      tickets = res.rows;
      ticketIds = tickets.map((t) => t.id);
      ticketNumbers = tickets.map((t) => t.ticket_number);
    } else {
      // Quick Pick path — random available tickets
      tickets = await getRandomAvailableTickets(transaction.draw_id, transaction.quantity);
      if (!tickets || tickets.length < transaction.quantity) {
        return ctx.answerCbQuery('Not enough tickets available! ⚠️', { show_alert: true });
      }
      ticketIds = tickets.map((t) => t.id);
      ticketNumbers = tickets.map((t) => t.ticket_number);
    }

    // 6. Assign tickets to user
    await assignTicketsToUser(ticketIds, transaction.user_id);

    // 7. Update transaction to approved
    await approveTransaction(transactionId, ticketIds, ctx.from.id);

    // 8. Increment tickets_sold for draw
    await incrementTicketsSold(transaction.draw_id, transaction.quantity);

    // 9. Edit admin message caption and remove inline buttons
    const existingCaption = ctx.callbackQuery.message?.caption || '';
    const assignedList = ticketNumbers.map((n) => `#${n}`).join(', ');
    const newCaption = `${existingCaption}\n\n✅ <b>Approved by ${adminName}</b> — 🎟 <b>Tickets:</b> ${assignedList}`;

    try {
      await ctx.editMessageCaption(newCaption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });
    } catch (e) {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    }

    // 10. Notify buyer via Telegram in their saved language
    const buyerUser = await getUserById(transaction.user_id);
    if (buyerUser && buyerUser.telegram_id) {
      const buyerLang = buyerUser.language || 'en';
      const strings = botStrings[buyerLang] || botStrings.en;
      const numbersList = ticketNumbers.map((n) => `#${n}`).join(', ');

      const buyerMsg = typeof strings.paymentApproved === 'function'
        ? strings.paymentApproved(numbersList)
        : `🎉 Payment confirmed! Your ticket numbers: ${numbersList}`;

      try {
        await bot.telegram.sendMessage(buyerUser.telegram_id, buyerMsg, { parse_mode: 'HTML' });
      } catch (err) {
        console.error(`Failed to send approval message to user ${buyerUser.telegram_id}:`, err);
      }
    }

    // 11. Answer callback
    return ctx.answerCbQuery('Transaction approved ✅');
  } catch (error) {
    console.error('Approval error:', error);
    return ctx.answerCbQuery('Error processing approval ❌', { show_alert: true });
  }
});

// bot.action reject handler
bot.action(/^reject_(\d+)$/, async (ctx) => {
  const transactionId = ctx.match[1];
  const adminName = ctx.from.first_name || 'Admin';

  try {
    // Get transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return ctx.answerCbQuery('Transaction not found ❌', { show_alert: true });
    }

    // Check if already processed
    if (transaction.status !== 'pending') {
      return ctx.answerCbQuery(`Already processed (${transaction.status})`, { show_alert: true });
    }

    // Mark rejected
    await rejectTransaction(transactionId, ctx.from.id);

    // Edit admin message
    const existingCaption = ctx.callbackQuery.message?.caption || '';
    const newCaption = `${existingCaption}\n\n❌ <b>Rejected by ${adminName}</b>`;

    try {
      await ctx.editMessageCaption(newCaption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });
    } catch (e) {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    }

    // Notify buyer in their saved language
    const buyerUser = await getUserById(transaction.user_id);
    if (buyerUser && buyerUser.telegram_id) {
      const buyerLang = buyerUser.language || 'en';
      const strings = botStrings[buyerLang] || botStrings.en;

      const buyerMsg = strings.paymentRejected;

      try {
        await bot.telegram.sendMessage(buyerUser.telegram_id, buyerMsg, { parse_mode: 'HTML' });
      } catch (err) {
        console.error(`Failed to send rejection message to user ${buyerUser.telegram_id}:`, err);
      }
    }

    // Answer callback
    return ctx.answerCbQuery('Transaction rejected ❌');
  } catch (error) {
    console.error('Rejection error:', error);
    return ctx.answerCbQuery('Error processing rejection ❌', { show_alert: true });
  }
});

export default bot;
