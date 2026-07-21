import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Tickets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('purchased');

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
          Pending Approval
        </button>
      </div>

      {/* Content */}
      {activeTab === 'purchased' ? (
        <div className="glass-card" style={styles.card}>
          <div style={styles.ticketHeader}>
            <span style={styles.drawName}>iPhone 16 Pro Mega Draw</span>
            <span style={styles.statusBadge}>ACTIVE</span>
          </div>
          <div style={styles.ticketBody}>
            <span style={styles.ticketLabel}>Assigned Ticket Numbers:</span>
            <div style={styles.numbersGrid}>
              <span style={styles.ticketPill}>#14</span>
              <span style={styles.ticketPill}>#87</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={styles.emptyCard}>
          <span style={{ fontSize: '2.5rem' }}>⏳</span>
          <h4 style={{ margin: '8px 0 4px 0', color: '#fff' }}>No pending orders</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            When you purchase tickets, your pending receipts will show here while admin verifies your payment.
          </p>
        </div>
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
  emptyCard: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
};
