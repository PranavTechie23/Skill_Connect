-- Public stories list: filter approved + sort by created_at
CREATE INDEX IF NOT EXISTS idx_stories_approved_created_at
  ON stories (created_at DESC)
  WHERE approved = true;

-- Fallback for queries without partial index predicate
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at DESC);
