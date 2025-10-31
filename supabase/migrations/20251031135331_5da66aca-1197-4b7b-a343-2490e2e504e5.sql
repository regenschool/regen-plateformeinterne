-- Phase 3B: Finalisation migration avec gestion des dépendances
-- ============================================================

-- ÉTAPE 1: Rendre subject_id NOT NULL
ALTER TABLE grades 
  ALTER COLUMN subject_id SET NOT NULL;

ALTER TABLE assessments 
  ALTER COLUMN subject_id SET NOT NULL;

-- ÉTAPE 2: Supprimer les vues qui dépendent des colonnes dénormalisées
DROP MATERIALIZED VIEW IF EXISTS student_visible_grades CASCADE;
DROP VIEW IF EXISTS v_student_grades_with_visibility CASCADE;
DROP VIEW IF EXISTS v_grades_enriched CASCADE;

-- ÉTAPE 3: Supprimer les colonnes dénormalisées
ALTER TABLE grades 
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS class_name,
  DROP COLUMN IF EXISTS school_year,
  DROP COLUMN IF EXISTS semester,
  DROP COLUMN IF EXISTS teacher_name;

-- ÉTAPE 4: Recréer les vues avec architecture normalisée
CREATE OR REPLACE VIEW v_grades_enriched AS
SELECT 
  g.*,
  s.subject_name,
  s.class_name,
  s.school_year,
  s.semester,
  s.teacher_name,
  st.first_name || ' ' || st.last_name as student_name
FROM grades g
INNER JOIN subjects s ON s.id = g.subject_id
LEFT JOIN students st ON st.id = g.student_id;

CREATE OR REPLACE VIEW v_student_grades_with_visibility AS
SELECT 
  g.*,
  s.subject_name,
  s.class_name,
  s.school_year,
  s.semester,
  a.is_visible_to_students
FROM grades g
INNER JOIN subjects s ON s.id = g.subject_id
LEFT JOIN assessments a ON (
  a.assessment_name = g.assessment_name
  AND a.assessment_type = g.assessment_type
  AND a.subject_id = g.subject_id
);

CREATE MATERIALIZED VIEW student_visible_grades AS
SELECT 
  g.*,
  s.subject_name,
  s.class_name,
  s.school_year,
  s.semester
FROM grades g
INNER JOIN subjects s ON s.id = g.subject_id
INNER JOIN assessments a ON (
  a.assessment_name = g.assessment_name
  AND a.assessment_type = g.assessment_type
  AND a.subject_id = g.subject_id
)
WHERE a.is_visible_to_students = true;

CREATE UNIQUE INDEX idx_student_visible_grades_unique 
ON student_visible_grades(id);

-- ÉTAPE 5: Optimiser les index
DROP INDEX IF EXISTS idx_grades_subject_class_year;
DROP INDEX IF EXISTS idx_grades_subject;
DROP INDEX IF EXISTS idx_grades_class;

CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_student ON grades(subject_id, student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);

-- ÉTAPE 6: Ajouter foreign keys
ALTER TABLE grades 
  ADD CONSTRAINT fk_grades_subject 
  FOREIGN KEY (subject_id) 
  REFERENCES subjects(id) 
  ON DELETE RESTRICT;

ALTER TABLE assessments 
  ADD CONSTRAINT fk_assessments_subject 
  FOREIGN KEY (subject_id) 
  REFERENCES subjects(id) 
  ON DELETE RESTRICT;

-- ÉTAPE 7: Statistiques
ANALYZE grades;
ANALYZE assessments;
ANALYZE subjects;