import React from 'react';
import { useNavigate } from 'react-router-dom';
import Countdown from './Countdown.jsx';

export default function DrawCard({ draw, isFeatured = false }) {
  const navigate = useNavigate();

  const progress = Math.min(
    100,
    Math.round((draw.tickets_sold / draw.total_tickets) * 100)
  );

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        ...styles.card,
        ...(isFeatured ? styles.featuredCard : {}),
      }}
      onClick={() => navigate(`/draw/${draw.id}`)}
    >
      <div style={styles.header}>
        <div style={styles.badge}>
          <span style={styles.badgeDot}></span> LIVE DRAW
        </div>
        <Countdown targetDate={draw.end_time} />
      </div>

      <div style={styles.imageContainer}>
        {draw.image_url ? (
          <img src={draw.image_url} alt={draw.title} style={styles.image} />
        ) : (
          <div style={styles.imagePlaceholder}>
            <span style={{ fontSize: '3.5rem' }}>🎟️</span>
          </div>
        )}
      </div>

      <div style={styles.body}>
        <h3 style={styles.title}>{draw.title}</h3>
        <p style={styles.description}>
          {draw.description || 'Enter for a chance to win this exclusive reward!'}
        </p>

        <div style={styles.statsRow}>
          <div>
            <span style={styles.statLabel}>Price / Ticket</span>
            <div style={styles.priceVal}>{draw.ticket_price} ETB</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={styles.statLabel}>Tickets Remaining</span>
            <div style={styles.ticketVal}>
              {draw.total_tickets - draw.tickets_sold} / {draw.total_tickets}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>

        <button className="gradient-btn" style={styles.buyBtn}>
          Enter Now • {draw.ticket_price} ETB
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    overflow: 'hidden',
    cursor: 'pointer',
    marginBottom: '18px',
  },
  featuredCard: {
    border: '1px solid rgba(99, 102, 241, 0.4)',
    boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.25)',
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  imageContainer: {
    width: '100%',
    height: '160px',
    overflow: 'hidden',
    position: 'relative',
    background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '16px',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '4px',
  },
  description: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '14px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceVal: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#818cf8',
  },
  ticketVal: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  buyBtn: {
    width: '100%',
  },
};
