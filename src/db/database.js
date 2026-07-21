import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'lottery.db');

const db = new Database(dbPath);

// Enable WAL (Write-Ahead Logging) mode for better performance
db.pragma('journal_mode = WAL');

// Create users table on startup if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    phone TEXT,
    first_name TEXT,
    language TEXT DEFAULT 'en',
    balance INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
