-- Migration: 20260929193000_doctor_must_change_password.sql
-- Description: Adds must_change_password flag to profiles for provisioned doctor accounts

-- 1. Add must_change_password column to public.profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. Mark existing doctor accounts to change password
UPDATE public.profiles
SET must_change_password = true
WHERE role = 'doctor' AND (must_change_password IS NULL OR must_change_password = false);

-- 3. Update handle_new_user() trigger function to mark new provisioned doctors
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
  should_force_password_change BOOLEAN;
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

  caller_role := public.get_auth_role();

  IF caller_role = 'admin' THEN
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');
    IF assigned_role NOT IN ('doctor', 'admin', 'patient') THEN
      assigned_role := 'patient';
    END IF;
  ELSE
    assigned_role := 'patient';
  END IF;

  should_force_password_change := (assigned_role = 'doctor');

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
    must_change_password,
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
    should_force_password_change,
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
