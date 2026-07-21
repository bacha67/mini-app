import React from 'react';

export default function NumberGrid({ totalTickets = 100, soldTickets = [], selectedNumbers = [], onSelect }) {
  const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);

  return (
    <div style={styles.grid}>
      {numbers.map((num) => {
        const isSold = soldTickets.includes(num);
        const isSelected = selectedNumbers.includes(num);

        let style = styles.item;
        if (isSold) style = { ...style, ...styles.sold };
        else if (isSelected) style = { ...style, ...styles.selected };

        return (
          <button
            key={num}
            disabled={isSold}
            style={style}
            onClick={() => onSelect && onSelect(num)}
          >
            #{num}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
    gap: '8px',
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  item: {
    padding: '10px 4px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  selected: {
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderColor: 'transparent',
    color: '#fff',
    transform: 'scale(1.05)',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)',
  },
  sold: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'transparent',
    color: '#475569',
    cursor: 'not-allowed',
    textDecoration: 'line-through',
  },
};
