import pool from './pool.js';

/**
 * Get all active/open draws ordered by creation date descending
 * @returns {Promise<Array>} List of open draw rows
 */
export async function getOpenDraws() {
  const query = `
    SELECT * 
    FROM draws 
    WHERE status = 'open' 
    ORDER BY created_at DESC
  `;
  const res = await pool.query(query);
  return res.rows;
}

/**
 * Get a single draw by its ID
 * @param {number|string} drawId
 * @returns {Promise<object|null>} Draw row or null if not found
 */
export async function getDrawById(drawId) {
  const query = 'SELECT * FROM draws WHERE id = $1';
  const res = await pool.query(query, [drawId]);
  return res.rows[0] || null;
}

/**
 * Increment tickets_sold for a draw by quantity
 * @param {number|string} drawId
 * @param {number} quantity
 * @returns {Promise<object|null>} Updated draw row
 */
export async function incrementTicketsSold(drawId, quantity) {
  const query = `
    UPDATE draws
    SET tickets_sold = tickets_sold + $1
    WHERE id = $2
    RETURNING *
  `;
  const res = await pool.query(query, [quantity, drawId]);
  return res.rows[0] || null;
}
