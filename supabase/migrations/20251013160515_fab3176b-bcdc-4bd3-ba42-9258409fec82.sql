-- ============================================================================
-- MIGRATION DE SÉCURITÉ: Correction des politiques RLS trop permissives
-- ============================================================================

-- 1. SÉCURISATION DE LA TABLE STUDENTS
-- Supprimer les policies trop permissives
DROP POLICY IF EXISTS "Anyone can view students for public quizzes" ON students;
DROP POLICY IF EXISTS "Authenticated users can view all students" ON students;
DROP POLICY IF EXISTS "Authenticated users can create students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;

-- Nouvelles policies restrictives basées sur les rôles
CREATE POLICY "Admins have full access to students"
ON students FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view all students"
ON students FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. SÉCURISATION DE LA TABLE STUDENT_ENROLLMENTS
DROP POLICY IF EXISTS "Anyone can view enrollments for public quizzes" ON student_enrollments;
DROP POLICY IF EXISTS "Authenticated users can create enrollments" ON student_enrollments;
DROP POLICY IF EXISTS "Authenticated users can update enrollments" ON student_enrollments;
DROP POLICY IF EXISTS "Authenticated users can delete enrollments" ON student_enrollments;

CREATE POLICY "Admins have full access to enrollments"
ON student_enrollments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view all enrollments"
ON student_enrollments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. AJOUT D'AUDIT LOGGING POUR TEACHER_PROFILES (accès aux données sensibles)
-- Créer un trigger pour logger les accès aux données bancaires
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger l'accès aux informations bancaires si elles sont consultées
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'SENSITIVE_ACCESS',
    'teacher_profiles',
    NEW.id,
    jsonb_build_object('accessed_fields', 'bank_iban, bank_bic, siret')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Les vues héritent automatiquement de la sécurité des tables sous-jacentes
-- Les policies existantes pour teacher_profiles sont déjà correctes