import { Router } from 'express';
import multer from 'multer';
import { Markup } from 'telegraf';
import bot from '../../bot.js';
import { getUserByTelegramId } from '../../db/usersRepo.js';
import { getDrawById } from '../../db/drawsRepo.js';
import { reserveTickets } from '../../db/ticketsRepo.js';
import {
  createTransaction,
  getTransactionById,
  attachScreenshot,
  setReservedTickets,
} from '../../db/transactionsRepo.js';

const router = Router();

// Configure Multer memory storage (10MB limit, png & jpeg only)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG images are allowed'));
    }
  },
});

// POST /api/checkout/reserve -> Atomically reserve specific ticket numbers and create transaction
router.post('/reserve', async (req, res) => {
  try {
    const { telegramId, drawId, ticketNumbers, selectedNumbers, buyerName, buyerPhone, bankSelected } = req.body;
    const numbers = ticketNumbers || selectedNumbers;

    if (!telegramId || !drawId || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({ error: 'telegramId, drawId, and ticketNumbers array are required' });
    }

    // 1. Look up user
    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Look up draw
    const draw = await getDrawById(drawId);
    if (!draw || draw.status !== 'open') {
      return res.status(404).json({ error: 'Draw not found or not open' });
    }

    // 3. Atomically reserve tickets
    const reservedRows = await reserveTickets(drawId, numbers, user.id);

    // 4. If fewer tickets reserved than requested
    if (reservedRows.length < numbers.length) {
      const reservedSet = new Set(reservedRows.map((r) => r.ticket_number));
      const unavailable = numbers.filter((n) => !reservedSet.has(n));

      return res.status(409).json({
        error: 'Some numbers were just taken',
        unavailable,
      });
    }

    // 5. Calculate amount and create transaction
    const amount = draw.ticket_price * numbers.length;
    const reservedTicketIds = reservedRows.map((r) => r.id);

    let transaction = await createTransaction(
      user.id,
      drawId,
      numbers.length,
      amount,
      buyerName,
      buyerPhone,
      bankSelected
    );

    transaction = await setReservedTickets(transaction.id, reservedTicketIds);

    // 6. Return transaction as JSON
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error reserving specific tickets:', error);
    res.status(500).json({ error: 'Failed to reserve tickets' });
  }
});

import pool from '../../db/pool.js';

// POST /api/checkout/quick-pick
router.post('/quick-pick', async (req, res) => {
  try {
    const { telegramId, drawId, quantity, buyerName, buyerPhone, bankSelected, transactionId } = req.body;

    if (transactionId) {
      const query = `
        UPDATE transactions
        SET buyer_name = $1, buyer_phone = $2, bank_selected = $3
        WHERE id = $4
        RETURNING *
      `;
      const resTx = await pool.query(query, [buyerName, buyerPhone, bankSelected, transactionId]);
      return res.json(resTx.rows[0]);
    }

    if (!telegramId || !drawId || !quantity) {
      return res.status(400).json({ error: 'telegramId, drawId, and quantity are required' });
    }

    // 1. Look up user via getUserByTelegramId
    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Look up draw via getDrawById
    const draw = await getDrawById(drawId);
    if (!draw || draw.status !== 'open') {
      return res.status(404).json({ error: 'Draw not found or not open' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // 3. Calculate amount
    const amount = draw.ticket_price * qty;

    // 4. Create transaction
    const transaction = await createTransaction(
      user.id,
      drawId,
      qty,
      amount,
      buyerName,
      buyerPhone,
      bankSelected
    );

    // 5. Return created transaction as JSON
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error in quick-pick checkout:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// POST /api/checkout/:transactionId/upload
router.post('/:transactionId/upload', (req, res) => {
  upload.single('screenshot')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { transactionId } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: 'Screenshot image file is required' });
      }

      // 1. Get transaction by ID
      const transaction = await getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Fetch draw title for the caption
      const draw = await getDrawById(transaction.draw_id);
      const drawTitle = draw ? draw.title : `Draw #${transaction.draw_id}`;

      const adminGroupId = process.env.ADMIN_GROUP_ID;
      if (!adminGroupId || adminGroupId === 'your_admin_group_id_here') {
        return res.status(500).json({ error: 'ADMIN_GROUP_ID is not configured in .env' });
      }

      // Check if transaction has reserved_ticket_ids
      let selectedTicketsLine = '';
      if (transaction.reserved_ticket_ids) {
        try {
          const reservedIds = typeof transaction.reserved_ticket_ids === 'string'
            ? JSON.parse(transaction.reserved_ticket_ids)
            : transaction.reserved_ticket_ids;

          if (Array.isArray(reservedIds) && reservedIds.length > 0) {
            const ticketRes = await pool.query(
              'SELECT ticket_number FROM tickets WHERE id = ANY($1::int[]) ORDER BY ticket_number ASC',
              [reservedIds]
            );
            const nums = ticketRes.rows.map((r) => `#${r.ticket_number}`).join(', ');
            selectedTicketsLine = `\n🎟 <b>Selected Tickets:</b> ${nums}`;
          }
        } catch (e) {
          console.error('Failed to parse reserved_ticket_ids for caption:', e);
        }
      }

      // Caption for the admin group message
      const caption = `
🧾 <b>New Payment Screenshot Uploaded</b>

🆔 <b>Transaction ID:</b> #${transaction.id}
👤 <b>Buyer Name:</b> ${transaction.buyer_name || 'N/A'}
📱 <b>Buyer Phone:</b> ${transaction.buyer_phone || 'N/A'}
🎰 <b>Draw Title:</b> ${drawTitle}
🎟 <b>Quantity:</b> ${transaction.quantity}${selectedTicketsLine}
💵 <b>Amount:</b> ${transaction.amount}
🏦 <b>Bank Selected:</b> ${transaction.bank_selected || 'N/A'}
      `.trim();

      // 2. Upload file buffer to Telegram bot sendPhoto
      const sentMessage = await bot.telegram.sendPhoto(
        adminGroupId,
        { source: req.file.buffer },
        {
          caption,
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Approve', `approve_${transaction.id}`),
              Markup.button.callback('❌ Reject', `reject_${transaction.id}`),
            ],
          ]),
        }
      );

      // Extract file_id from response
      const photos = sentMessage.photo;
      const fileId = photos[photos.length - 1].file_id;

      // 3. Save file_id in database
      await attachScreenshot(transaction.id, fileId);

      // 6. Return success
      res.json({ success: true, fileId });
    } catch (error) {
      console.error(`Error uploading screenshot for transaction ${req.params.transactionId}:`, error);
      res.status(500).json({ error: 'Failed to upload screenshot' });
    }
  });
});

export default router;
