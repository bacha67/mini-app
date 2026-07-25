import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';
import Countdown from '../components/Countdown.jsx';
import NumberGrid from '../components/NumberGrid.jsx';

import { useLanguage } from '../i18n/useLanguage.jsx';

export default function DrawDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [draw, setDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [soldTickets, setSoldTickets] = useState([]);
  const [purchaseMode, setPurchaseMode] = useState('quick_pick'); // 'quick_pick' | 'choose_numbers'
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDrawDetails = async () => {
    try {
      const [drawRes, ticketsRes] = await Promise.all([
        apiClient.get(`/draws/${id}`),
        apiClient.get(`/draws/${id}/tickets`),
      ]);
      setDraw(drawRes.data);
      setSoldTickets(ticketsRes.data.soldTicketNumbers || []);
    } catch (err) {
      console.error('Failed to load draw details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawDetails();
  }, [id]);

  const handleSelectNumber = (num) => {
    if (purchaseMode !== 'choose_numbers') return;
    setErrorMessage('');

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length >= quantity) {
        // Replace oldest or keep max quantity
        setSelectedNumbers((prev) => [...prev.slice(1), num]);
      } else {
        setSelectedNumbers((prev) => [...prev, num]);
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading draw details...</p>
      </div>
    );
  }

  if (!draw) {
    return (
      <div style={styles.errorContainer}>
        <h3>{t('noDrawFound')}</h3>
        <button className="gradient-btn" onClick={() => navigate('/')}>
          {t('back')}
        </button>
      </div>
    );
  }

  const totalPrice = draw.ticket_price * quantity;
  const remainingTickets = draw.total_tickets - draw.tickets_sold;
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Abebe Bikila',
  };

  const handleCheckout = async () => {
    setErrorMessage('');

    if (purchaseMode === 'choose_numbers') {
      if (selectedNumbers.length === 0) {
        setErrorMessage('Please select your ticket number(s) from the grid below.');
        return;
      }

      setReserving(true);
      try {
        const res = await apiClient.post('/checkout/reserve', {
          telegramId: user.id,
          drawId: draw.id,
          ticketNumbers: selectedNumbers,
        });

        const createdTransaction = res.data;

        // Reserve success -> proceed to checkout
        navigate('/checkout', {
          state: {
            transaction: createdTransaction,
            drawId: draw.id,
            drawTitle: draw.title,
            ticketPrice: draw.ticket_price,
            quantity: selectedNumbers.length,
            totalPrice: draw.ticket_price * selectedNumbers.length,
            selectedNumbers,
          },
        });
      } catch (err) {
        console.error('Reservation error:', err);
        const unavailable = err.response?.data?.unavailable || err.response?.data?.unavailableNumbers;
        if (unavailable && unavailable.length > 0) {
          setErrorMessage(`Ticket(s) #${unavailable.join(', #')} were just taken! Please select available numbers.`);
          await fetchDrawDetails();
          setSelectedNumbers((prev) => prev.filter((n) => !unavailable.includes(n)));
        } else {
          setErrorMessage(err.response?.data?.error || 'Failed to reserve selected numbers. Please try again.');
        }
      } finally {
        setReserving(false);
      }
    } else {
      // Quick Pick Mode
      navigate('/checkout', {
        state: {
          drawId: draw.id,
          drawTitle: draw.title,
          ticketPrice: draw.ticket_price,
          quantity,
          totalPrice,
        },
      });
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation */}
      <button style={styles.backBtn} onClick={() => navigate('/')}>
        {t('back')}
      </button>

      {/* Image Banner */}
      <div className="glass-card" style={styles.banner}>
        <div style={styles.bannerHeader}>
          <span style={styles.liveBadge}>{t('liveDraw')}</span>
          <Countdown targetDate={draw.end_time} />
        </div>
        <div style={styles.imageBox}>
          {draw.image_url ? (
            <img src={draw.image_url} alt={draw.title} style={styles.image} />
          ) : (
            <span style={{ fontSize: '4rem' }}>🎟️</span>
          )}
        </div>
      </div>

      {/* Draw Title & Info */}
      <div style={styles.section}>
        <h2 style={styles.title}>{draw.title}</h2>
        <p style={styles.desc}>{draw.description || 'Exclusive giveaway contest.'}</p>
      </div>

      {/* Mode Selector Tabs */}
      <div style={styles.modeTabs}>
        <button
          style={purchaseMode === 'quick_pick' ? { ...styles.modeTab, ...styles.activeModeTab } : styles.modeTab}
          onClick={() => {
            setPurchaseMode('quick_pick');
            setErrorMessage('');
          }}
        >
          {t('quickPick')}
        </button>
        <button
          style={purchaseMode === 'choose_numbers' ? { ...styles.modeTab, ...styles.activeModeTab } : styles.modeTab}
          onClick={() => {
            setPurchaseMode('choose_numbers');
            setErrorMessage('');
          }}
        >
          {t('chooseYourNumbers')}
        </button>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div style={styles.errorAlert}>
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Ticket Grid Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>
            {purchaseMode === 'choose_numbers'
              ? t('selectTicketNumbers', { quantity }) + ` (${selectedNumbers.length}/${quantity})`
              : t('availableTicketPool')}
          </span>
          <span style={styles.remainingTag}>{remainingTickets} {t('left')}</span>
        </div>
        <NumberGrid
          totalTickets={draw.total_tickets}
          soldTickets={soldTickets}
          selectedNumbers={selectedNumbers}
          onSelect={handleSelectNumber}
        />
      </div>

      {/* Quantity Controls */}
      <div className="glass-card" style={styles.qtyBox}>
        <span style={styles.qtyLabel}>{t('selectQuantity')}</span>
        <div style={styles.counter}>
          <button
            style={styles.counterBtn}
            onClick={() => {
              setQuantity((q) => {
                const newQ = Math.max(1, q - 1);
                if (selectedNumbers.length > newQ) {
                  setSelectedNumbers((prev) => prev.slice(0, newQ));
                }
                return newQ;
              });
            }}
          >
            -
          </button>
          <span style={styles.qtyVal}>{quantity}</span>
          <button
            style={styles.counterBtn}
            onClick={() => setQuantity((q) => Math.min(remainingTickets, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={styles.stickyFooter}>
        <div>
          <span style={styles.totalLabel}>{t('totalPrice')}</span>
          <div style={styles.totalVal}>{totalPrice} ETB</div>
        </div>
        <button
          className="gradient-btn"
          style={styles.checkoutBtn}
          onClick={handleCheckout}
          disabled={reserving}
        >
          {reserving ? t('reserving') : t('proceedToCheckout')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 16px 175px 16px',
  },
  loadingContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  errorContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  banner: {
    overflow: 'hidden',
    marginBottom: '20px',
  },
  bannerHeader: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  imageBox: {
    height: '180px',
    background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  section: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '6px',
  },
  desc: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  modeTabs: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '16px',
  },
  modeTab: {
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
  activeModeTab: {
    background: '#6366f1',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  remainingTag: {
    fontSize: '0.75rem',
    color: '#818cf8',
    fontWeight: '700',
  },
  qtyBox: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  qtyLabel: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '4px 8px',
  },
  counterBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    fontSize: '1.2rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  qtyVal: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#fff',
    minWidth: '24px',
    textAlign: 'center',
  },
  stickyFooter: {
    position: 'fixed',
    bottom: '65px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    padding: '14px 20px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
  },
  totalLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalVal: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#818cf8',
  },
  checkoutBtn: {
    padding: '12px 20px',
    fontSize: '0.95rem',
  },
};
