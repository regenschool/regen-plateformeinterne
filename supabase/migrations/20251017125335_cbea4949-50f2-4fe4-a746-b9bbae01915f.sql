-- ============================================================================
-- PHASE 1: REFONTE COMPLÈTE DU MODÈLE DE DONNÉES
-- Architecture évolutive pour gestion des profils enseignants/étudiants
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MISE À JOUR DE LA TABLE teacher_profiles
-- Ajout de first_name/last_name + secondary_email
-- ----------------------------------------------------------------------------

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS secondary_email TEXT;

-- Contrainte pour secondary_email (doit être @regen-school.com)
ALTER TABLE public.teacher_profiles
  ADD CONSTRAINT check_secondary_email_domain 
  CHECK (secondary_email IS NULL OR secondary_email LIKE '%@regen-school.com');

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_name ON public.teacher_profiles(last_name, first_name);

-- Fonction pour vérifier l'email secondaire
COMMENT ON COLUMN public.teacher_profiles.secondary_email IS 'Email secondaire (domaine @regen-school.com uniquement)';
COMMENT ON COLUMN public.teacher_profiles.first_name IS 'Prénom de l''enseignant';
COMMENT ON COLUMN public.teacher_profiles.last_name IS 'Nom de famille de l''enseignant';

-- ----------------------------------------------------------------------------
-- 2. SYSTÈME DE CATÉGORISATION DES DOCUMENTS
-- Permet aux admins de configurer les sections de documents requis
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  required_for_role TEXT DEFAULT 'teacher' CHECK (required_for_role IN ('teacher', 'student', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Catégories par défaut pour enseignants
INSERT INTO public.document_categories (name, description, is_required, display_order, required_for_role) VALUES
  ('Contrats', 'Contrats de travail et avenants', true, 1, 'teacher'),
  ('Documents RH', 'Charte qualité, règlement intérieur', true, 2, 'teacher'),
  ('Identité & Justificatifs', 'Pièce d''identité, justificatifs de domicile', true, 3, 'teacher'),
  ('Bancaires & Fiscaux', 'RIB, attestation fiscale', true, 4, 'teacher'),
  ('Diplômes & Certifications', 'Diplômes, certifications professionnelles', true, 5, 'teacher'),
  ('Casier Judiciaire', 'Extrait de casier judiciaire (B3)', true, 6, 'teacher'),
  ('Accords de Confidentialité', 'NDA, accords de confidentialité', true, 7, 'teacher'),
  ('Autres Documents', 'Documents divers', false, 99, 'teacher')
ON CONFLICT DO NOTHING;

ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document categories"
  ON public.document_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view document categories"
  ON public.document_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 3. TABLE DES DOCUMENTS ENSEIGNANTS
-- Remplace school_documents avec catégorisation
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(user_id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  title TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_source TEXT DEFAULT 'admin' CHECK (upload_source IN ('admin', 'teacher')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_documents_teacher ON public.teacher_documents(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_documents_category ON public.teacher_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_teacher_documents_status ON public.teacher_documents(status);

ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all teacher documents"
  ON public.teacher_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own documents"
  ON public.teacher_documents FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can upload their own documents"
  ON public.teacher_documents FOR INSERT
  WITH CHECK (auth.uid() = teacher_id AND upload_source = 'teacher');

CREATE POLICY "Teachers can update their own documents"
  ON public.teacher_documents FOR UPDATE
  USING (auth.uid() = teacher_id AND upload_source = 'teacher');

-- ----------------------------------------------------------------------------
-- 4. TEMPLATE D'ONBOARDING CONFIGURABLE
-- Permet aux admins de définir quels documents sont requis
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.document_categories(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT DEFAULT 'file' CHECK (field_type IN ('file', 'text', 'date', 'checkbox')),
  is_required BOOLEAN DEFAULT false,
  help_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document templates"
  ON public.document_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view templates"
  ON public.document_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 5. MATIÈRES ENSEIGNÉES
-- Lien entre enseignants et matières
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(user_id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, subject_name)
);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_id);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own subjects"
  ON public.teacher_subjects FOR SELECT
  USING (auth.uid() = teacher_id);

-- ----------------------------------------------------------------------------
-- 6. NOTES DE RÉUNIONS AVEC ENSEIGNANTS
-- Pour suivi des interactions et décisions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teacher_meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(user_id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_type TEXT DEFAULT 'general' CHECK (meeting_type IN ('onboarding', 'follow-up', 'evaluation', 'general')),
  title TEXT NOT NULL,
  notes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  attendees TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_meeting_notes_teacher ON public.teacher_meeting_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_meeting_notes_date ON public.teacher_meeting_notes(meeting_date DESC);

ALTER TABLE public.teacher_meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage meeting notes"
  ON public.teacher_meeting_notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own meeting notes"
  ON public.teacher_meeting_notes FOR SELECT
  USING (auth.uid() = teacher_id);

-- ----------------------------------------------------------------------------
-- 7. CHECKLIST D'ONBOARDING
-- Suivi du processus d'intégration enseignant
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(user_id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.document_categories(id),
  item_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_teacher ON public.onboarding_checklist(teacher_id);

ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage onboarding checklist"
  ON public.onboarding_checklist FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view their own checklist"
  ON public.onboarding_checklist FOR SELECT
  USING (auth.uid() = teacher_id);

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS POUR updated_at
-- ----------------------------------------------------------------------------

CREATE TRIGGER update_teacher_documents_updated_at
  BEFORE UPDATE ON public.teacher_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_meeting_notes_updated_at
  BEFORE UPDATE ON public.teacher_meeting_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_checklist_updated_at
  BEFORE UPDATE ON public.onboarding_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON public.document_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. VUE ENRICHIE DES PROFILS ENSEIGNANTS
-- Vue consolidée pour faciliter les requêtes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_teacher_profiles_enriched AS
SELECT 
  tp.id,
  tp.user_id,
  tp.first_name,
  tp.last_name,
  tp.full_name,
  tp.email,
  tp.secondary_email,
  tp.phone,
  tp.address,
  tp.bank_iban,
  tp.bank_bic,
  tp.siret,
  tp.created_at,
  tp.updated_at,
  -- Agrégation des matières
  COALESCE(
    array_agg(DISTINCT ts.subject_name) FILTER (WHERE ts.subject_name IS NOT NULL),
    ARRAY[]::text[]
  ) as subjects,
  -- Comptage des documents par statut
  COUNT(DISTINCT CASE WHEN td.status = 'approved' THEN td.id END) as documents_approved,
  COUNT(DISTINCT CASE WHEN td.status = 'pending' THEN td.id END) as documents_pending,
  COUNT(DISTINCT CASE WHEN td.status = 'rejected' THEN td.id END) as documents_rejected,
  -- Statut onboarding
  CASE 
    WHEN COUNT(oc.id) = 0 THEN 'not_started'
    WHEN COUNT(oc.id) = COUNT(oc.id) FILTER (WHERE oc.is_completed) THEN 'completed'
    ELSE 'in_progress'
  END as onboarding_status,
  COUNT(oc.id) FILTER (WHERE oc.is_completed) as checklist_completed,
  COUNT(oc.id) as checklist_total
FROM public.teacher_profiles tp
LEFT JOIN public.teacher_subjects ts ON tp.user_id = ts.teacher_id
LEFT JOIN public.teacher_documents td ON tp.user_id = td.teacher_id
LEFT JOIN public.onboarding_checklist oc ON tp.user_id = oc.teacher_id
GROUP BY tp.id, tp.user_id, tp.first_name, tp.last_name, tp.full_name, 
         tp.email, tp.secondary_email, tp.phone, tp.address, 
         tp.bank_iban, tp.bank_bic, tp.siret, tp.created_at, tp.updated_at;

-- ----------------------------------------------------------------------------
-- 10. COMMENTAIRES ET DOCUMENTATION
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.document_categories IS 'Catégories configurables de documents (Contrats, RH, Diplômes, etc.)';
COMMENT ON TABLE public.teacher_documents IS 'Documents stockés par catégorie pour chaque enseignant';
COMMENT ON TABLE public.document_templates IS 'Template configurable définissant les champs requis par catégorie';
COMMENT ON TABLE public.teacher_subjects IS 'Matières enseignées par chaque enseignant';
COMMENT ON TABLE public.teacher_meeting_notes IS 'Notes de réunions et suivi des interactions';
COMMENT ON TABLE public.onboarding_checklist IS 'Checklist d''onboarding personnalisable par enseignant';

-- ============================================================================
-- FIN DE LA MIGRATION - PHASE 1 COMPLÈTE
-- ============================================================================