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

// bot.start(ctx) handler
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

  // Remove reply keyboard and send Open App message
  await ctx.reply('Phone number saved! ✅', Markup.removeKeyboard());
  return sendOpenAppMessage(ctx, updatedUser);
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

    // 4 & 5. Get random available tickets
    const tickets = await getRandomAvailableTickets(transaction.draw_id, transaction.quantity);
    if (!tickets || tickets.length < transaction.quantity) {
      return ctx.answerCbQuery('Not enough tickets available! ⚠️', { show_alert: true });
    }

    const ticketIds = tickets.map((t) => t.id);
    const ticketNumbers = tickets.map((t) => t.ticket_number);

    // 6. Assign tickets to user
    await assignTicketsToUser(ticketIds, transaction.user_id);

    // 7. Update transaction to approved
    await approveTransaction(transactionId, ticketIds, ctx.from.id);

    // 8. Increment tickets_sold for draw
    await incrementTicketsSold(transaction.draw_id, transaction.quantity);

    // 9. Edit admin message caption and remove inline buttons
    const existingCaption = ctx.callbackQuery.message?.caption || '';
    const newCaption = `${existingCaption}\n\n✅ <b>Approved by ${adminName}</b>`;

    try {
      await ctx.editMessageCaption(newCaption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });
    } catch (e) {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    }

    // 10. Notify buyer via Telegram
    const buyerUser = await getUserById(transaction.user_id);
    if (buyerUser && buyerUser.telegram_id) {
      const draw = await getDrawById(transaction.draw_id);
      const drawTitle = draw ? draw.title : `Draw #${transaction.draw_id}`;
      const numbersList = ticketNumbers.join(', ');

      const buyerMsg = `
🎉 <b>Payment Approved!</b>

Your payment for <b>${drawTitle}</b> has been confirmed.
🎟 <b>Tickets Assigned (${tickets.length}):</b> #${numbersList}

Good luck! 🍀
      `.trim();

      try {
        await bot.telegram.sendMessage(buyerUser.telegram_id, buyerMsg, { parse_mode: 'HTML' });
      } catch (err) {
        console.error(`Failed to send approval message to user ${buyerUser.telegram_id}:`, err);
      }
    }

    // 11. Answer callback
    return ctx.answerCbQuery('Transaction approved ✅');
  } catch (error) {
    console.error(`Error approving transaction ${transactionId}:`, error);
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

    // Notify buyer
    const buyerUser = await getUserById(transaction.user_id);
    if (buyerUser && buyerUser.telegram_id) {
      const draw = await getDrawById(transaction.draw_id);
      const drawTitle = draw ? draw.title : `Draw #${transaction.draw_id}`;

      const buyerMsg = `
❌ <b>Payment Rejected</b>

Your payment for <b>${drawTitle}</b> could not be verified.
If you believe this is an error, please contact support.
      `.trim();

      try {
        await bot.telegram.sendMessage(buyerUser.telegram_id, buyerMsg, { parse_mode: 'HTML' });
      } catch (err) {
        console.error(`Failed to send rejection message to user ${buyerUser.telegram_id}:`, err);
      }
    }

    // Answer callback
    return ctx.answerCbQuery('Transaction rejected ❌');
  } catch (error) {
    console.error(`Error rejecting transaction ${transactionId}:`, error);
    return ctx.answerCbQuery('Error processing rejection ❌', { show_alert: true });
  }
});

export default bot;
