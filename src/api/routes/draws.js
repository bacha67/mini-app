import { Router } from 'express';
import { getOpenDraws, getDrawById } from '../../db/drawsRepo.js';

const router = Router();

// GET /api/draws -> Get all open draws
router.get('/', async (req, res) => {
  try {
    const draws = await getOpenDraws();
    res.json(draws);
  } catch (error) {
    console.error('Error fetching open draws:', error);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

// GET /api/draws/:id -> Get a single draw by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const draw = await getDrawById(id);

    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    res.json(draw);
  } catch (error) {
    console.error(`Error fetching draw ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch draw' });
  }
});

export default router;
