-- Convert skills column from text[] to jsonb safely
ALTER TABLE "users" ALTER COLUMN "skills" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "skills" SET DATA TYPE jsonb USING to_jsonb("skills");
-- Ensure default
ALTER TABLE "users" ALTER COLUMN "skills" SET DEFAULT '[]'::jsonb;