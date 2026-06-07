-- Company moderation status for admin (approved, pending, rejected, suspended, blocked)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

UPDATE companies
SET status = CASE
  WHEN owner_id IS NULL THEN 'pending'
  ELSE 'approved'
END
WHERE status IS NULL OR status = 'approved';

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
