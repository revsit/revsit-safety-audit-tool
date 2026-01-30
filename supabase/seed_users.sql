-- Create encryption extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  engineer_id uuid := gen_random_uuid();
  manager_id uuid := gen_random_uuid();
  head_id uuid := gen_random_uuid();
BEGIN
  -- ---------------------------------------------------------------------------
  -- 1. Safety Engineer: Alex Morgan
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alex.morgan@revsit.com') THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        engineer_id, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        'alex.morgan@revsit.com', 
        crypt('Revsit@2026', gen_salt('bf')), -- Stronger default password
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Alex Morgan"}', 
        now(), 
        now()
      );
      
      INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        engineer_id::text, 
        engineer_id, 
        format('{"sub":"%s","email":"alex.morgan@revsit.com"}', engineer_id)::jsonb, 
        'email', 
        now(), 
        now(), 
        now()
      );

      INSERT INTO public.profiles (id, full_name, role) 
      VALUES (engineer_id, 'Alex Morgan', 'safety_engineer');
  END IF;

  -- ---------------------------------------------------------------------------
  -- 2. Safety Manager: Sarah Connor
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sarah.connor@revsit.com') THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        manager_id, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        'sarah.connor@revsit.com', 
        crypt('Revsit@2026', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Sarah Connor"}', 
        now(), 
        now()
      );
      
      INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        manager_id::text, 
        manager_id, 
        format('{"sub":"%s","email":"sarah.connor@revsit.com"}', manager_id)::jsonb, 
        'email', 
        now(), 
        now(), 
        now()
      );

      INSERT INTO public.profiles (id, full_name, role) 
      VALUES (manager_id, 'Sarah Connor', 'safety_manager');
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3. Department Head: David Ross
  -- ---------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'david.ross@revsit.com') THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        head_id, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated', 
        'david.ross@revsit.com', 
        crypt('Revsit@2026', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"David Ross"}', 
        now(), 
        now()
      );
      
      INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        head_id::text, 
        head_id, 
        format('{"sub":"%s","email":"david.ross@revsit.com"}', head_id)::jsonb, 
        'email', 
        now(), 
        now(), 
        now()
      );

      INSERT INTO public.profiles (id, full_name, role) 
      VALUES (head_id, 'David Ross', 'dept_manager');
  END IF;

END $$;
