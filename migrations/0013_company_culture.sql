ALTER TABLE companies ADD COLUMN IF NOT EXISTS culture jsonb DEFAULT '{"tags":[],"benefits":[]}'::jsonb;
