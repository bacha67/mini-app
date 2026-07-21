import React, { useState, useEffect } from 'react';

export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (num) => String(num).padStart(2, '0');

  return (
    <div style={styles.box}>
      <span style={styles.label}>ENDS IN</span>
      <div style={styles.timer}>
        <div style={styles.unit}><span style={styles.val}>{format(timeLeft.hours)}</span><span style={styles.unitLbl}>H</span></div>
        <span>:</span>
        <div style={styles.unit}><span style={styles.val}>{format(timeLeft.minutes)}</span><span style={styles.unitLbl}>M</span></div>
        <span>:</span>
        <div style={styles.unit}><span style={styles.val}>{format(timeLeft.seconds)}</span><span style={styles.unitLbl}>S</span></div>
      </div>
    </div>
  );
}

const styles = {
  box: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '4px 10px',
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: '0.5px',
  },
  timer: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  unit: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1px',
  },
  val: {
    color: '#818cf8',
    fontVariantNumeric: 'tabular-nums',
  },
  unitLbl: {
    fontSize: '0.6rem',
    color: '#64748b',
  },
};
