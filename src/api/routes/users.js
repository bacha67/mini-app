import { Router } from 'express';
import { getUserByTelegramId } from '../../db/usersRepo.js';
import { getPendingTransactionsForUser } from '../../db/transactionsRepo.js';
import { getUserTickets } from '../../db/ticketsRepo.js';

const router = Router();

// GET /api/users/:telegramId/pending -> Get pending transactions for a user
router.get('/:telegramId/pending', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      return res.json([]);
    }

    const pendingTransactions = await getPendingTransactionsForUser(user.id);
    res.json(pendingTransactions);
  } catch (error) {
    console.error(`Error fetching pending transactions for user ${req.params.telegramId}:`, error);
    res.status(500).json({ error: 'Failed to fetch pending transactions' });
  }
});

// GET /api/users/:telegramId/tickets -> Get active/purchased tickets for a user
router.get('/:telegramId/tickets', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      return res.json([]);
    }

    const tickets = await getUserTickets(user.id);
    res.json(tickets);
  } catch (error) {
    console.error(`Error fetching tickets for user ${req.params.telegramId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user tickets' });
  }
});

export default router;
