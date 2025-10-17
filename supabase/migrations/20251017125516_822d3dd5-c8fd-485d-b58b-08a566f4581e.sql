-- ============================================================================
-- CORRECTION SÉCURITÉ: Retrait du SECURITY DEFINER de la vue
-- ============================================================================

-- Supprimer et recréer la vue avec SECURITY INVOKER (pas de SECURITY DEFINER)
DROP VIEW IF EXISTS public.v_teacher_profiles_enriched;

CREATE VIEW public.v_teacher_profiles_enriched
WITH (security_invoker = true)
AS
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

-- ============================================================================
-- FIN CORRECTION
-- ============================================================================