-- ==============================================================================
-- VITALNEX Database Seed: Deterministic Demo Data
-- Note: All synthetic doctor profiles are explicitly marked with `is_demo = TRUE`
-- and clear synthetic identifiers.
-- ==============================================================================

-- 1. Insert Doctor Specializations
INSERT INTO doctor_specializations (code, title_en, title_hi, title_mr, description) VALUES
('cardiology', 'Cardiology & Preventive Heart Health', 'हृदय रोग एवं निवारक स्वास्थ्य', 'हृदयरोग आणि प्रतिबंधक आरोग्य', 'Specialists in cardiovascular disease prevention and lipid risk management.'),
('endocrinology', 'Endocrinology & Metabolic Disorders', 'अंतःस्रावी एवं चयापचय रोग', 'एंडोक्राइनॉलॉजी आणि चयापचय विकार', 'Management of diabetes, insulin resistance, and metabolic syndrome.'),
('general_internal', 'General & Internal Medicine', 'सामान्य आंतरिक चिकित्सा', 'सामान्य अंतर्गत औषधोपचार', 'Comprehensive adult care and systemic health assessments.'),
('lifestyle_medicine', 'Preventive & Lifestyle Medicine', 'निवारक एवं जीवनशैली चिकित्सा', 'प्रतिबंधक आणि जीवनशैली औषधोपचार', 'Evidence-based diet, activity, and stress interventions.')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Demo Doctors (Explicitly marked is_demo = TRUE)
INSERT INTO doctors (id, full_name, medical_license_number, specialization, years_of_experience, bio, languages_spoken, consultation_modes, rating, review_count, is_demo, is_active)
VALUES
('d0000001-0000-0000-0000-000000000001', 'Dr. Anand Joshi (Demo Clinician)', 'MCI-SYN-PUN-0842', 'Cardiology & Preventive Heart Health', 14, 'Cardiologist specializing in cardiovascular risk stratification and preventive care protocols in Pune.', ARRAY['English', 'Marathi', 'Hindi'], ARRAY['video', 'in_person'], 4.9, 86, TRUE, TRUE),
('d0000001-0000-0000-0000-000000000002', 'Dr. Priya Deshmukh (Demo Clinician)', 'MCI-SYN-PUN-1193', 'Endocrinology & Metabolic Disorders', 11, 'Endocrinologist focused on early diabetes screening, insulin resistance, and lifestyle-integrated metabolic therapy.', ARRAY['English', 'Marathi', 'Hindi'], ARRAY['video', 'in_person'], 4.8, 64, TRUE, TRUE),
('d0000001-0000-0000-0000-000000000003', 'Dr. Rajesh Kulkarni (Demo Clinician)', 'MCI-SYN-PUN-2204', 'General & Internal Medicine', 18, 'Senior consultant in internal medicine with special expertise in multimorbidity and preventive health.', ARRAY['English', 'Hindi', 'Marathi'], ARRAY['video'], 4.9, 112, TRUE, TRUE),
('d0000001-0000-0000-0000-000000000004', 'Dr. Sunita Gaikwad (Demo Clinician)', 'MCI-SYN-PUN-3415', 'Preventive & Lifestyle Medicine', 9, 'Lifestyle medicine physician dedicated to cardiometabolic wellness and personalized nutritional coaching.', ARRAY['English', 'Marathi'], ARRAY['video', 'in_person'], 4.7, 49, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Doctor Locations in Pune Region
INSERT INTO doctor_locations (doctor_id, facility_name, locality, city, state, postal_code, distance_estimate_km) VALUES
('d0000001-0000-0000-0000-000000000001', 'Sahyadri Specialty Wellness Clinic (Demo)', 'Kothrud', 'Pune', 'Maharashtra', '411038', 2.4),
('d0000001-0000-0000-0000-000000000002', 'Baner Metabolic Care Center (Demo)', 'Baner', 'Pune', 'Maharashtra', '411045', 4.1),
('d0000001-0000-0000-0000-000000000003', 'Shivajinagar Diagnostic & Care Hub (Demo)', 'Shivajinagar', 'Pune', 'Maharashtra', '411005', 1.8),
('d0000001-0000-0000-0000-000000000004', 'PCMC Health & Wellness Pavilion (Demo)', 'Akurdi, PCMC', 'Pune', 'Maharashtra', '411035', 7.5);

-- 4. Insert Default Availability Slots
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available) VALUES
('d0000001-0000-0000-0000-000000000001', 1, '09:00:00', '13:00:00', 30, TRUE),
('d0000001-0000-0000-0000-000000000001', 3, '14:00:00', '18:00:00', 30, TRUE),
('d0000001-0000-0000-0000-000000000002', 2, '10:00:00', '14:00:00', 30, TRUE),
('d0000001-0000-0000-0000-000000000002', 4, '15:00:00', '19:00:00', 30, TRUE),
('d0000001-0000-0000-0000-000000000003', 1, '11:00:00', '16:00:00', 30, TRUE),
('d0000001-0000-0000-0000-000000000004', 5, '09:00:00', '13:00:00', 30, TRUE);
