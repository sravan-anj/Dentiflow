-- Migration: 20260929191500_auth_hardening_and_security.sql
-- Description: Adds avatar_url to profiles, patient user_id foreign key, hardened role security trigger, and profile protection trigger

-- 1. Add avatar_url column to profiles if not already present
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Add user_id column to patients referencing auth.users if not already present
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Security-hardened handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  extracted_name TEXT;
  extracted_initials TEXT;
  assigned_role TEXT;
  caller_role TEXT;
BEGIN
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  
  extracted_initials := UPPER(SUBSTRING(extracted_name FROM 1 FOR 2));
  IF extracted_initials IS NULL OR length(extracted_initials) = 0 THEN
    extracted_initials := 'PT';
  END IF;

  -- Determine caller role
  caller_role := public.get_auth_role();

  -- Enforce strict role security:
  -- ONLY an active, authenticated admin can provision 'doctor' or 'admin' accounts.
  -- ALL public visitors, self-registrations, and Google OAuth users are strictly 'patient'.
  IF caller_role = 'admin' THEN
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');
    IF assigned_role NOT IN ('doctor', 'admin', 'patient') THEN
      assigned_role := 'patient';
    END IF;
  ELSE
    assigned_role := 'patient';
  END IF;

  INSERT INTO public.profiles (
    id,
    oralix_id,
    name,
    email,
    role,
    avatar_text,
    avatar_url,
    phone,
    specialization,
    patient_id,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'oralix_id', new.email),
    extracted_name,
    new.email,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'avatar_text', extracted_initials),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.raw_user_meta_data->>'phone',
    CASE WHEN assigned_role = 'doctor' THEN new.raw_user_meta_data->>'specialization' ELSE NULL END,
    CASE WHEN assigned_role = 'patient' THEN COALESCE(new.raw_user_meta_data->>'patient_id', 'p-1') ELSE NULL END,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    oralix_id = EXCLUDED.oralix_id,
    avatar_text = EXCLUDED.avatar_text,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN new;
END;
$$;

-- 4. Re-attach on_auth_user_created trigger strictly AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Create protect_profile_role() trigger function preventing non-admin role escalation
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF public.get_auth_role() != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: only Dentiflow administrators can change account roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Attach trg_protect_profile_role trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 7. Update allow_insert_profile RLS policy to enforce patient role on public inserts
DROP POLICY IF EXISTS "allow_insert_profile" ON public.profiles;
CREATE POLICY "allow_insert_profile" ON public.profiles 
FOR INSERT WITH CHECK (
  ((auth.uid() = id) AND (role = 'patient'::text)) OR (get_auth_role() = 'admin'::text)
);
