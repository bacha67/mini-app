import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import { translations } from './translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 123456789;
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserLanguage() {
      try {
        const res = await apiClient.get(`/users/${telegramId}/language`);
        if (res.data?.language && translations[res.data.language]) {
          setLanguage(res.data.language);
        }
      } catch (err) {
        console.error('Failed to fetch user language preference:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserLanguage();
  }, [telegramId]);

  /**
   * Translate a key with optional dynamic template variables
   * @param {string} key
   * @param {Record<string, string|number>} [params]
   * @returns {string}
   */
  const t = (key, params = {}) => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || key;

    if (typeof text === 'string' && params && typeof params === 'object') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
