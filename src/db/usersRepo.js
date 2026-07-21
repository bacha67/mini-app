import pool from './pool.js';

/**
 * Get a user row by telegram_id
 * @param {number|string} telegramId
 * @returns {Promise<object|null>} User row or null if not found
 */
export async function getUserByTelegramId(telegramId) {
  const query = 'SELECT * FROM users WHERE telegram_id = $1';
  const res = await pool.query(query, [telegramId]);
  return res.rows[0] || null;
}

/**
 * Create a new user with telegram_id and first_name
 * @param {number|string} telegramId
 * @param {string} firstName
 * @returns {Promise<object>} The created user row
 */
export async function createUser(telegramId, firstName) {
  const query = `
    INSERT INTO users (telegram_id, first_name)
    VALUES ($1, $2)
    RETURNING *
  `;
  const res = await pool.query(query, [telegramId, firstName]);
  return res.rows[0];
}

/**
 * Update phone column for a user by telegram_id
 * @param {number|string} telegramId
 * @param {string} phone
 * @returns {Promise<object|null>} The updated user row
 */
export async function updateUserPhone(telegramId, phone) {
  const query = `
    UPDATE users
    SET phone = $1
    WHERE telegram_id = $2
    RETURNING *
  `;
  const res = await pool.query(query, [phone, telegramId]);
  return res.rows[0] || null;
}
