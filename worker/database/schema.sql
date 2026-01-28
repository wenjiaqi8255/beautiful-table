-- Beautiful Table D1 Database Schema
-- Migrated to Better Auth authentication system

-- Drop existing tables (starting fresh)
DROP TABLE IF EXISTS usage_logs;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS oauth_accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS passwords;
DROP TABLE IF EXISTS users;

-- Better Auth Core Tables
-- Note: Better Auth uses singular table names by default
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE NOT NULL,
  image TEXT,
  credits INTEGER NOT NULL DEFAULT 10,
  totalPurchased INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt INTEGER,
  password TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  updatedAt INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Application-specific Tables
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  operation TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Indexes for performance
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_session_user_id ON session(userId);
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_account_user_id ON account(userId);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
