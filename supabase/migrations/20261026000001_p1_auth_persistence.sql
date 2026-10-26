-- ==============================================================================
-- VITALNEX Migration P1: Supabase auth, persistence, RLS (docs/SPEC.md §2.1, §2.2)
-- Version: 20261026000001
--
-- Applies on top of 20260927000001_initial_schema.sql (which is left unchanged).
-- Roles: 'doctor' is the clinician role. 'researcher' stays in the CHECK constraint
-- but is unused in the MVP. Nobody can pick their own role: signup always creates a
-- 'patient' profile, and only the service role (seed script) can change a role.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROLE + CONSENT HELPERS
-- SECURITY DEFINER so RLS policies can call them without recursing into the
-- policies on `profiles` / `consents`.
-- ------------------------------------------------------------------------------
COMMENT ON COLUMN profiles.role IS
    'patient | doctor (= clinician) | admin. researcher is reserved and unused in the MVP.';

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE(public.current_app_role() = 'admin', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_clinician()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT COALESCE(public.current_app_role() = 'doctor', FALSE);
$$;

-- ------------------------------------------------------------------------------
-- 2. CONSENTS (use existing table, reshape to SPEC §2.2 purposes)
-- ------------------------------------------------------------------------------
ALTER TABLE consents DROP CONSTRAINT IF EXISTS consents_consent_category_check;
ALTER TABLE consents RENAME COLUMN consent_category TO purpose;
ALTER TABLE consents RENAME COLUMN revoked_at TO withdrawn_at;
ALTER TABLE consents DROP COLUMN IF EXISTS granularity;
ALTER TABLE consents ADD COLUMN notice_version TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE consents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE consents ALTER COLUMN granted_at DROP NOT NULL;
ALTER TABLE consents ALTER COLUMN granted_at DROP DEFAULT;
-- Old categories (health_data, voice_data, ...) have no meaning in the MVP.
DELETE FROM consents
    WHERE purpose NOT IN ('assessment_processing', 'store_history', 'share_with_clinician', 'aggregate_audit');
ALTER TABLE consents ADD CONSTRAINT consents_purpose_check
    CHECK (purpose IN ('assessment_processing', 'store_history', 'share_with_clinician', 'aggregate_audit'));
ALTER TABLE consents ADD CONSTRAINT consents_granted_at_check
    CHECK (NOT granted OR granted_at IS NOT NULL);

CREATE TRIGGER update_consents_modtime
    BEFORE UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_consent(p_user UUID, p_purpose TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.consents
        WHERE user_id = p_user AND purpose = p_purpose AND granted AND withdrawn_at IS NULL
    );
$$;

-- A clinician may see a patient only while that patient's share_with_clinician consent is active.
CREATE OR REPLACE FUNCTION public.clinician_can_view(p_patient UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_clinician() AND public.has_consent(p_patient, 'share_with_clinician');
$$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES: created by trigger on signup, role protected, role mirrored to JWT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    lang TEXT := NEW.raw_user_meta_data ->> 'preferred_language';
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, preferred_language, is_demo)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(NEW.email, '@', 1)),
        'patient',  -- never taken from user-supplied metadata
        CASE WHEN lang IN ('en', 'hi', 'mr') THEN lang ELSE 'en' END,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users may edit their name / phone / language, never role, email, is_demo or id.
-- PostgREST runs user requests as the `authenticated` / `anon` database roles;
-- the service role and migrations are not restricted.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') AND (
        NEW.role IS DISTINCT FROM OLD.role
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
        OR NEW.id IS DISTINCT FROM OLD.id
    ) THEN
        RAISE EXCEPTION 'role, email, is_demo and id can only be changed by the server'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_columns
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Mirror profiles.role into auth app_metadata (not user-writable) so the web proxy can
-- do an optimistic route check from the JWT. profiles.role stays the source of truth.
CREATE OR REPLACE FUNCTION public.sync_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
    UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
        WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_profile_role
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth();

-- ------------------------------------------------------------------------------
-- 4. HEALTH PROFILE: no silent medical defaults (CLAUDE.md hard rule 3)
-- ------------------------------------------------------------------------------
ALTER TABLE health_profiles ADD COLUMN answers JSONB NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN health_profiles.answers IS
    'Saved form answers. A missing key means the user did not answer; never fill it in.';

-- Income-like data is not collected (CLAUDE.md hard rule 10, D-6); it also had an
-- invented default of 'Middle'.
ALTER TABLE health_context DROP COLUMN IF EXISTS socioeconomic_band;

ALTER TABLE health_conditions
    ALTER COLUMN trestbps DROP DEFAULT,
    ALTER COLUMN chol DROP DEFAULT,
    ALTER COLUMN fbs DROP DEFAULT,
    ALTER COLUMN restecg DROP DEFAULT,
    ALTER COLUMN thalach DROP DEFAULT,
    ALTER COLUMN exang DROP DEFAULT,
    ALTER COLUMN oldpeak DROP DEFAULT,
    ALTER COLUMN slope DROP DEFAULT,
    ALTER COLUMN ca DROP DEFAULT,
    ALTER COLUMN thal DROP DEFAULT,
    ALTER COLUMN cp DROP DEFAULT,
    ALTER COLUMN diabetes DROP DEFAULT,
    ALTER COLUMN hypertension DROP DEFAULT;

-- ------------------------------------------------------------------------------
-- 5. RISK ASSESSMENTS (SPEC §2.1): one row = one form, three diseases
-- ------------------------------------------------------------------------------
ALTER TABLE risk_assessments
    DROP COLUMN IF EXISTS model_version_id,
    DROP COLUMN IF EXISTS risk_score,
    DROP COLUMN IF EXISTS risk_band,
    DROP COLUMN IF EXISTS confidence_interval_low,
    DROP COLUMN IF EXISTS confidence_interval_high,
    DROP COLUMN IF EXISTS calibration_status,
    DROP COLUMN IF EXISTS human_review_required,
    DROP COLUMN IF EXISTS human_review_status,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS doctor_review_notes;

ALTER TABLE risk_assessments DROP CONSTRAINT IF EXISTS risk_assessments_assessment_mode_check;
ALTER TABLE risk_assessments ALTER COLUMN assessment_mode SET DEFAULT 'live';
UPDATE risk_assessments SET assessment_mode = 'live' WHERE assessment_mode <> 'demo';
ALTER TABLE risk_assessments ADD CONSTRAINT risk_assessments_assessment_mode_check
    CHECK (assessment_mode IN ('live', 'demo'));
COMMENT ON COLUMN risk_assessments.assessment_mode IS
    'live = run by the user; demo = generated for a demo account by running the real models.';

ALTER TABLE risk_assessments
    ADD COLUMN inputs JSONB NOT NULL,
    ADD COLUMN results JSONB NOT NULL,
    ADD COLUMN next_step TEXT NOT NULL CHECK (next_step IN (
        'emergency', 'correct_inputs', 'not_confident',
        'see_doctor_soon', 'discuss_next_checkup', 'routine_checkup'
    )),
    ADD COLUMN emergency_flag BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN review_status TEXT NOT NULL DEFAULT 'not_required'
        CHECK (review_status IN ('not_required', 'pending', 'agreed', 'overridden')),
    ADD COLUMN model_versions JSONB NOT NULL;

COMMENT ON COLUMN risk_assessments.results IS
    'Per disease: prob, band, conformal_set, abstained, top_factors.';
COMMENT ON COLUMN risk_assessments.model_versions IS
    'Per disease: model version and data_hash from ml/artifacts/<disease>/model_meta.json.';

-- ------------------------------------------------------------------------------
-- 6. REVIEW QUEUE (clinician work list)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL UNIQUE REFERENCES risk_assessments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reasons TEXT[] NOT NULL CHECK (
        cardinality(reasons) > 0
        AND reasons <@ ARRAY['high_band', 'abstained', 'data_quality', 'emergency']::TEXT[]
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'agreed', 'overridden')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    clinician_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status = 'pending' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TRIGGER update_review_queue_modtime
    BEFORE UPDATE ON review_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 7. CLINICIAN OVERRIDES (novelty 8). Append-only.
-- Never read by any training code (CLAUDE.md hard rule 9).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinician_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    disease TEXT NOT NULL CHECK (disease IN ('diabetes', 'heart', 'stroke')),
    model_band TEXT NOT NULL CHECK (model_band IN ('Low', 'Moderate', 'High', 'not_confident')),
    clinician_band TEXT NOT NULL CHECK (clinician_band IN ('Low', 'Moderate', 'High')),
    reason_code TEXT NOT NULL CHECK (reason_code IN (
        'clinical_history_not_captured', 'symptoms_present', 'input_likely_wrong',
        'model_overestimates', 'model_underestimates', 'other'
    )),
    note TEXT,
    clinician_id UUID NOT NULL REFERENCES profiles(id),
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (reason_code <> 'other' OR length(trim(COALESCE(note, ''))) > 0)
);
COMMENT ON TABLE clinician_overrides IS
    'Clinician override log. Must never be used to retrain models (CLAUDE.md hard rule 9).';

-- ------------------------------------------------------------------------------
-- 8. SHARE TOKENS + ACCESS LOG (novelty 9). Only the SHA-256 hash is stored.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS share_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scope JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS share_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES share_tokens(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accessor_role TEXT NOT NULL CHECK (accessor_role IN ('public', 'patient', 'doctor', 'admin'))
);

-- Server-side only (granted to service_role, not to anon/authenticated). Checks the
-- token, writes the access log, and returns what the share covers.
CREATE OR REPLACE FUNCTION public.resolve_share_token(p_token TEXT, p_accessor_role TEXT DEFAULT 'public')
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
    t public.share_tokens;
BEGIN
    SELECT * INTO t FROM public.share_tokens
        WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex');
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found');
    END IF;
    IF t.revoked_at IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'revoked');
    END IF;
    IF t.expires_at <= NOW() THEN
        RETURN jsonb_build_object('status', 'expired');
    END IF;
    INSERT INTO public.share_access_log (token_id, accessor_role) VALUES (t.id, p_accessor_role);
    RETURN jsonb_build_object(
        'status', 'valid',
        'token_id', t.id,
        'user_id', t.user_id,
        'scope', t.scope,
        'expires_at', t.expires_at
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. DATA REQUESTS (DPDP export / delete). Kept without identity after deletion.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('export', 'delete')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 10. ASSISTANT LOGS: safety audit only. There is deliberately no message column.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assistant_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    intent TEXT NOT NULL,
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    emergency_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE assistant_logs IS 'No message text is stored (SPEC §5 step 6).';

-- ------------------------------------------------------------------------------
-- 11. DOCTORS + SLOTS: concrete bookable slots (synthetic demo doctors)
-- ------------------------------------------------------------------------------
-- Ratings and review counts were invented defaults; a demo doctor has neither.
ALTER TABLE doctors ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE doctors ALTER COLUMN review_count DROP DEFAULT;
UPDATE doctors SET rating = NULL, review_count = NULL;
COMMENT ON COLUMN doctors.specialization IS 'doctor_specializations.code';

CREATE TABLE IF NOT EXISTS doctor_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    UNIQUE (doctor_id, starts_at),
    CHECK (ends_at > starts_at)
);

-- One active appointment per slot (cancelled appointments free the slot). A slot is
-- "booked" exactly when an active appointment points at it; there is no separate flag.
ALTER TABLE appointments ADD COLUMN slot_id UUID REFERENCES doctor_slots(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_appointment_per_slot
    ON appointments(slot_id) WHERE status <> 'cancelled';
-- No video consultation in the MVP; meeting links were fake.
ALTER TABLE appointments DROP COLUMN IF EXISTS meeting_link;
ALTER TABLE appointments ALTER COLUMN consultation_type SET DEFAULT 'in_person';

CREATE TRIGGER update_appointments_modtime
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 12. AUDIT TRIGGERS: every sensitive action writes audit_logs, whichever path
-- (API, service key or a user's own RLS-scoped request) made the change.
-- LOGIN is written by the API (POST /api/v1/me/login-event).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.write_audit(
    p_user UUID, p_action TEXT, p_resource_type TEXT, p_resource_id TEXT, p_metadata JSONB
) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user, p_action, p_resource_type, p_resource_id, COALESCE(p_metadata, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.audit_consent_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.granted IS NOT DISTINCT FROM OLD.granted THEN
        RETURN NEW;
    END IF;
    PERFORM public.write_audit(
        COALESCE(auth.uid(), NEW.user_id),
        CASE WHEN NEW.granted THEN 'CONSENT_GRANTED' ELSE 'CONSENT_WITHDRAWN' END,
        'consent', NEW.id::TEXT,
        jsonb_build_object('subject_user_id', NEW.user_id, 'purpose', NEW.purpose,
                           'notice_version', NEW.notice_version)
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_consents
    AFTER INSERT OR UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION public.audit_consent_change();

CREATE OR REPLACE FUNCTION public.audit_assessment_created()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public.write_audit(
        COALESCE(auth.uid(), NEW.user_id), 'ASSESSMENT_CREATED', 'risk_assessment', NEW.id::TEXT,
        jsonb_build_object('subject_user_id', NEW.user_id, 'mode', NEW.assessment_mode,
                           'next_step', NEW.next_step, 'emergency_flag', NEW.emergency_flag)
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_risk_assessments
    AFTER INSERT ON risk_assessments
    FOR EACH ROW EXECUTE FUNCTION public.audit_assessment_created();

CREATE OR REPLACE FUNCTION public.audit_override_created()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public.write_audit(
        NEW.clinician_id, 'OVERRIDE_CREATED', 'clinician_override', NEW.id::TEXT,
        jsonb_build_object('assessment_id', NEW.assessment_id, 'disease', NEW.disease,
                           'model_band', NEW.model_band, 'clinician_band', NEW.clinician_band,
                           'reason_code', NEW.reason_code, 'model_version', NEW.model_version)
    );
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_clinician_overrides
    AFTER INSERT ON clinician_overrides
    FOR EACH ROW EXECUTE FUNCTION public.audit_override_created();

CREATE OR REPLACE FUNCTION public.audit_review_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.write_audit(
            COALESCE(auth.uid(), NEW.reviewed_by), 'REVIEW_' || upper(NEW.status), 'review_queue',
            NEW.id::TEXT, jsonb_build_object('assessment_id', NEW.assessment_id)
        );
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_review_queue
    AFTER UPDATE ON review_queue
    FOR EACH ROW EXECUTE FUNCTION public.audit_review_status();

CREATE OR REPLACE FUNCTION public.audit_share_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.write_audit(NEW.user_id, 'SHARE_CREATED', 'share_token', NEW.id::TEXT,
            jsonb_build_object('scope', NEW.scope, 'expires_at', NEW.expires_at));
    ELSIF NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
        PERFORM public.write_audit(NEW.user_id, 'SHARE_REVOKED', 'share_token', NEW.id::TEXT, '{}'::jsonb);
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_share_tokens
    AFTER INSERT OR UPDATE ON share_tokens
    FOR EACH ROW EXECUTE FUNCTION public.audit_share_change();

CREATE OR REPLACE FUNCTION public.audit_share_opened()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public.write_audit(auth.uid(), 'SHARE_OPENED', 'share_token', NEW.token_id::TEXT,
        jsonb_build_object('accessor_role', NEW.accessor_role));
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_share_access_log
    AFTER INSERT ON share_access_log
    FOR EACH ROW EXECUTE FUNCTION public.audit_share_opened();

CREATE OR REPLACE FUNCTION public.audit_data_request()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.write_audit(NEW.user_id, 'DATA_REQUEST_CREATED', 'data_request', NEW.id::TEXT,
            jsonb_build_object('type', NEW.type));
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.write_audit(NEW.user_id, 'DATA_REQUEST_' || upper(NEW.status), 'data_request',
            NEW.id::TEXT, jsonb_build_object('type', NEW.type));
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER audit_data_requests
    AFTER INSERT OR UPDATE ON data_requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_data_request();

-- ------------------------------------------------------------------------------
-- 13. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_consents_user_purpose ON consents(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_queue_patient ON review_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_overrides_assessment ON clinician_overrides(assessment_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_user ON share_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_share_access_token ON share_access_log(token_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_logs_created ON assistant_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_doctor_time ON doctor_slots(doctor_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY
-- Patient: own rows. Clinician: only patients with active share_with_clinician
-- consent. Admin: audit log + governance tables; patient-level aggregates are
-- computed server-side (service role), never read row by row from the browser.
-- Tables with RLS enabled and no policy are server-only.
-- ------------------------------------------------------------------------------
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_slots ENABLE ROW LEVEL SECURITY;

-- Profiles (old FOR ALL policy let a user rewrite their own role)
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "profiles: read own" ON profiles FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "profiles: update own" ON profiles FOR UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: clinician reads consented patients" ON profiles FOR SELECT
    USING (role = 'patient' AND public.clinician_can_view(id));

-- Health profiles
DROP POLICY IF EXISTS "Users manage own health profile" ON health_profiles;
CREATE POLICY "health_profiles: own" ON health_profiles FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_profiles: clinician reads consented" ON health_profiles FOR SELECT
    USING (public.clinician_can_view(user_id));

-- Risk assessments: created only by the API (models run server-side); a user must
-- never be able to write their own results.
DROP POLICY IF EXISTS "Users view own assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Users create own assessments" ON risk_assessments;
CREATE POLICY "risk_assessments: read own" ON risk_assessments FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "risk_assessments: clinician reads consented" ON risk_assessments FOR SELECT
    USING (public.clinician_can_view(user_id));

-- Review queue
CREATE POLICY "review_queue: patient reads own" ON review_queue FOR SELECT
    USING (auth.uid() = patient_id);
CREATE POLICY "review_queue: clinician reads consented" ON review_queue FOR SELECT
    USING (public.clinician_can_view(patient_id));

-- Clinician overrides (append-only; inserts go through the API in P6)
CREATE POLICY "clinician_overrides: clinician reads consented" ON clinician_overrides FOR SELECT
    USING (EXISTS (SELECT 1 FROM risk_assessments ra
                   WHERE ra.id = assessment_id AND public.clinician_can_view(ra.user_id)));
CREATE POLICY "clinician_overrides: patient reads own" ON clinician_overrides FOR SELECT
    USING (EXISTS (SELECT 1 FROM risk_assessments ra
                   WHERE ra.id = assessment_id AND ra.user_id = auth.uid()));

-- Consents: own rows only; no delete (withdrawal is an update, deletion via data request)
DROP POLICY IF EXISTS "Users manage own consents" ON consents;
CREATE POLICY "consents: read own" ON consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consents: insert own" ON consents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consents: update own" ON consents FOR UPDATE
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Share tokens: owner can list and revoke; creation and resolving are server-side
CREATE POLICY "share_tokens: owner reads" ON share_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "share_tokens: owner revokes" ON share_tokens FOR UPDATE
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "share_access_log: owner reads" ON share_access_log FOR SELECT
    USING (EXISTS (SELECT 1 FROM share_tokens st WHERE st.id = token_id AND st.user_id = auth.uid()));

-- Data requests
CREATE POLICY "data_requests: owner reads" ON data_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "data_requests: owner creates" ON data_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending' AND completed_at IS NULL);

-- Assistant logs: owner can see their own (for data export); written by the API
CREATE POLICY "assistant_logs: owner reads" ON assistant_logs FOR SELECT USING (auth.uid() = user_id);

-- Audit log: admin reads all, a user reads entries they are the actor of
CREATE POLICY "audit_logs: admin reads" ON audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs: actor reads own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Governance / model tables: admin reads; model registry is public (no personal data)
CREATE POLICY "governance_events: admin reads" ON governance_events FOR SELECT USING (public.is_admin());
CREATE POLICY "model_registry: public read" ON model_registry FOR SELECT USING (TRUE);
CREATE POLICY "model_versions: public read" ON model_versions FOR SELECT USING (TRUE);
CREATE POLICY "model_experiments: admin reads" ON model_experiments FOR SELECT USING (public.is_admin());

-- Care connect directory is public; bookings go through the API
CREATE POLICY "doctor_specializations: public read" ON doctor_specializations FOR SELECT USING (TRUE);
CREATE POLICY "doctor_slots: public read" ON doctor_slots FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users manage own appointments" ON appointments;
CREATE POLICY "appointments: patient reads own" ON appointments FOR SELECT
    USING (auth.uid() = patient_id);
CREATE POLICY "appointments: doctor reads own" ON appointments FOR SELECT
    USING (EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_id AND d.profile_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 15. FUNCTION PRIVILEGES
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.resolve_share_token(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_share_token(TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.write_audit(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.write_audit(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- has_consent takes any user id, so it would reveal other people's consent state:
-- server-only. Policies use the helpers below, which only look at auth.uid() and are
-- safe for every API role (they are false for anon).
REVOKE ALL ON FUNCTION public.has_consent(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_consent(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.clinician_can_view(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_clinician() TO anon, authenticated, service_role;
