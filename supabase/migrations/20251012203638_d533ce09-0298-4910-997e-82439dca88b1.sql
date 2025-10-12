-- ============================================
-- HARMONISATION ARCHITECTURE : Enseignants = Utilisateurs avec rôle (v3 - avec nettoyage)
-- ============================================

-- 1. Ajouter 'teacher' à l'enum app_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'teacher';
  END IF;
END $$;

-- 2. Supprimer les contraintes de FK qui dépendent de teachers.id
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_assigned_teacher_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_teacher_fk_id_fkey;

-- 3. Maintenant on peut changer la PK de teachers
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_pkey CASCADE;
ALTER TABLE teachers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE teachers ADD PRIMARY KEY (user_id);

-- 4. NETTOYER les orphelins avant de recréer les FK
-- Mettre à NULL les teacher_fk_id qui ne correspondent à aucun teachers.user_id
UPDATE students 
SET assigned_teacher_id = NULL
WHERE assigned_teacher_id IS NOT NULL
  AND assigned_teacher_id NOT IN (SELECT user_id FROM teachers);

UPDATE subjects 
SET teacher_fk_id = NULL
WHERE teacher_fk_id IS NOT NULL
  AND teacher_fk_id NOT IN (SELECT user_id FROM teachers);

-- 5. Recréer les FK (maintenant propres)
ALTER TABLE students 
  ADD CONSTRAINT students_assigned_teacher_id_fkey 
  FOREIGN KEY (assigned_teacher_id) 
  REFERENCES teachers(user_id) 
  ON DELETE SET NULL;

ALTER TABLE subjects 
  ADD CONSTRAINT subjects_teacher_fk_id_fkey 
  FOREIGN KEY (teacher_fk_id) 
  REFERENCES teachers(user_id) 
  ON DELETE SET NULL;

-- 6. Créer un trigger pour synchroniser teachers <-> user_roles
CREATE OR REPLACE FUNCTION sync_teacher_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'teacher'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM user_roles 
    WHERE user_id = OLD.user_id 
    AND role = 'teacher'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_teacher_change ON teachers;
CREATE TRIGGER on_teacher_change
  AFTER INSERT OR DELETE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_role();

-- 7. Migrer les données existantes : créer les user_roles pour teachers
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'teacher'::app_role
FROM teachers
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Mettre à jour les politiques RLS pour utiliser has_role('teacher')
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Users with teacher role can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Users can update their own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Teachers and admins can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can manage all teachers" ON teachers;

-- Nouvelle architecture : enseignants = utilisateurs avec rôle teacher
CREATE POLICY "Teachers and admins can view all teachers"
ON teachers
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own teacher profile"
ON teachers
FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert teachers"
ON teachers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete teachers"
ON teachers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Synchroniser l'email depuis auth.users automatiquement
CREATE OR REPLACE FUNCTION sync_teacher_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_teacher_insert_update ON teachers;
CREATE TRIGGER on_teacher_insert_update
  BEFORE INSERT OR UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_email();

-- 10. Commentaires pour documentation
COMMENT ON TABLE teachers IS 'Extension de profil pour les utilisateurs ayant le rôle teacher. user_id = PK liée à auth.users. Un enseignant est un utilisateur avec rôle teacher dans user_roles';
COMMENT ON COLUMN teachers.user_id IS 'PRIMARY KEY - Référence à auth.users. Un enseignant = un utilisateur avec rôle teacher';
COMMENT ON COLUMN teachers.email IS 'Email synchronisé automatiquement depuis auth.users via trigger (lecture seule)';
