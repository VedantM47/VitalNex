-- ==============================================================================
-- VITALNEX RLS proof (docs/SPEC.md §2.1). Everything runs in one transaction and
-- is rolled back, so it leaves no data behind.
--
-- Supabase: paste into the SQL editor and run, or psql with the project connection string.
-- Local:    see supabase/tests/local_supabase_stub.sql.
--
-- Any failed check raises an exception that starts with "RLS FAIL".
-- Success ends with the row: rls_result = 'all RLS checks passed'.
-- ==============================================================================

BEGIN;

-- ---- Fixtures (run as the owner, i.e. not subject to RLS) -------------------
-- Users created through auth.users get a 'patient' profile from the signup trigger.
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    ('00000000-0000-4000-a000-00000000000a', 'rls.patient.a@test.invalid', '{"full_name": "RLS Patient A", "role": "admin"}'),
    ('00000000-0000-4000-a000-00000000000b', 'rls.patient.b@test.invalid', '{"full_name": "RLS Patient B"}'),
    ('00000000-0000-4000-a000-00000000000d', 'rls.doctor@test.invalid',    '{"full_name": "RLS Doctor"}'),
    ('00000000-0000-4000-a000-0000000000ad', 'rls.admin@test.invalid',     '{"full_name": "RLS Admin"}');

DO $$
BEGIN
    -- Signup must ignore a role smuggled into user metadata (patient A asked for admin).
    IF (SELECT role FROM profiles WHERE id = '00000000-0000-4000-a000-00000000000a') <> 'patient' THEN
        RAISE EXCEPTION 'RLS FAIL: signup trigger took the role from user metadata';
    END IF;
END $$;

UPDATE profiles SET role = 'doctor' WHERE id = '00000000-0000-4000-a000-00000000000d';
UPDATE profiles SET role = 'admin'  WHERE id = '00000000-0000-4000-a000-0000000000ad';

DO $$
BEGIN
    IF (SELECT raw_app_meta_data ->> 'role' FROM auth.users
        WHERE id = '00000000-0000-4000-a000-00000000000d') <> 'doctor' THEN
        RAISE EXCEPTION 'RLS FAIL: profiles.role was not mirrored into app_metadata';
    END IF;
END $$;

-- A shares with clinicians; B does not.
INSERT INTO consents (user_id, purpose, granted, granted_at) VALUES
    ('00000000-0000-4000-a000-00000000000a', 'assessment_processing', TRUE, NOW()),
    ('00000000-0000-4000-a000-00000000000a', 'share_with_clinician',  TRUE, NOW()),
    ('00000000-0000-4000-a000-00000000000b', 'assessment_processing', TRUE, NOW()),
    ('00000000-0000-4000-a000-00000000000b', 'share_with_clinician',  FALSE, NULL);

INSERT INTO risk_assessments (id, user_id, inputs, results, next_step, model_versions) VALUES
    ('00000000-0000-4000-b000-00000000000a', '00000000-0000-4000-a000-00000000000a', '{}', '{}', 'routine_checkup', '{}'),
    ('00000000-0000-4000-b000-00000000000b', '00000000-0000-4000-a000-00000000000b', '{}', '{}', 'see_doctor_soon', '{}');

INSERT INTO review_queue (assessment_id, patient_id, reasons) VALUES
    ('00000000-0000-4000-b000-00000000000a', '00000000-0000-4000-a000-00000000000a', ARRAY['high_band']),
    ('00000000-0000-4000-b000-00000000000b', '00000000-0000-4000-a000-00000000000b', ARRAY['high_band']);

INSERT INTO share_tokens (token_hash, user_id, scope, expires_at) VALUES
    (encode(digest('rls-token-b', 'sha256'), 'hex'), '00000000-0000-4000-a000-00000000000b',
     '{"sections": ["latest_results"]}', NOW() + INTERVAL '1 hour');

-- ---- Patient A ---------------------------------------------------------------
SELECT set_config('request.jwt.claims',
    '{"sub": "00000000-0000-4000-a000-00000000000a", "role": "authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
    a CONSTANT UUID := '00000000-0000-4000-a000-00000000000a';
    b CONSTANT UUID := '00000000-0000-4000-a000-00000000000b';
BEGIN
    IF (SELECT count(*) FROM risk_assessments WHERE user_id = b) <> 0
       OR EXISTS (SELECT 1 FROM risk_assessments WHERE id = '00000000-0000-4000-b000-00000000000b') THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read patient B''s assessment';
    END IF;
    IF (SELECT count(*) FROM risk_assessments WHERE user_id = a) <> 1 THEN
        RAISE EXCEPTION 'RLS FAIL: patient A cannot read their own assessment';
    END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE id = b) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read patient B''s profile';
    END IF;
    IF EXISTS (SELECT 1 FROM consents WHERE user_id = b) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read patient B''s consents';
    END IF;
    IF EXISTS (SELECT 1 FROM review_queue WHERE patient_id = b) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read patient B''s review item';
    END IF;
    IF EXISTS (SELECT 1 FROM share_tokens WHERE user_id = b) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read patient B''s share tokens';
    END IF;
    IF EXISTS (SELECT 1 FROM audit_logs WHERE user_id IS DISTINCT FROM a) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A can read other people''s audit entries';
    END IF;

    -- Writing into someone else's data has no effect.
    UPDATE consents SET granted = TRUE, granted_at = NOW() WHERE user_id = b;
    UPDATE profiles SET full_name = 'hijacked' WHERE id = b;

    -- A patient must not write their own assessment results.
    BEGIN
        INSERT INTO risk_assessments (user_id, inputs, results, next_step, model_versions)
        VALUES (a, '{}', '{}', 'routine_checkup', '{}');
        RAISE EXCEPTION 'RLS FAIL: patient could insert an assessment';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- A patient must not promote themselves.
    BEGIN
        UPDATE profiles SET role = 'admin' WHERE id = a;
        RAISE EXCEPTION 'RLS FAIL: patient could change their own role';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- Share tokens are resolved server-side only.
    BEGIN
        PERFORM resolve_share_token('rls-token-b');
        RAISE EXCEPTION 'RLS FAIL: authenticated user could call resolve_share_token';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

RESET ROLE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM consents WHERE user_id = '00000000-0000-4000-a000-00000000000b'
                   AND purpose = 'share_with_clinician' AND NOT granted) THEN
        RAISE EXCEPTION 'RLS FAIL: patient A changed patient B''s consent';
    END IF;
    IF (SELECT full_name FROM profiles WHERE id = '00000000-0000-4000-a000-00000000000b') <> 'RLS Patient B' THEN
        RAISE EXCEPTION 'RLS FAIL: patient A changed patient B''s profile';
    END IF;
END $$;

-- ---- Clinician -----------------------------------------------------------------
SELECT set_config('request.jwt.claims',
    '{"sub": "00000000-0000-4000-a000-00000000000d", "role": "authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
    IF (SELECT count(*) FROM risk_assessments WHERE user_id = '00000000-0000-4000-a000-00000000000a') <> 1 THEN
        RAISE EXCEPTION 'RLS FAIL: clinician cannot read a consented patient''s assessment';
    END IF;
    IF EXISTS (SELECT 1 FROM risk_assessments WHERE user_id = '00000000-0000-4000-a000-00000000000b') THEN
        RAISE EXCEPTION 'RLS FAIL: clinician can read a non-consented patient''s assessment';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-4000-a000-00000000000a') THEN
        RAISE EXCEPTION 'RLS FAIL: clinician cannot read a consented patient''s profile';
    END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-4000-a000-00000000000b') THEN
        RAISE EXCEPTION 'RLS FAIL: clinician can read a non-consented patient''s profile';
    END IF;
    IF (SELECT count(*) FROM review_queue) <> 1 THEN
        RAISE EXCEPTION 'RLS FAIL: clinician review queue is not limited to consented patients';
    END IF;
    IF EXISTS (SELECT 1 FROM audit_logs) THEN
        RAISE EXCEPTION 'RLS FAIL: clinician can read the audit log';
    END IF;
END $$;

RESET ROLE;

-- Withdrawing consent removes clinician access immediately.
UPDATE consents SET granted = FALSE, withdrawn_at = NOW()
    WHERE user_id = '00000000-0000-4000-a000-00000000000a' AND purpose = 'share_with_clinician';

SET LOCAL ROLE authenticated;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM risk_assessments WHERE user_id = '00000000-0000-4000-a000-00000000000a') THEN
        RAISE EXCEPTION 'RLS FAIL: clinician still sees a patient after consent was withdrawn';
    END IF;
END $$;
RESET ROLE;

-- ---- Admin ---------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
    '{"sub": "00000000-0000-4000-a000-0000000000ad", "role": "authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'CONSENT_WITHDRAWN') THEN
        RAISE EXCEPTION 'RLS FAIL: admin cannot read the audit log (or consent withdrawal was not audited)';
    END IF;
    IF EXISTS (SELECT 1 FROM risk_assessments) OR EXISTS (SELECT 1 FROM profiles WHERE role = 'patient') THEN
        RAISE EXCEPTION 'RLS FAIL: admin can read patient rows (admins get aggregates only)';
    END IF;
END $$;

RESET ROLE;

-- ---- Anonymous -----------------------------------------------------------------
SELECT set_config('request.jwt.claims', '{"role": "anon"}', TRUE);
SET LOCAL ROLE anon;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM share_tokens) OR EXISTS (SELECT 1 FROM consents)
       OR EXISTS (SELECT 1 FROM risk_assessments) THEN
        RAISE EXCEPTION 'RLS FAIL: anonymous user can read private tables';
    END IF;
END $$;

RESET ROLE;

-- ---- Share owner may only revoke (migration 20261028000001) --------------------
SELECT set_config('request.jwt.claims',
    '{"sub": "00000000-0000-4000-a000-00000000000b", "role": "authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
    BEGIN
        UPDATE share_tokens SET expires_at = NOW() + INTERVAL '1 year'
            WHERE user_id = '00000000-0000-4000-a000-00000000000b';
        RAISE EXCEPTION 'RLS FAIL: share owner could extend a share link';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
END $$;

RESET ROLE;

-- ---- Server-side share resolution ---------------------------------------------
DO $$
BEGIN
    IF resolve_share_token('rls-token-b') ->> 'status' <> 'valid' THEN
        RAISE EXCEPTION 'RLS FAIL: valid share token not resolved';
    END IF;
    IF resolve_share_token('wrong-token') ->> 'status' <> 'not_found' THEN
        RAISE EXCEPTION 'RLS FAIL: unknown share token resolved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'SHARE_OPENED') THEN
        RAISE EXCEPTION 'RLS FAIL: opening a share was not audited';
    END IF;
    UPDATE share_tokens SET revoked_at = NOW() WHERE user_id = '00000000-0000-4000-a000-00000000000b';
    IF resolve_share_token('rls-token-b') ->> 'status' <> 'revoked' THEN
        RAISE EXCEPTION 'RLS FAIL: revoked share token still resolves';
    END IF;
END $$;

SELECT 'all RLS checks passed' AS rls_result;

ROLLBACK;
