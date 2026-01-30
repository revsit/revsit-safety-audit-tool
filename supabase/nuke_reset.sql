-- 1. DROP ALL CUSTOM TRIGGERS ON AUTH.USERS
-- This is the most common reason the Dashboard fails with "Database error"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CLEANUP AUTH TABLES (Sequential delete to respect constraints)
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- 3. CLEANUP PUBLIC TABLES (CASCADE handles the FK dependencies)
TRUNCATE public.profiles, public.fir_reports, public.fir_details, public.attachments, public.risk_assessments CASCADE;

-- 4. ENSURE AUTO-CONFIRM ISN'T THE ISSUE
-- (Dashboard 'Auto Confirm' should work now that triggers are gone)
