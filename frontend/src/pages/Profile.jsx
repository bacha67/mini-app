export default function Profile() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Abebe Bikila',
    username: 'abebe_b',
    language_code: 'en',
  };

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
            <span style={styles.statVal}>2</span>
            <span style={styles.statLbl}>Tickets</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statVal}>0</span>
            <span style={styles.statLbl}>Wins</span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statVal}>100</span>
            <span style={styles.statLbl}>ETB Spent</span>
          </div>
        </div>
      </div>

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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  statVal: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLbl: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
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
