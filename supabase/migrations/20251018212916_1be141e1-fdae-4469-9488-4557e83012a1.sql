-- ============================================
-- ÉTAPE 2: Liaison User/Student + Auto-création profil
-- ============================================

-- 1. Ajouter user_id à students (nullable car pas toujours invité)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index pour user_id
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- 2. Ajouter le rôle 'student' à l'enum app_role (si pas déjà présent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid  
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'student') THEN
    ALTER TYPE public.app_role ADD VALUE 'student';
  END IF;
END $$;

-- 3. Fonction pour créer automatiquement un student_profile vide
CREATE OR REPLACE FUNCTION public.create_default_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer un profil vide pour chaque nouvel étudiant
  INSERT INTO public.student_profiles (student_id)
  VALUES (NEW.id)
  ON CONFLICT (student_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Trigger pour auto-création du profil
DROP TRIGGER IF EXISTS trigger_create_student_profile ON public.students;
CREATE TRIGGER trigger_create_student_profile
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_student_profile();

-- 5. RLS Policies pour les étudiants sur student_profiles
CREATE POLICY "Students can view their own profile"
  ON public.student_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own profile"
  ON public.student_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  );

-- 6. RLS Policies pour les étudiants sur student_documents
CREATE POLICY "Students can view their own documents"
  ON public.student_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_documents.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can upload their own documents"
  ON public.student_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_documents.student_id
      AND students.user_id = auth.uid()
    )
    AND upload_source = 'student'
  );

-- 7. RLS Policies pour les étudiants sur student_onboarding_checklist
CREATE POLICY "Students can view their own checklist"
  ON public.student_onboarding_checklist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_onboarding_checklist.student_id
      AND students.user_id = auth.uid()
    )
  );

-- 8. RLS Policy pour students table (étudiants peuvent voir leur propre profil)
CREATE POLICY "Students can view their own student record"
  ON public.students
  FOR SELECT
  USING (user_id = auth.uid());

-- 9. Fonction pour lier un user existant à un étudiant (pour invitations futures)
CREATE OR REPLACE FUNCTION public.link_user_to_student(
  p_student_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'étudiant existe et n'a pas déjà un user_id
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id AND user_id IS NULL) THEN
    RAISE EXCEPTION 'Student does not exist or already has a linked user account';
  END IF;
  
  -- Lier le user à l'étudiant
  UPDATE students
  SET user_id = p_user_id
  WHERE id = p_student_id;
  
  -- Ajouter le rôle 'student' au user
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'student'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;