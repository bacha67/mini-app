import pool from '../db/pool.js';

/**
 * Release ticket reservations older than 1 hour back to 'available'
 */
export async function releaseExpiredReservations() {
  try {
    const query = `
      UPDATE tickets
      SET status = 'available', user_id = NULL, reserved_at = NULL
      WHERE status = 'reserved' AND reserved_at < NOW() - INTERVAL '1 hour'
      RETURNING id, ticket_number
    `;
    const res = await pool.query(query);
    if (res.rows.length > 0) {
      console.log(`🧹 Released ${res.rows.length} expired ticket reservation(s).`);
    }
  } catch (err) {
    console.error('Error releasing expired reservations:', err);
  }
}
