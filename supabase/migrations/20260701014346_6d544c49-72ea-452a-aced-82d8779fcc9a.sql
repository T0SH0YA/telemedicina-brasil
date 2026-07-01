-- ========== ENUMS ==========
DO $$ BEGIN
  CREATE TYPE public.patient_sex AS ENUM ('M', 'F', 'outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.drug_kind AS ENUM ('generico', 'similar', 'referencia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.prescription_doc_type AS ENUM ('simples', 'controle_especial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.prescription_status AS ENUM ('rascunho', 'emitida', 'enviada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ========== SHARED updated_at TRIGGER FN ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== 1. DOCTOR PROFILES ==========
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  user_id UUID NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL,
  crm TEXT,
  crm_uf TEXT,
  rqe TEXT,
  specialty TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Médicos gerenciam o próprio perfil"
  ON public.doctor_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== 2. PATIENTS ==========
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  sex public.patient_sex,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  weight_kg NUMERIC,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Médicos gerenciam os próprios pacientes"
  ON public.patients FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_patients_owner ON public.patients(owner_id);
CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== 3. MEDICATIONS (base de referência global) ==========
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  active_ingredient TEXT,
  presentation TEXT,
  drug_kind public.drug_kind,
  controlled BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  default_posology TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medicamentos: leitura para autenticados"
  ON public.medications FOR SELECT
  TO authenticated
  USING (true);

-- ========== 4. PRESCRIPTION TEMPLATES ==========
CREATE TABLE IF NOT EXISTS public.prescription_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  doc_type public.prescription_doc_type NOT NULL DEFAULT 'simples',
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_templates TO authenticated;
GRANT ALL ON public.prescription_templates TO service_role;
ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Médicos gerenciam os próprios modelos"
  ON public.prescription_templates FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_owner ON public.prescription_templates(owner_id);
CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON public.prescription_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== 5. PRESCRIPTIONS ==========
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  doc_type public.prescription_doc_type NOT NULL DEFAULT 'simples',
  status public.prescription_status NOT NULL DEFAULT 'rascunho',
  validation_token TEXT NOT NULL,
  clinic_location TEXT,
  notes TEXT,
  sent_to TEXT,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Médicos gerenciam as próprias prescrições"
  ON public.prescriptions FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_owner ON public.prescriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== 6. PRESCRIPTION ITEMS ==========
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  presentation TEXT,
  dosage TEXT,
  quantity TEXT,
  posology TEXT,
  compounded BOOLEAN NOT NULL DEFAULT false,
  controlled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_items TO authenticated;
GRANT ALL ON public.prescription_items TO service_role;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Médicos gerenciam os próprios itens"
  ON public.prescription_items FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_items_prescription ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_items_owner ON public.prescription_items(owner_id);

-- ========== SEED: base global de medicamentos (fictícia) ==========
INSERT INTO public.medications (brand_name, active_ingredient, presentation, drug_kind, controlled, category, default_posology) VALUES
  ('Amoxil', 'Amoxicilina 500 mg', 'Cápsula', 'referencia', false, 'Antibiótico', '1 cápsula de 8/8h por 7 dias'),
  ('Novalgina', 'Dipirona 500 mg', 'Comprimido', 'referencia', false, 'Analgésico', '1 comprimido até 6/6h se dor ou febre'),
  ('Losec', 'Omeprazol 20 mg', 'Cápsula', 'referencia', false, 'Inibidor de bomba de prótons', '1 cápsula em jejum por 30 dias'),
  ('Cozaar', 'Losartana 50 mg', 'Comprimido', 'referencia', false, 'Anti-hipertensivo', '1 comprimido pela manhã, uso contínuo'),
  ('Glifage', 'Metformina 850 mg', 'Comprimido', 'referencia', false, 'Antidiabético', '1 comprimido após almoço e jantar'),
  ('Zoloft', 'Sertralina 50 mg', 'Comprimido', 'referencia', true, 'Antidepressivo', '1 comprimido pela manhã, uso contínuo'),
  ('Rivotril', 'Clonazepam 2 mg', 'Comprimido', 'referencia', true, 'Ansiolítico (B1)', '1/2 comprimido à noite'),
  ('Meticorten', 'Prednisona 20 mg', 'Comprimido', 'referencia', false, 'Corticoide', '1 comprimido pela manhã por 5 dias'),
  ('Claritin', 'Loratadina 10 mg', 'Comprimido', 'referencia', false, 'Antialérgico', '1 comprimido ao dia por 10 dias'),
  ('Alivium', 'Ibuprofeno 600 mg', 'Comprimido', 'referencia', false, 'Anti-inflamatório', '1 comprimido de 8/8h após refeições'),
  ('Zitromax', 'Azitromicina 500 mg', 'Comprimido', 'referencia', false, 'Antibiótico', '1 comprimido ao dia por 5 dias'),
  ('Aerolin', 'Salbutamol 100 mcg', 'Aerossol', 'referencia', false, 'Broncodilatador', '2 jatos até 6/6h se falta de ar');