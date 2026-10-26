-- ==============================================================================
-- Minimal stand-in for the parts of Supabase the migrations rely on, so the
-- migrations and supabase/tests/rls.sql can be checked on a plain local Postgres.
--
-- NEVER run this on a Supabase project: Supabase already provides these objects.
--
--   createdb vitalnex_rls_check
--   psql -d vitalnex_rls_check -f supabase/tests/local_supabase_stub.sql
--   psql -d vitalnex_rls_check -f supabase/migrations/<each file, in order>
--   psql -d vitalnex_rls_check -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
-- ==============================================================================

-- Roles are cluster-wide, so they may exist from an earlier run.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET search_path = public, extensions', current_database()); END $$;
SET search_path = public, extensions;

CREATE SCHEMA auth;
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb
);

-- Same claim lookup as Supabase's auth.uid() / auth.role().
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT NULLIF(
        COALESCE(
            NULLIF(current_setting('request.jwt.claim.sub', TRUE), ''),
            NULLIF(current_setting('request.jwt.claims', TRUE), '')::jsonb ->> 'sub'
        ), ''
    )::UUID;
$$;
CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', TRUE), ''),
        NULLIF(current_setting('request.jwt.claims', TRUE), '')::jsonb ->> 'role'
    );
$$;

GRANT USAGE ON SCHEMA public, auth, extensions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.role() TO anon, authenticated, service_role;
-- Supabase grants table privileges to the API roles and relies on RLS to restrict rows.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
