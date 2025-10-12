-- Créer des triggers d'audit pour toutes les tables sensibles
-- Cela va logger automatiquement INSERT, UPDATE, DELETE sur chaque table

-- Trigger pour la table students
DROP TRIGGER IF EXISTS audit_students_changes ON public.students;
CREATE TRIGGER audit_students_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table grades
DROP TRIGGER IF EXISTS audit_grades_changes ON public.grades;
CREATE TRIGGER audit_grades_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table subjects
DROP TRIGGER IF EXISTS audit_subjects_changes ON public.subjects;
CREATE TRIGGER audit_subjects_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table teachers
DROP TRIGGER IF EXISTS audit_teachers_changes ON public.teachers;
CREATE TRIGGER audit_teachers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table user_roles
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table school_years (nouveau - important pour tracking)
DROP TRIGGER IF EXISTS audit_school_years_changes ON public.school_years;
CREATE TRIGGER audit_school_years_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.school_years
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table classes (nouveau - important pour tracking)
DROP TRIGGER IF EXISTS audit_classes_changes ON public.classes;
CREATE TRIGGER audit_classes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table levels (nouveau - important pour tracking)
DROP TRIGGER IF EXISTS audit_levels_changes ON public.levels;
CREATE TRIGGER audit_levels_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Trigger pour la table academic_periods (nouveau - important pour tracking)
DROP TRIGGER IF EXISTS audit_academic_periods_changes ON public.academic_periods;
CREATE TRIGGER audit_academic_periods_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.academic_periods
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();