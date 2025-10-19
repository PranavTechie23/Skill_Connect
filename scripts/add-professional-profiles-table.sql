-- Drop and recreate professional_profiles table with correct user_id type
DROP TABLE IF EXISTS "professional_profiles";

CREATE TABLE "professional_profiles" (
  "id" serial PRIMARY KEY,
  "user_id" character varying NOT NULL,
  "headline" text,
  "bio" text,
  "skills" jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT "professional_profiles_user_id_unique" UNIQUE("user_id")
);
