-- Phase 6: Admin AI Governance — moderation_records and audit_logs

CREATE TABLE IF NOT EXISTS moderation_records (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,           -- 'job' | 'company' | 'story' | 'application'
  entity_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,            -- 'low' | 'medium' | 'high'
  flags TEXT[] DEFAULT '{}',
  reasoning TEXT NOT NULL,
  suggested_action TEXT NOT NULL,      -- 'approve' | 'reject' | 'suspend' | 'flag_for_review' | 'none'
  scan_status TEXT NOT NULL DEFAULT 'scanned', -- 'scanned' | 'scan_failed'
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mod_entity ON moderation_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mod_risk ON moderation_records(risk_level) WHERE risk_level IN ('medium', 'high');
CREATE INDEX IF NOT EXISTS idx_mod_created_at ON moderation_records(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                -- 'approved' | 'rejected' | 'suspended' | 'flagged'
  target_type TEXT NOT NULL,           -- 'job' | 'company' | 'story' | 'application'
  target_id TEXT NOT NULL,
  admin_reason TEXT,                   -- free-text reason from admin
  ai_risk_level TEXT,                  -- copied from moderation_records at decision time
  ai_suggested TEXT,                   -- copied suggestedAction
  ai_reasoning TEXT,                   -- copied reasoning
  ai_followed BOOLEAN,                -- computed at insert time; null = advisory/excluded
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
