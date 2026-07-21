import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav style={styles.container}>
      <NavLink to="/" style={({ isActive }) => (isActive ? { ...styles.tab, ...styles.activeTab } : styles.tab)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </NavLink>

      <NavLink to="/tickets" style={({ isActive }) => (isActive ? { ...styles.tab, ...styles.activeTab } : styles.tab)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
          <path d="M13 5v2"/>
          <path d="M13 11v2"/>
          <path d="M13 17v2"/>
        </svg>
        <span>My Tickets</span>
      </NavLink>

      <NavLink to="/profile" style={({ isActive }) => (isActive ? { ...styles.tab, ...styles.activeTab } : styles.tab)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    height: '65px',
    background: 'rgba(18, 23, 34, 0.94)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.75rem',
    fontWeight: '600',
    flex: 1,
    transition: 'color 0.2s ease',
  },
  activeTab: {
    color: '#6366f1',
  },
};
