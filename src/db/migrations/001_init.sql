-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);

-- 3. Draws Table
CREATE TABLE IF NOT EXISTS draws (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ticket_price INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER REFERENCES draws(id),
  ticket_number INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'available',
  purchased_at TIMESTAMP,
  UNIQUE(draw_id, ticket_number)
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  draw_id INTEGER REFERENCES draws(id),
  quantity INTEGER NOT NULL,
  ticket_ids TEXT,
  amount INTEGER NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  bank_selected TEXT,
  screenshot_file_id TEXT,
  status TEXT DEFAULT 'pending',
  admin_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
