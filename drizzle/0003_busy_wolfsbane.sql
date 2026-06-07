CREATE TABLE "ai_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"feature" text NOT NULL,
	"provider" text,
	"model" text,
	"status" text NOT NULL,
	"latency_ms" integer,
	"error_code" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"link_tab" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resume_parses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resume_url" text NOT NULL,
	"extracted_text" text,
	"parse_status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"ai_model" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "experiences" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "submitter_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "submitter_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "cover_image" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "culture" jsonb DEFAULT '{"tags":[],"benefits":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "resume_url" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "resume_name" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "experience" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "education" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_parses" ADD CONSTRAINT "resume_parses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;