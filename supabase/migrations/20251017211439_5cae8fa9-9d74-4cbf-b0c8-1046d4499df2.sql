-- Supprimer et recréer la vue sans SIRET
DROP VIEW IF EXISTS public.v_teacher_profiles_enriched CASCADE;

-- Supprimer le champ SIRET du profil enseignant
ALTER TABLE public.teacher_profiles 
  DROP COLUMN IF EXISTS siret;

-- Ajouter le champ SIRET à la table des factures
ALTER TABLE public.teacher_invoices
  ADD COLUMN IF NOT EXISTS siret TEXT;

-- Recréer la vue enrichie sans SIRET
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
  tp.created_at,
  tp.updated_at,
  -- Subjects taught
  COALESCE(
    ARRAY_AGG(DISTINCT ts.subject_name) FILTER (WHERE ts.subject_name IS NOT NULL),
    ARRAY[]::text[]
  ) AS subjects,
  -- Document counts
  COUNT(DISTINCT CASE WHEN td.status = 'approved' THEN td.id END) AS documents_approved,
  COUNT(DISTINCT CASE WHEN td.status = 'pending' THEN td.id END) AS documents_pending,
  COUNT(DISTINCT CASE WHEN td.status = 'rejected' THEN td.id END) AS documents_rejected,
  -- Onboarding status
  CASE 
    WHEN COUNT(DISTINCT oc.id) = 0 THEN 'not_started'
    WHEN COUNT(DISTINCT CASE WHEN oc.is_completed THEN oc.id END) = COUNT(DISTINCT oc.id) THEN 'completed'
    ELSE 'in_progress'
  END AS onboarding_status,
  COUNT(DISTINCT CASE WHEN oc.is_completed THEN oc.id END) AS checklist_completed,
  COUNT(DISTINCT oc.id) AS checklist_total
FROM public.teacher_profiles tp
LEFT JOIN public.teacher_subjects ts ON tp.user_id = ts.teacher_id
LEFT JOIN public.teacher_documents td ON tp.user_id = td.teacher_id
LEFT JOIN public.onboarding_checklist oc ON tp.user_id = oc.teacher_id
GROUP BY tp.id, tp.user_id, tp.first_name, tp.last_name, tp.full_name, tp.email, 
         tp.secondary_email, tp.phone, tp.address, tp.created_at, tp.updated_at;