import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

export default function Profile() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Abebe Bikila',
    username: 'abebe_b',
    language_code: 'en',
  };

  const [stats, setStats] = useState({ ticketCount: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiClient.get(`/users/${user.id}/stats`);
        setStats(res.data || { ticketCount: 0, totalSpent: 0 });
      } catch (err) {
        console.error('Failed to load user stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user.id]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Profile 👤</h2>

      <div className="glass-card" style={styles.profileCard}>
        <div style={styles.avatar}>
          {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
        </div>
        <h3 style={styles.name}>{user.first_name}</h3>
        {user.username && <span style={styles.handle}>@{user.username}</span>}

        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{loading ? '...' : stats.ticketCount}</span>
            <span style={styles.statLbl}>Tickets Purchased</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statVal}>{loading ? '...' : stats.totalSpent}</span>
            <span style={styles.statLbl}>ETB Spent</span>
          </div>
        </div>
      </div>

      {/* Live TikTok & Location Info Card */}
      <div className="glass-card" style={styles.noticeCard}>
        <div style={styles.noticeHeader}>
          <span style={{ fontSize: '1.4rem' }}>🎥</span>
          <span style={styles.noticeTitle}>Live TikTok Draws</span>
        </div>
        <p style={styles.noticeText}>
          Winners are announced LIVE on TikTok! Follow our channel to watch the live draw.
        </p>
        <div style={styles.noticeFooter}>
          📍 <span>Prefer to collect in person? Visit us in Fiche.</span>
        </div>
      </div>

      {/* Profile System Metadata Card */}
      <div className="glass-card" style={styles.infoCard}>
        <div style={styles.infoRow}>
          <span>Telegram ID</span>
          <strong>{user.id}</strong>
        </div>
        <div style={styles.infoRow}>
          <span>Language</span>
          <strong>{user.language_code || 'en'}</strong>
        </div>
        <div style={styles.infoRow}>
          <span>Bot Connected</span>
          <strong style={{ color: '#10b981' }}>Active ✅</strong>
        </div>
      </div>
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
  profileCard: {
    padding: '24px 16px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: '#fff',
    fontSize: '1.8rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
  },
  name: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '2px',
  },
  handle: {
    fontSize: '0.85rem',
    color: '#818cf8',
    fontWeight: '600',
    display: 'block',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statVal: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#818cf8',
  },
  statLbl: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noticeCard: {
    padding: '16px',
    marginBottom: '16px',
    borderLeft: '4px solid #6366f1',
  },
  noticeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  noticeTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#f8fafc',
  },
  noticeText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    marginBottom: '10px',
    lineHeight: '1.4',
  },
  noticeFooter: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#818cf8',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '8px 10px',
    borderRadius: '8px',
  },
  infoCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#cbd5e1',
  },
};
