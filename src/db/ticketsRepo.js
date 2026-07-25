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

/**
 * Get all ticket numbers that are NOT available (sold, reserved, etc.)
 * @param {number|string} drawId
 * @returns {Promise<number[]>} Array of ticket_number values
 */
export async function getUnavailableTicketNumbers(drawId) {
  const query = `
    SELECT ticket_number
    FROM tickets
    WHERE draw_id = $1 AND status != 'available'
  `;
  const res = await pool.query(query, [drawId]);
  return res.rows.map((r) => r.ticket_number);
}

/**
 * Get active/sold tickets assigned to a specific user grouped with draw details
 * @param {number|string} userId
 * @returns {Promise<Array>} List of user tickets with draw info
 */
export async function getUserTickets(userId) {
  const query = `
    SELECT t.*, d.title AS draw_title
    FROM tickets t
    LEFT JOIN draws d ON d.id = t.draw_id
    WHERE t.user_id = $1 AND t.status = 'sold'
    ORDER BY t.purchased_at DESC
  `;
  const res = await pool.query(query, [userId]);
  return res.rows;
}

/**
 * Check if specific ticket numbers for a draw are available
 * @param {number|string} drawId
 * @param {Array<number>} ticketNumbers
 * @returns {Promise<{success: boolean, unavailableNumbers?: number[]}>}
 */
export async function reserveSpecificTickets(drawId, ticketNumbers) {
  if (!ticketNumbers || ticketNumbers.length === 0) {
    return { success: true };
  }

  const query = `
    SELECT ticket_number
    FROM tickets
    WHERE draw_id = $1 AND ticket_number = ANY($2::int[]) AND status != 'available'
  `;
  const res = await pool.query(query, [drawId, ticketNumbers]);

  if (res.rows.length > 0) {
    const unavailableNumbers = res.rows.map((r) => r.ticket_number);
    return { success: false, unavailableNumbers };
  }

  return { success: true };
}

/**
 * Atomically reserve specific ticket numbers for a user
 * @param {number|string} drawId
 * @param {Array<number>} ticketNumbers
 * @param {number|string} userId
 * @returns {Promise<Array>} List of reserved ticket rows ({ id, ticket_number })
 */
export async function reserveTickets(drawId, ticketNumbers, userId) {
  if (!ticketNumbers || ticketNumbers.length === 0) return [];

  const query = `
    UPDATE tickets
    SET status = 'reserved', user_id = $1, reserved_at = NOW()
    WHERE draw_id = $2 AND ticket_number = ANY($3::int[]) AND status = 'available'
    RETURNING id, ticket_number
  `;
  const res = await pool.query(query, [userId, drawId, ticketNumbers]);
  return res.rows;
}

/**
 * Get total number of active/sold tickets owned by a user
 * @param {number|string} userId
 * @returns {Promise<number>} Count of sold tickets
 */
export async function getUserTicketCount(userId) {
  const query = `
    SELECT COUNT(*) AS count
    FROM tickets
    WHERE user_id = $1 AND status = 'sold'
  `;
  const res = await pool.query(query, [userId]);
  return parseInt(res.rows[0].count, 10) || 0;
}
