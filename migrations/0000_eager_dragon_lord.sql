CREATE TABLE "applications" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"job_id" TEXT,
	"applicant_id" TEXT,
	"status" TEXT DEFAULT 'applied' NOT NULL,
	"cover_letter" TEXT,
	"resume" TEXT,
	"notes" TEXT,
	"applied_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "companies" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT,
	"website" TEXT,
	"location" TEXT,
	"size" TEXT,
	"industry" TEXT,
	"logo" TEXT,
	"owner_id" TEXT,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "experiences" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"user_id" TEXT,
	"title" TEXT NOT NULL,
	"company" TEXT NOT NULL,
	"description" TEXT,
	"start_date" TEXT NOT NULL,
	"end_date" TEXT,
	"is_current" BOOLEAN DEFAULT 0
);

CREATE TABLE "jobs" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"title" TEXT NOT NULL,
	"description" TEXT NOT NULL,
	"requirements" TEXT NOT NULL,
	"location" TEXT NOT NULL,
	"job_type" TEXT NOT NULL,
	"salary_min" INTEGER,
	"salary_max" INTEGER,
	"skills" TEXT DEFAULT '[]', -- store JSON array as string
	"company_id" TEXT,
	"employer_id" TEXT,
	"is_active" BOOLEAN DEFAULT 1,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "messages" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"sender_id" TEXT,
	"receiver_id" TEXT,
	"application_id" TEXT,
	"content" TEXT NOT NULL,
	"is_read" BOOLEAN DEFAULT 0,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "users" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"email" TEXT NOT NULL UNIQUE,
	"password" TEXT NOT NULL,
	"first_name" TEXT NOT NULL,
	"last_name" TEXT NOT NULL,
	"user_type" TEXT NOT NULL,
	"location" TEXT,
	"profile_photo" TEXT,
	"title" TEXT,
	"bio" TEXT,
	"skills" TEXT DEFAULT '[]', -- store JSON array as string
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign keys (no schema prefix in SQLite)
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "messages" ADD CONSTRAINT "messages_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
