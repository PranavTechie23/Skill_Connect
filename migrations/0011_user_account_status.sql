-- Governance: account_status for admin moderation (active, pending, suspended, flagged)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
