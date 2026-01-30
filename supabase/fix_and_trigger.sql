-- 1. CLEANUP (Optional, but ensures fresh state if needed)
-- TRUNCATE public.profiles, public.fir_reports, public.fir_details, public.attachments, public.risk_assessments CASCADE;

-- 2. ROBUST AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    default_role user_role := 'safety_engineer';
    metadata_role TEXT;
BEGIN
    -- Extract role from metadata if it exists
    IF new.raw_user_meta_data IS NOT NULL THEN
        metadata_role := new.raw_user_meta_data->>'role';
        
        -- Check if it's a valid enum value, otherwise fallback
        IF metadata_role IN ('safety_engineer', 'safety_manager', 'dept_manager') THEN
            default_role := metadata_role::user_role;
        END IF;
    END IF;

    -- Wrap in BEGIN...EXCEPTION to ensure a failure here DOES NOT block the signup
    BEGIN
        INSERT INTO public.profiles (id, full_name, role)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
            default_role
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Log or ignore error (signing up is more important than the profile for now)
        -- In production, you'd want to log this properly
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS and Policies are robust
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can see profiles" ON public.profiles;
CREATE POLICY "Authenticated users can see profiles" ON public.profiles 
FOR SELECT TO authenticated USING (true);
