-- ==============================================================================
-- VITALNEX Database Migration: Initial Production Schema
-- Version: 20260927000001
-- Description: Core healthcare intelligence, patient profile, clinical risk,
--              trust passport, doctor care connect, and governance tables.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'researcher', 'admin')),
    phone_number TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. HEALTH PROFILES (Separated into Model vs Context Features)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    age INT CHECK (age >= 1 AND age <= 120),
    sex INT CHECK (sex IN (0, 1)), -- 0=female, 1=male
    height_cm NUMERIC(5, 2),
    weight_kg NUMERIC(5, 2),
    bmi NUMERIC(4, 1),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    occupation TEXT,
    work_pattern TEXT,
    completeness_score INT NOT NULL DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_health_profiles_modtime
    BEFORE UPDATE ON health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. LIFESTYLE FEATURES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_lifestyle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_profile_id UUID NOT NULL REFERENCES health_profiles(id) ON DELETE CASCADE UNIQUE,
    smoking INT NOT NULL DEFAULT 0 CHECK (smoking IN (0, 1)),
    physical_activity TEXT NOT NULL DEFAULT 'Moderate' CHECK (physical_activity IN ('Low', 'Moderate', 'High')),
    sedentary_hours_per_day NUMERIC(3, 1) DEFAULT 6.0,
    sleep_hours_per_night NUMERIC(3, 1) DEFAULT 7.0,
    stress_level TEXT DEFAULT 'Moderate' CHECK (stress_level IN ('Low', 'Moderate', 'High', 'Severe')),
    hydration_liters_per_day NUMERIC(3, 1) DEFAULT 2.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. NUTRITION FEATURES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_profile_id UUID NOT NULL REFERENCES health_profiles(id) ON DELETE CASCADE UNIQUE,
    diet_quality TEXT NOT NULL DEFAULT 'Moderate' CHECK (diet_quality IN ('Needs_Improvement', 'Moderate', 'Healthy')),
    diet_pattern TEXT DEFAULT 'Mixed' CHECK (diet_pattern IN ('Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Mixed')),
    meal_frequency_per_day INT DEFAULT 3,
    daily_fruit_veg_servings INT DEFAULT 2,
    processed_food_frequency TEXT DEFAULT 'Occasional' CHECK (processed_food_frequency IN ('Rarely', 'Occasional', 'Frequent', 'Daily')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. CONTEXT FEATURES (Regional & Demographic)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_profile_id UUID NOT NULL REFERENCES health_profiles(id) ON DELETE CASCADE UNIQUE,
    locality_type TEXT NOT NULL DEFAULT 'Urban_Pune' CHECK (locality_type IN ('Urban_Pune', 'Peri_Urban_Pune', 'PCMC', 'Rural_Maharashtra')),
    socioeconomic_band TEXT NOT NULL DEFAULT 'Middle' CHECK (socioeconomic_band IN ('Lower', 'Lower_Middle', 'Middle', 'Upper_Middle', 'Upper')),
    city TEXT DEFAULT 'Pune',
    region TEXT DEFAULT 'Maharashtra',
    country TEXT DEFAULT 'India',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. CLINICAL CONDITIONS (Validated inputs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_profile_id UUID NOT NULL REFERENCES health_profiles(id) ON DELETE CASCADE UNIQUE,
    diabetes INT NOT NULL DEFAULT 0 CHECK (diabetes IN (0, 1)),
    hypertension INT NOT NULL DEFAULT 0 CHECK (hypertension IN (0, 1)),
    trestbps NUMERIC(5, 1) DEFAULT 120.0, -- Resting blood pressure (mm Hg)
    chol NUMERIC(5, 1) DEFAULT 190.0,     -- Serum cholesterol (mg/dL)
    fbs INT DEFAULT 0 CHECK (fbs IN (0, 1)), -- Fasting blood sugar > 120
    restecg INT DEFAULT 0 CHECK (restecg IN (0, 1, 2)),
    thalach NUMERIC(5, 1) DEFAULT 150.0,  -- Max heart rate achieved
    exang INT DEFAULT 0 CHECK (exang IN (0, 1)), -- Exercise-induced angina
    oldpeak NUMERIC(3, 1) DEFAULT 0.0,    -- ST depression
    slope INT DEFAULT 1 CHECK (slope IN (1, 2, 3)),
    ca INT DEFAULT 0 CHECK (ca IN (0, 1, 2, 3)),
    thal INT DEFAULT 3 CHECK (thal IN (3, 6, 7)),
    cp INT DEFAULT 4 CHECK (cp IN (1, 2, 3, 4)), -- Chest pain type
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. FAMILY HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_family_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_profile_id UUID NOT NULL REFERENCES health_profiles(id) ON DELETE CASCADE UNIQUE,
    family_history INT NOT NULL DEFAULT 0 CHECK (family_history IN (0, 1)),
    cardiovascular_event_relative TEXT,
    diabetes_in_parents BOOLEAN DEFAULT FALSE,
    hypertension_in_parents BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. MODEL REGISTRY & EXPERIMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    current_production_version TEXT,
    framework TEXT NOT NULL, -- e.g. 'scikit-learn', 'tensorflow', 'xgboost'
    task_type TEXT NOT NULL DEFAULT 'binary_classification',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES model_registry(id) ON DELETE CASCADE,
    version_tag TEXT NOT NULL, -- e.g. 'v1.0.0-demo'
    status TEXT NOT NULL DEFAULT 'staging' CHECK (status IN ('development', 'staging', 'production', 'archived')),
    accuracy NUMERIC(5, 4),
    roc_auc NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),
    fairness_disparity_ratio NUMERIC(5, 4),
    artifact_uri TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_id, version_tag)
);

CREATE TABLE IF NOT EXISTS model_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
    experiment_name TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    confusion_matrix JSONB,
    dataset_version TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. RISK ASSESSMENTS & INPUT SNAPSHOTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    model_version_id UUID REFERENCES model_versions(id),
    assessment_mode TEXT NOT NULL DEFAULT 'demo' CHECK (assessment_mode IN ('demo', 'clinical_screening', 'research')),
    risk_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00
    risk_band TEXT NOT NULL CHECK (risk_band IN ('Low', 'Moderate', 'High')),
    confidence_interval_low NUMERIC(5, 2),
    confidence_interval_high NUMERIC(5, 2),
    calibration_status TEXT DEFAULT 'Calibrated',
    human_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    human_review_status TEXT NOT NULL DEFAULT 'Not_Required' CHECK (human_review_status IN ('Not_Required', 'Pending', 'Approved', 'Modified', 'Rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    doctor_review_notes TEXT,
    disclaimer TEXT NOT NULL DEFAULT 'VITALNEX is a research and decision-support prototype. It does not diagnose disease, prescribe treatment, or replace a qualified healthcare professional.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE UNIQUE,
    model_features_snapshot JSONB NOT NULL,
    lifestyle_features_snapshot JSONB,
    context_features_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. AI TRUST PASSPORTS (11 Dimensions of Responsible AI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trust_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE UNIQUE,
    prediction_summary JSONB NOT NULL,
    confidence_metrics JSONB NOT NULL,
    data_quality_score NUMERIC(5, 2),
    data_completeness_pct NUMERIC(5, 2),
    explainability_summary JSONB NOT NULL, -- SHAP/feature contribution snapshot
    fairness_metrics JSONB NOT NULL,      -- Subgroup parity / demographic parity
    uncertainty_profile JSONB NOT NULL,   -- Epistemic/aleatoric metrics
    safety_boundary_checks JSONB NOT NULL,-- Out-of-bounds detection
    model_version_tag TEXT NOT NULL,
    evaluation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    human_review_summary JSONB NOT NULL,
    limitations TEXT[] NOT NULL DEFAULT ARRAY['Synthetic research model', 'Non-diagnostic screening only', 'Requires clinical correlation'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. GOVERNANCE & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g. 'MODEL_REGISTERED', 'ASSESSMENT_ESCALATED', 'DRIFT_DETECTED'
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'PROFILE_UPDATE', 'ASSESSMENT_RUN', 'CONSENT_GRANTED'
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. DOCTOR / CARE CONNECT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    medical_license_number TEXT NOT NULL,
    specialization TEXT NOT NULL,
    years_of_experience INT NOT NULL DEFAULT 5,
    bio TEXT,
    languages_spoken TEXT[] NOT NULL DEFAULT ARRAY['English', 'Hindi', 'Marathi'],
    consultation_modes TEXT[] NOT NULL DEFAULT ARRAY['video', 'in_person'],
    rating NUMERIC(3, 2) DEFAULT 4.9,
    review_count INT DEFAULT 42,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE, -- Explicitly mark demo providers
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_hi TEXT NOT NULL,
    title_mr TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS doctor_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    locality TEXT NOT NULL, -- e.g. 'Kothrud', 'Baner', 'Shivajinagar'
    city TEXT NOT NULL DEFAULT 'Pune',
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    postal_code TEXT,
    distance_estimate_km NUMERIC(4, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
    appointment_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    consultation_type TEXT NOT NULL DEFAULT 'video' CHECK (consultation_type IN ('video', 'in_person', 'audio')),
    patient_reason TEXT,
    doctor_notes TEXT,
    meeting_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. PREFERENCES, VOICE & CONSENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    voice_language TEXT NOT NULL DEFAULT 'en' CHECK (voice_language IN ('en', 'hi', 'mr')),
    playback_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    voice_gender TEXT NOT NULL DEFAULT 'neutral' CHECK (voice_gender IN ('female', 'male', 'neutral')),
    auto_transcribe BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
    large_touch_targets BOOLEAN NOT NULL DEFAULT FALSE,
    screen_reader_optimizations BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_category TEXT NOT NULL CHECK (consent_category IN ('health_data', 'voice_data', 'location_coarse', 'doctor_sharing', 'ai_interaction')),
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    granularity TEXT DEFAULT 'coarse',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (user_id, consent_category)
);

-- ------------------------------------------------------------------------------
-- 14. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_health_profiles_user ON health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_created ON risk_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_governance_events_created ON governance_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_lifestyle ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can manage own profile"
    ON profiles FOR ALL
    USING (auth.uid() = id);

-- Public can view active doctors
CREATE POLICY "Public can view active doctors"
    ON doctors FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view doctor locations"
    ON doctor_locations FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view doctor availability"
    ON doctor_availability FOR SELECT
    USING (TRUE);

-- Health Profiles: Users can only view and update their own health records
CREATE POLICY "Users manage own health profile"
    ON health_profiles FOR ALL
    USING (auth.uid() = user_id);

-- Assessments: Users view their own; authorized doctors can view assigned patient assessments
CREATE POLICY "Users view own assessments"
    ON risk_assessments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users create own assessments"
    ON risk_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own trust passports"
    ON trust_passports FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM risk_assessments ra
        WHERE ra.id = trust_passports.assessment_id AND ra.user_id = auth.uid()
    ));

-- Appointments: Patients can view and book their own appointments; Doctors can view their appointments
CREATE POLICY "Users manage own appointments"
    ON appointments FOR ALL
    USING (auth.uid() = patient_id OR auth.uid() IN (SELECT profile_id FROM doctors WHERE id = appointments.doctor_id));

-- Consents & Preferences: User access only
CREATE POLICY "Users manage own consents"
    ON consents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own preferences"
    ON user_preferences FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own voice preferences"
    ON voice_preferences FOR ALL
    USING (auth.uid() = user_id);
