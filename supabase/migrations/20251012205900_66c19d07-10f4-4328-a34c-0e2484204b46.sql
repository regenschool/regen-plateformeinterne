-- ============================================
-- ÉVOLUTION ARCHITECTURE : Gestion Multi-Années des Étudiants
-- ============================================

-- 1. Créer la classe "Alumni" si elle n'existe pas
INSERT INTO classes (name, level, is_active)
VALUES ('Alumni', 'Alumni', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Créer la table student_enrollments pour gérer les inscriptions annuelles
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  assigned_teacher_id UUID REFERENCES teachers(user_id) ON DELETE SET NULL,
  
  -- Compatibilité avec anciennes colonnes TEXT
  class_name TEXT,
  
  -- Informations spécifiques à l'année (peuvent changer)
  company TEXT,
  academic_background TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Un étudiant ne peut avoir qu'une seule inscription par année
  UNIQUE(student_id, school_year_id)
);

-- 3. Activer RLS sur student_enrollments
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour student_enrollments
CREATE POLICY "Anyone can view enrollments for public quizzes"
ON student_enrollments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create enrollments"
ON student_enrollments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrollments"
ON student_enrollments FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete enrollments"
ON student_enrollments FOR DELETE
USING (true);

-- 5. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year ON student_enrollments(school_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_lookup ON student_enrollments(student_id, school_year_id);

-- 6. Trigger pour mettre à jour updated_at
CREATE TRIGGER update_student_enrollments_updated_at
  BEFORE UPDATE ON student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Migrer les données existantes vers 2025-2026
-- D'abord, s'assurer que l'année 2025-2026 existe
INSERT INTO school_years (label, start_date, end_date, is_active)
VALUES ('2025-2026', '2025-09-01', '2026-06-30', true)
ON CONFLICT (label) DO UPDATE SET is_active = true
RETURNING id;

-- Migrer tous les étudiants existants vers student_enrollments pour 2025-2026
INSERT INTO student_enrollments (
  student_id, 
  school_year_id, 
  class_id, 
  level_id, 
  assigned_teacher_id,
  class_name,
  company,
  academic_background
)
SELECT 
  s.id,
  sy.id,
  s.class_id,
  s.level_id,
  s.assigned_teacher_id,
  s.class_name,
  s.company,
  s.academic_background
FROM students s
CROSS JOIN school_years sy
WHERE sy.label = '2025-2026'
ON CONFLICT (student_id, school_year_id) DO NOTHING;

-- 8. Créer une vue enrichie pour student_enrollments
CREATE OR REPLACE VIEW v_student_enrollments_enriched 
WITH (security_invoker = true)
AS
SELECT 
  se.*,
  s.first_name,
  s.last_name,
  s.birth_date,
  s.age,
  s.photo_url,
  s.special_needs,
  c.name as class_name_from_ref,
  c.level as class_level,
  l.name as level_name,
  sy.label as school_year_label,
  sy.is_active as school_year_is_active,
  t.full_name as assigned_teacher_name,
  t.email as assigned_teacher_email
FROM student_enrollments se
LEFT JOIN students s ON se.student_id = s.id
LEFT JOIN classes c ON se.class_id = c.id
LEFT JOIN levels l ON se.level_id = l.id
LEFT JOIN school_years sy ON se.school_year_id = sy.id
LEFT JOIN teachers t ON se.assigned_teacher_id = t.user_id;

-- 9. Documentation
COMMENT ON TABLE student_enrollments IS 'Inscriptions annuelles des étudiants. Permet à un étudiant d''apparaître dans plusieurs années scolaires avec des classes différentes';
COMMENT ON COLUMN student_enrollments.student_id IS 'FK vers students - informations invariantes de l''étudiant';
COMMENT ON COLUMN student_enrollments.school_year_id IS 'FK vers school_years - année scolaire de cette inscription';
COMMENT ON COLUMN student_enrollments.class_id IS 'FK vers classes - classe pour cette année (peut être Alumni)';
COMMENT ON COLUMN student_enrollments.company IS 'Entreprise pour cette année (peut changer d''une année à l''autre)';

-- 10. Note : Les colonnes dans students (class_id, level_id, etc.) sont conservées pour compatibilité
-- mais seront progressivement remplacées par student_enrollments
COMMENT ON TABLE students IS 'Informations de base des étudiants (invariantes). Les inscriptions annuelles sont dans student_enrollments';
COMMENT ON COLUMN students.class_id IS 'DÉPRÉCIÉ - Utiliser student_enrollments pour les inscriptions par année';
COMMENT ON COLUMN students.school_year_id IS 'DÉPRÉCIÉ - Utiliser student_enrollments pour les inscriptions par année';