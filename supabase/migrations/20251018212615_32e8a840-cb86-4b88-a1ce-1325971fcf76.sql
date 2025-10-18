-- ============================================
-- ÉTAPE 1: Foundation DB - Tables étudiants enrichies
-- ============================================

-- Table: student_profiles (informations personnelles enrichies)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  nationality TEXT,
  birth_place TEXT,
  birth_country TEXT,
  social_security_number TEXT,
  
  -- Contact d'urgence
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_email TEXT,
  
  -- Informations médicales
  blood_type TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  medications TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  
  -- Assurance
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour student_profiles
CREATE INDEX idx_student_profiles_student_id ON public.student_profiles(student_id);

-- Trigger updated_at pour student_profiles
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Table: student_document_categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at pour student_document_categories
CREATE TRIGGER update_student_document_categories_updated_at
  BEFORE UPDATE ON public.student_document_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Table: student_documents
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.student_document_categories(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  notes TEXT,
  
  uploaded_by UUID REFERENCES auth.users(id),
  upload_source TEXT DEFAULT 'admin' CHECK (upload_source IN ('admin', 'student', 'parent')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour student_documents
CREATE INDEX idx_student_documents_student_id ON public.student_documents(student_id);
CREATE INDEX idx_student_documents_category_id ON public.student_documents(category_id);
CREATE INDEX idx_student_documents_status ON public.student_documents(status);

-- Trigger updated_at pour student_documents
CREATE TRIGGER update_student_documents_updated_at
  BEFORE UPDATE ON public.student_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Table: student_onboarding_categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_onboarding_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at pour student_onboarding_categories
CREATE TRIGGER update_student_onboarding_categories_updated_at
  BEFORE UPDATE ON public.student_onboarding_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Table: student_onboarding_checklist
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.student_onboarding_categories(id) ON DELETE SET NULL,
  
  item_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour student_onboarding_checklist
CREATE INDEX idx_student_onboarding_student_id ON public.student_onboarding_checklist(student_id);
CREATE INDEX idx_student_onboarding_category_id ON public.student_onboarding_checklist(category_id);

-- Trigger updated_at pour student_onboarding_checklist
CREATE TRIGGER update_student_onboarding_checklist_updated_at
  BEFORE UPDATE ON public.student_onboarding_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES - student_profiles
-- ============================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to student profiles"
  ON public.student_profiles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view student profiles"
  ON public.student_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Note: Les étudiants pourront lire leur propre profil via une policy future quand le rôle 'student' sera ajouté

-- ============================================
-- RLS POLICIES - student_document_categories
-- ============================================
ALTER TABLE public.student_document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student document categories"
  ON public.student_document_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view student document categories"
  ON public.student_document_categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS POLICIES - student_documents
-- ============================================
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all student documents"
  ON public.student_documents
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view student documents"
  ON public.student_documents
  FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Note: Policies pour étudiants à ajouter quand le rôle 'student' sera créé

-- ============================================
-- RLS POLICIES - student_onboarding_categories
-- ============================================
ALTER TABLE public.student_onboarding_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student onboarding categories"
  ON public.student_onboarding_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view student onboarding categories"
  ON public.student_onboarding_categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS POLICIES - student_onboarding_checklist
-- ============================================
ALTER TABLE public.student_onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student onboarding checklist"
  ON public.student_onboarding_checklist
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view and update student onboarding checklist"
  ON public.student_onboarding_checklist
  FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can update student onboarding checklist"
  ON public.student_onboarding_checklist
  FOR UPDATE
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Note: Policies pour étudiants (lecture seule) à ajouter quand le rôle 'student' sera créé