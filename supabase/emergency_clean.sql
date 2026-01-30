-- 1. DROP THE TRIGGER (The likely culprit)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CLEANUP AUTH TABLES THOROUGHLY
-- Sometimes manual SQL inserts leave orphaned records in identities
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- 3. CLEANUP PUBLIC TABLES
TRUNCATE public.profiles, public.fir_reports, public.fir_details, public.attachments, public.risk_assessments CASCADE;

-- 4. ENSURE RLS IS NOT BLOCKING INTERNAL AUTH (Shouldn't be, but just in case)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- We will re-enable it AFTER users are created
