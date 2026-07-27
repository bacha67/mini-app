import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client.js';

import { useLanguage } from '../i18n/useLanguage.jsx';

const BANKS = [
  { id: 'cbe', name: 'CBE (Commercial Bank of Ethiopia)', account: '1000071226787', owner: 'Ararso Abdissa Yadeta' },
  { id: 'telebirr', name: 'Telebirr', account: '0928282840', owner: 'Ararso Abdissa Yadeta' },
  { id: 'dashen', name: 'Dashen Bank', account: '509988776655', owner: 'Ararso Abdissa Yadeta' },
  { id: 'boa', name: 'Bank of Abyssinia', account: '887766554433', owner: 'Ararso Abdissa Yadeta' },
];

export default function Checkout() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Abebe Bikila',
  };

  const [step, setStep] = useState(1);
  const [buyerName, setBuyerName] = useState(user.first_name || '');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS[0].name);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState(state.transaction || null);
  const [file, setFile] = useState(null);

  const drawId = state.drawId || 1;
  const quantity = state.quantity || 1;
  const totalPrice = state.totalPrice || 50;

  // Step 1 -> Step 2 (Quick Pick or Reserved Checkout)
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiClient.post('/checkout/quick-pick', {
        telegramId: user.id,
        drawId,
        quantity,
        buyerName,
        buyerPhone,
        bankSelected: selectedBank,
        transactionId: transaction?.id,
      });

      setTransaction(res.data);
      setStep(2);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to initialize transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3 (Screenshot Upload)
  const handleUploadScreenshot = async (e) => {
    e.preventDefault();
    if (!file || !transaction) {
      alert('Please select a payment screenshot image.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', file);

      await apiClient.post(`/checkout/${transaction.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStep(3);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload screenshot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeBankObj = BANKS.find((b) => b.name === selectedBank) || BANKS[0];

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          {t('back')}
        </button>
        <span style={styles.stepTitle}>{t('stepProgress', { step })}</span>
      </div>

      {/* Step Progress Bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressBar, width: `${(step / 3) * 100}%` }} />
      </div>

      {/* STEP 1: Buyer Info & Bank Selection */}
      {step === 1 && (
        <form className="glass-card animate-fade-in" style={styles.card} onSubmit={handleProceedToPayment}>
          <h3 style={styles.heading}>{t('orderSummary')}</h3>

          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>{t('itemLabel')}</span>
              <strong>{state.drawTitle || 'Lottery Ticket'}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>{t('quantityLabel')}</span>
              <strong>{quantity} Tickets</strong>
            </div>
            <div style={{ ...styles.summaryRow, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
              <span>{t('totalAmountLabel')}</span>
              <strong style={{ color: '#818cf8', fontSize: '1.1rem' }}>{totalPrice} ETB</strong>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('yourName')}</label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={t('enterYourName')}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('phoneNumber')}</label>
            <input
              type="tel"
              required
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="+2519..."
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('selectBank')}</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={styles.select}
            >
              {BANKS.map((b) => (
                <option key={b.id} value={b.name} style={{ background: '#1e293b' }}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="gradient-btn" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? t('processing') : t('proceedToPayment')}
          </button>
        </form>
      )}

      {/* STEP 2: Transfer Instructions */}
      {step === 2 && (
        <div className="glass-card animate-fade-in" style={styles.card}>
          <h3 style={styles.heading}>{t('makeTransfer')}</h3>
          <p style={styles.subtext}>{t('transferInstruction')}</p>

          <div style={styles.bankCard}>
            <div style={styles.bankName}>{activeBankObj.name}</div>
            <div style={styles.accountNo}>{activeBankObj.account}</div>
            <div style={styles.accountOwner}>{t('accountName')} {activeBankObj.owner}</div>
            <div style={styles.amountNotice}>{t('transferAmount')} {totalPrice} ETB</div>
          </div>

          <form onSubmit={handleUploadScreenshot} style={{ marginTop: '20px' }}>
            <label style={styles.label}>{t('uploadReceiptLabel')}</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              required
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.fileInput}
            />

            <button type="submit" className="gradient-btn" disabled={loading || !file} style={{ width: '100%', marginTop: '16px' }}>
              {loading ? t('uploadingReceipt') : t('submitReceiptBtn')}
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: Confirmation */}
      {step === 3 && (
        <div className="glass-card animate-fade-in" style={{ ...styles.card, textAlign: 'center', padding: '40px 20px' }}>
          <span style={{ fontSize: '4rem' }}>🎉</span>
          <h2 style={{ fontSize: '1.5rem', margin: '14px 0 6px 0', color: '#fff' }}>{t('receiptSubmittedTitle')}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
            {t('receiptSubmittedNotice', { id: transaction?.id })}
          </p>

          <button className="gradient-btn" onClick={() => navigate('/tickets')} style={{ width: '100%' }}>
            {t('viewMyTicketsBtn')}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 16px 85px 16px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  stepTitle: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#818cf8',
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '2px',
    marginBottom: '20px',
  },
  progressBar: {
    height: '100%',
    background: '#6366f1',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  card: {
    padding: '20px',
  },
  heading: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '14px',
  },
  subtext: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  summaryBox: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.88rem',
    color: '#cbd5e1',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  bankCard: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '16px',
  },
  bankName: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: '6px',
  },
  accountNo: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: '1px',
    fontFamily: 'monospace',
    marginBottom: '4px',
  },
  accountOwner: {
    fontSize: '0.8rem',
    color: '#cbd5e1',
    marginBottom: '10px',
  },
  amountNotice: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#f59e0b',
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
};
