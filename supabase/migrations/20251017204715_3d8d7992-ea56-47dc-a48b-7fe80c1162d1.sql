-- Corriger les avertissements de sécurité: ajouter RLS sur les vues

-- Les vues doivent avoir les mêmes politiques RLS que les tables sous-jacentes
-- Activer RLS sur toutes les vues enrichies

ALTER VIEW public.v_students_enriched SET (security_invoker = on);
ALTER VIEW public.v_student_enrollments_enriched SET (security_invoker = on);
ALTER VIEW public.v_grades_enriched SET (security_invoker = on);