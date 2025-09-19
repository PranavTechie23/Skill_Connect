-- Enable cryptographic helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional UUID extension
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example roles (RBAC scaffold)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN;
  END IF;
END$$;

-- Transfer ownership of public schema to admin role
ALTER SCHEMA public OWNER TO app_admin;

-- Baseline privileges for app_user (tighten later)
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Enable RLS on key tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS experiences ENABLE ROW LEVEL SECURITY;

-- Read policies (permissive baseline)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='users_read_all'
  ) THEN
    CREATE POLICY users_read_all ON users FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='companies_read_all'
  ) THEN
    CREATE POLICY companies_read_all ON companies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='jobs' AND policyname='jobs_read_all'
  ) THEN
    CREATE POLICY jobs_read_all ON jobs FOR SELECT USING (is_active IS TRUE OR is_active IS NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applications' AND policyname='applications_read_all'
  ) THEN
    CREATE POLICY applications_read_all ON applications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_read_all'
  ) THEN
    CREATE POLICY messages_read_all ON messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='experiences' AND policyname='experiences_read_all'
  ) THEN
    CREATE POLICY experiences_read_all ON experiences FOR SELECT USING (true);
  END IF;
END$$;

-- For strict per-user access, set a session variable from the API:
--   SELECT set_config('app.user_id', '<uuid>', true);
-- And use USING (current_setting('app.user_id', true) = id)
