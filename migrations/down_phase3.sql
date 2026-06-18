-- Rollback Phase 3 changes
ALTER TABLE jobs DROP COLUMN IF EXISTS embedding;
ALTER TABLE professional_profiles DROP COLUMN IF EXISTS embedding;
DROP TABLE IF EXISTS recommendation_feedback;
DROP TABLE IF EXISTS match_explanations;
