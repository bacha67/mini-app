import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach X-Telegram-Id header on every request
apiClient.interceptors.request.use(
  (config) => {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (telegramId) {
      config.headers['X-Telegram-Id'] = telegramId;
    } else {
      console.warn('⚠️ Telegram user ID unavailable (running outside Telegram environment)');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
