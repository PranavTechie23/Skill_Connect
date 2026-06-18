-- AI observability: operational event log for assistant and future AI features.
-- Do not store prompt text, resume text, or generated content here.
CREATE TABLE IF NOT EXISTS ai_events (
  id serial PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  provider text,
  model text,
  status text NOT NULL,
  latency_ms integer,
  error_code text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_events_feature_created_at
  ON ai_events(feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_events_user_created_at
  ON ai_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_events_status_created_at
  ON ai_events(status, created_at DESC);
