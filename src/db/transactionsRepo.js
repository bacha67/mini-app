import pool from './pool.js';

/**
 * Create a new pending transaction
 * @param {number|string} userId
 * @param {number|string} drawId
 * @param {number} quantity
 * @param {number} amount
 * @returns {Promise<object>} Created transaction row
 */
export async function createTransaction(userId, drawId, quantity, amount) {
  const query = `
    INSERT INTO transactions (user_id, draw_id, quantity, amount, status)
    VALUES ($1, $2, $3, $4, 'pending')
    RETURNING *
  `;
  const res = await pool.query(query, [userId, drawId, quantity, amount]);
  return res.rows[0];
}

/**
 * Attach screenshot Telegram file ID to a transaction
 * @param {number|string} transactionId
 * @param {string} fileId
 * @returns {Promise<object|null>} Updated transaction row
 */
export async function attachScreenshot(transactionId, fileId) {
  const query = `
    UPDATE transactions
    SET screenshot_file_id = $1
    WHERE id = $2
    RETURNING *
  `;
  const res = await pool.query(query, [fileId, transactionId]);
  return res.rows[0] || null;
}

/**
 * Get a single transaction by ID
 * @param {number|string} transactionId
 * @returns {Promise<object|null>} Transaction row or null
 */
export async function getTransactionById(transactionId) {
  const query = 'SELECT * FROM transactions WHERE id = $1';
  const res = await pool.query(query, [transactionId]);
  return res.rows[0] || null;
}

/**
 * Approve a transaction and store assigned ticket IDs
 * @param {number|string} transactionId
 * @param {Array|string} ticketIds Array of ticket IDs or JSON string
 * @param {number|string} adminId
 * @returns {Promise<object|null>} Updated transaction row
 */
export async function approveTransaction(transactionId, ticketIds, adminId) {
  const ticketIdsStr = typeof ticketIds === 'string' ? ticketIds : JSON.stringify(ticketIds);
  const query = `
    UPDATE transactions
    SET status = 'approved', ticket_ids = $1, admin_id = $2, reviewed_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const res = await pool.query(query, [ticketIdsStr, adminId, transactionId]);
  return res.rows[0] || null;
}

/**
 * Reject a transaction
 * @param {number|string} transactionId
 * @param {number|string} adminId
 * @returns {Promise<object|null>} Updated transaction row
 */
export async function rejectTransaction(transactionId, adminId) {
  const query = `
    UPDATE transactions
    SET status = 'rejected', admin_id = $1, reviewed_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  const res = await pool.query(query, [adminId, transactionId]);
  return res.rows[0] || null;
}
