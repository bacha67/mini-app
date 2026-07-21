import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bot from '../bot.js';
import drawsRouter from './routes/draws.js';
import checkoutRouter from './routes/checkout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. CRITICAL: Register Telegraf webhook callback FIRST before express.json()
// This ensures Telegraf receives the unparsed, raw request stream from Telegram
if (process.env.BOT_TOKEN) {
  const webhookPath = `/telegraf/${process.env.BOT_TOKEN}`;
  app.use(bot.webhookCallback(webhookPath));
}

// 2. Middleware to parse JSON and URL-encoded bodies for API routes
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

// CORS middleware for WebApp API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/draws', drawsRouter);
app.use('/api/checkout', checkoutRouter);

// Serve built React frontend static files
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));

// Fallback for SPA client-side React routing (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
