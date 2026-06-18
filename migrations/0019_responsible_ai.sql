ALTER TABLE "users" ADD COLUMN "privacy_settings" jsonb DEFAULT '{"aiOptOut": false}'::jsonb;

CREATE TABLE IF NOT EXISTS "ai_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text REFERENCES "users"("id") ON DELETE set null,
	"feature" text NOT NULL,
	"rating" text NOT NULL,
	"feedback_text" text,
	"prompt_snippet" text,
	"created_at" timestamp DEFAULT now()
);
