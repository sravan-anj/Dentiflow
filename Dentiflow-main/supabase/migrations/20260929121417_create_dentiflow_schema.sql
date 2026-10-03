-- Migration: 20260929121417_create_dentiflow_schema.sql
-- Description: Baseline schema definition for Dentiflow clinic management application

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  oralix_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'admin', 'patient')),
  avatar_text TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  patient_id TEXT,
  department TEXT,
  license_number TEXT,
  bio TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    oralix_id,
    name,
    email,
    role,
    avatar_text,
    phone,
    specialization,
    patient_id,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'oralix_id', new.email),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'avatar_text', 'PT'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'specialization',
    new.raw_user_meta_data->>'patient_id',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    oralix_id = EXCLUDED.oralix_id,
    role = EXCLUDED.role,
    avatar_text = EXCLUDED.avatar_text,
    phone = EXCLUDED.phone,
    specialization = EXCLUDED.specialization,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Helper Function for Role-based Access
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'anon'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  blood_group TEXT,
  medical_alerts TEXT[] DEFAULT '{}',
  dental_history_summary TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  balance_due NUMERIC(12,2) DEFAULT 0.00,
  last_visit_date DATE,
  next_appointment_date DATE,
  registered_date TIMESTAMPTZ DEFAULT now(),
  avatar_bg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_id TEXT,
  chair TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  procedure TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  token_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tooth Findings Table
CREATE TABLE IF NOT EXISTS public.tooth_findings (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  universal_number INTEGER,
  condition TEXT NOT NULL,
  surfaces TEXT[] DEFAULT '{}',
  diagnosis TEXT NOT NULL,
  recommended_treatment TEXT,
  estimated_cost NUMERIC(12,2) DEFAULT 0.00,
  doctor_name TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Treatment Plans Table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  date_created DATE NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  phase TEXT NOT NULL,
  total_cost NUMERIC(12,2) DEFAULT 0.00,
  discount NUMERIC(12,2) DEFAULT 0.00,
  insurance_covered NUMERIC(12,2) DEFAULT 0.00,
  patient_portion NUMERIC(12,2) DEFAULT 0.00,
  procedures JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Clinical Notes Table
CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  date DATE NOT NULL,
  chief_complaint TEXT,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  vitals JSONB DEFAULT '{}'::jsonb,
  tooth_numbers INTEGER[] DEFAULT '{}',
  tooth_number INTEGER,
  signed BOOLEAN DEFAULT false,
  is_signed BOOLEAN DEFAULT false,
  signature_date TEXT,
  prescriptions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  doctor_name TEXT NOT NULL,
  date DATE NOT NULL,
  diagnosis TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_code TEXT,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  subtotal NUMERIC(12,2) DEFAULT 0.00,
  tax NUMERIC(12,2) DEFAULT 0.00,
  discount NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(12,2) DEFAULT 0.00,
  amount_paid NUMERIC(12,2) DEFAULT 0.00,
  balance_due NUMERIC(12,2) DEFAULT 0.00,
  status TEXT NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  gateway_response JSONB DEFAULT '{}'::jsonb
);

-- 11. Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  current_stock INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  cost_per_unit NUMERIC(12,2),
  supplier TEXT NOT NULL,
  expiry_date DATE,
  last_restocked DATE,
  location TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialization TEXT,
  registration_number TEXT,
  assigned_chair TEXT,
  availability TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  active_patients_today INTEGER DEFAULT 0,
  avatar_text TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Queue Table
CREATE TABLE IF NOT EXISTS public.queue (
  id TEXT PRIMARY KEY,
  token_number TEXT NOT NULL,
  patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  chair TEXT NOT NULL,
  check_in_time TEXT NOT NULL,
  status TEXT NOT NULL,
  estimated_wait_minutes INTEGER DEFAULT 0,
  procedure TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Financing Requests Table
CREATE TABLE IF NOT EXISTS public.financing_requests (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  treatment_plan_id TEXT REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  requested_amount NUMERIC(12,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  monthly_installment NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  submitted_date DATE NOT NULL,
  employment_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Security Audit Logs Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  target_role TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL
);

-- 16. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tooth_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 17. Define RLS Policies
-- Profiles
CREATE POLICY "allow_read_profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "allow_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.get_auth_role() = 'admin');
CREATE POLICY "allow_insert_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.get_auth_role() = 'admin');

-- Patients
CREATE POLICY "allow_select_patients" ON public.patients FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_patients" ON public.patients FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
) WITH CHECK (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Appointments
CREATE POLICY "allow_select_appointments" ON public.appointments FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_insert_appointments" ON public.appointments FOR INSERT WITH CHECK (
  public.get_auth_role() IN ('doctor', 'admin', 'patient') OR auth.role() = 'authenticated'
);
CREATE POLICY "allow_update_appointments" ON public.appointments FOR UPDATE USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_delete_appointments" ON public.appointments FOR DELETE USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Tooth Findings
CREATE POLICY "allow_select_tooth_findings" ON public.tooth_findings FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_tooth_findings" ON public.tooth_findings FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Treatment Plans
CREATE POLICY "allow_select_treatment_plans" ON public.treatment_plans FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_treatment_plans" ON public.treatment_plans FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Clinical Notes
CREATE POLICY "allow_select_clinical_notes" ON public.clinical_notes FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_clinical_notes" ON public.clinical_notes FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Prescriptions
CREATE POLICY "allow_select_prescriptions" ON public.prescriptions FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_prescriptions" ON public.prescriptions FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Invoices
CREATE POLICY "allow_select_invoices" ON public.invoices FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_write_invoices" ON public.invoices FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Payment Transactions
CREATE POLICY "allow_select_transactions" ON public.payment_transactions FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_insert_transactions" ON public.payment_transactions FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Inventory & Staff
CREATE POLICY "allow_select_inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "allow_write_inventory" ON public.inventory FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

CREATE POLICY "allow_select_staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "allow_write_staff" ON public.staff FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Queue
CREATE POLICY "allow_select_queue" ON public.queue FOR SELECT USING (true);
CREATE POLICY "allow_write_queue" ON public.queue FOR ALL USING (
  public.get_auth_role() IN ('doctor', 'admin') OR auth.role() = 'authenticated'
);

-- Financing Requests
CREATE POLICY "allow_select_financing" ON public.financing_requests FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin') 
  OR patient_id = (SELECT patient_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "allow_insert_financing" ON public.financing_requests FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);
CREATE POLICY "allow_update_financing" ON public.financing_requests FOR UPDATE USING (
  public.get_auth_role() IN ('doctor', 'admin')
);

-- Security Audit Logs
CREATE POLICY "allow_select_audit_logs" ON public.security_audit_logs FOR SELECT USING (
  public.get_auth_role() IN ('doctor', 'admin')
);
CREATE POLICY "allow_insert_audit_logs" ON public.security_audit_logs FOR INSERT WITH CHECK (true);
