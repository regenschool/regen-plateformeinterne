-- Corriger le search_path pour refresh_student_visible_grades
CREATE OR REPLACE FUNCTION public.refresh_student_visible_grades()
RETURNS void AS $$
BEGIN
  -- Cette fonction peut être utilisée pour rafraîchir les vues ou données dérivées si nécessaire
  -- Pour l'instant, elle est vide
  NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;