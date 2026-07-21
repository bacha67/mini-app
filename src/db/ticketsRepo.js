import pool from './pool.js';

/**
 * Bulk insert ticket_number 1 through totalTickets for a draw, status='available'
 * @param {number|string} drawId
 * @param {number} totalTickets
 * @returns {Promise<Array>} List of generated ticket rows
 */
export async function createTicketsForDraw(drawId, totalTickets) {
  const query = `
    INSERT INTO tickets (draw_id, ticket_number, status)
    SELECT $1, s.num, 'available'
    FROM generate_series(1, $2::integer) AS s(num)
    RETURNING *;
  `;
  const res = await pool.query(query, [drawId, totalTickets]);
  return res.rows;
}

/**
 * Select quantity random available tickets for a given draw
 * @param {number|string} drawId
 * @param {number} quantity
 * @returns {Promise<Array>} Random available ticket rows
 */
export async function getRandomAvailableTickets(drawId, quantity) {
  const query = `
    SELECT *
    FROM tickets
    WHERE draw_id = $1 AND status = 'available'
    ORDER BY RANDOM()
    LIMIT $2
  `;
  const res = await pool.query(query, [drawId, quantity]);
  return res.rows;
}

/**
 * Update tickets status to 'sold', set user_id and purchased_at
 * @param {Array<number>} ticketIds Array of ticket IDs
 * @param {number|string} userId
 * @returns {Promise<Array>} List of updated ticket rows
 */
export async function assignTicketsToUser(ticketIds, userId) {
  if (!ticketIds || ticketIds.length === 0) return [];

  const query = `
    UPDATE tickets
    SET status = 'sold', user_id = $1, purchased_at = NOW()
    WHERE id = ANY($2::int[])
    RETURNING *
  `;
  const res = await pool.query(query, [userId, ticketIds]);
  return res.rows;
}
