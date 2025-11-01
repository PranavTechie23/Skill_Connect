CREATE TABLE "stories" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "author_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "submitter_name" TEXT,
  "submitter_email" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on author_id for faster lookups
CREATE INDEX idx_stories_author_id ON stories(author_id);