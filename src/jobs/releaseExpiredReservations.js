import pool from '../db/pool.js';

/**
 * Release abandoned ticket reservations older than 20 minutes back to 'available',
 * excluding transactions actively awaiting admin review (screenshot_file_id IS NOT NULL & status = 'pending').
 */
export async function releaseExpiredReservations() {
  try {
    const query = `
      UPDATE tickets t
      SET status = 'available', user_id = NULL, reserved_at = NULL
      WHERE t.status = 'reserved'
        AND t.reserved_at < NOW() - INTERVAL '20 minutes'
        AND NOT EXISTS (
          SELECT 1 FROM transactions tr
          WHERE tr.reserved_ticket_ids LIKE '%' || t.id::text || '%'
            AND tr.screenshot_file_id IS NOT NULL
            AND tr.status = 'pending'
        )
      RETURNING t.id, t.ticket_number
    `;
    const res = await pool.query(query);
    if (res.rows.length > 0) {
      console.log(`🧹 Released ${res.rows.length} abandoned ticket reservation(s).`);
    }
  } catch (err) {
    console.error('Error releasing expired reservations:', err);
  }
}
