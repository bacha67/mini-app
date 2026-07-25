import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

export default function Tickets() {
  const [activeTab, setActiveTab] = useState('purchased');
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789;

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [pendingRes, ticketsRes] = await Promise.all([
          apiClient.get(`/users/${telegramId}/pending`),
          apiClient.get(`/users/${telegramId}/tickets`),
        ]);

        setPendingTransactions(pendingRes.data || []);
        setActiveTickets(ticketsRes.data || []);
      } catch (err) {
        console.error('Failed to load user tickets/transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [telegramId]);

  // Group active tickets by draw
  const groupedTickets = activeTickets.reduce((acc, ticket) => {
    const drawName = ticket.draw_title || `Draw #${ticket.draw_id}`;
    if (!acc[drawName]) {
      acc[drawName] = [];
    }
    acc[drawName].push(ticket.ticket_number);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Tickets 🎟️</h2>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'purchased' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('purchased')}
        >
          Active Tickets
        </button>
        <button
          style={activeTab === 'pending' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({pendingTransactions.length})
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <p>Loading your tickets...</p>
        </div>
      ) : activeTab === 'purchased' ? (
        Object.keys(groupedTickets).length === 0 ? (
          <div className="glass-card" style={styles.emptyCard}>
            <span style={{ fontSize: '2.5rem' }}>🎟️</span>
            <h4 style={{ margin: '8px 0 4px 0', color: '#fff' }}>No active tickets yet</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Participate in active draws to get your lucky tickets!
            </p>
          </div>
        ) : (
          Object.entries(groupedTickets).map(([drawTitle, numbers]) => (
            <div key={drawTitle} className="glass-card" style={styles.card}>
              <div style={styles.ticketHeader}>
                <span style={styles.drawName}>{drawTitle}</span>
                <span style={styles.statusBadge}>ACTIVE</span>
              </div>
              <div style={styles.ticketBody}>
                <span style={styles.ticketLabel}>Assigned Ticket Numbers:</span>
                <div style={styles.numbersGrid}>
                  {numbers.map((num) => (
                    <span key={num} style={styles.ticketPill}>
                      #{num}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )
      ) : pendingTransactions.length === 0 ? (
        <div className="glass-card" style={styles.emptyCard}>
          <span style={{ fontSize: '2.5rem' }}>⏳</span>
          <h4 style={{ margin: '8px 0 4px 0', color: '#fff' }}>No pending orders</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            When you purchase tickets, your pending receipts will show here while admin verifies your payment.
          </p>
        </div>
      ) : (
        pendingTransactions.map((tx) => (
          <div key={tx.id} className="glass-card" style={styles.card}>
            <div style={styles.ticketHeader}>
              <span style={styles.drawName}>{tx.draw_title || `Draw #${tx.draw_id}`}</span>
              <span style={styles.pendingBadge}>PENDING REVIEW ⏳</span>
            </div>
            <div style={styles.pendingBody}>
              <div style={styles.pendingRow}>
                <span>Order Ref:</span>
                <strong>#{tx.id}</strong>
              </div>
              <div style={styles.pendingRow}>
                <span>Quantity:</span>
                <strong>{tx.quantity} Tickets</strong>
              </div>
              <div style={styles.pendingRow}>
                <span>Total Amount:</span>
                <strong style={{ color: '#818cf8' }}>{tx.amount} ETB</strong>
              </div>
              {tx.bank_selected && (
                <div style={styles.pendingRow}>
                  <span>Bank:</span>
                  <strong>{tx.bank_selected}</strong>
                </div>
              )}
              <div style={styles.pendingRow}>
                <span>Submitted:</span>
                <small style={{ color: '#94a3b8' }}>{new Date(tx.created_at).toLocaleString()}</small>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 16px 85px 16px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '16px',
  },
  tabContainer: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: '0.85rem',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: '#6366f1',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  loadingContainer: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  card: {
    padding: '16px',
    marginBottom: '14px',
  },
  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  drawName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  pendingBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.15)',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  ticketBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  ticketLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  numbersGrid: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  ticketPill: {
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.9rem',
    padding: '6px 14px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
  },
  pendingBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.88rem',
    color: '#cbd5e1',
  },
  pendingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
};
