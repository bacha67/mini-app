import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import DrawCard from '../components/DrawCard.jsx';
export default function Home() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    first_name: 'Lucky Player',
    username: 'tele_user',
  };

  useEffect(() => {
    async function fetchDraws() {
      try {
        const res = await apiClient.get('/draws');
        console.log('API /draws response:', res.data);
        setDraws(res.data || []);
      } catch (err) {
        console.error('Failed to load draws:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDraws();
  }, []);

  const featuredDraw = draws[0];
  const otherDraws = draws.slice(1);

  return (
    <div style={styles.container}>
      {/* User Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.greeting}>Welcome back 👋</span>
          <h2 style={styles.userName}>{user.first_name}</h2>
        </div>
        <div style={styles.pointsBadge}>
          <span>🪙</span>
          <span style={styles.pointsVal}>0 ETB</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="glass-card" style={styles.heroBanner}>
        <div>
          <span style={styles.heroBadge}>🔥 TOP PRIZE</span>
          <h3 style={styles.heroTitle}>Win Huge Rewards Today!</h3>
          <p style={styles.heroSub}>Choose your lucky numbers or use Quick Pick.</p>
        </div>
      </div>

      {/* Main Content */}
      <h3 style={styles.sectionTitle}>Active Draws 🎯</h3>

      {loading ? (
        <div style={styles.loadingState}>
          <p>Loading active draws...</p>
        </div>
      ) : draws.length === 0 ? (
        <div className="glass-card" style={styles.emptyState}>
          <span style={{ fontSize: '3rem' }}>🎰</span>
          <h4 style={{ margin: '10px 0 4px 0', color: '#fff' }}>No active draws right now</h4>
          <p>Check back soon for new giveaways!</p>
        </div>
      ) : (
        <div>
          {featuredDraw && <DrawCard draw={featuredDraw} isFeatured={true} />}
          {otherDraws.map((d) => (
            <DrawCard key={d.id} draw={d} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 16px 85px 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  greeting: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#f8fafc',
  },
  pointsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#818cf8',
  },
  pointsVal: {
    color: '#f8fafc',
  },
  heroBanner: {
    padding: '20px',
    marginBottom: '24px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  heroBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.15)',
    padding: '3px 8px',
    borderRadius: '10px',
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontSize: '1.3rem',
    fontWeight: '800',
    margin: '8px 0 4px 0',
    color: '#f8fafc',
  },
  heroSub: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '14px',
    color: '#f8fafc',
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#94a3b8',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
};
