-- ============================================================================
-- Finalisation Architecture Enseignants - Subjects
-- ============================================================================
-- Objectifs :
-- 1. Créer FK subjects.teacher_fk_id → teachers.id
-- 2. Nettoyer la colonne obsolète teacher_id (UUID sans FK)
-- 3. Assurer cohérence des données
-- ============================================================================

-- ÉTAPE 1 : Vérifier et nettoyer les données orphelines
-- ============================================================================
-- Supprimer les subjects qui ont un teacher_fk_id invalide
DELETE FROM subjects
WHERE teacher_fk_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teachers WHERE id = subjects.teacher_fk_id);

-- ÉTAPE 2 : Créer la FK subjects.teacher_fk_id → teachers.id
-- ============================================================================
ALTER TABLE subjects
DROP CONSTRAINT IF EXISTS fk_subjects_teacher;

ALTER TABLE subjects
ADD CONSTRAINT fk_subjects_teacher
FOREIGN KEY (teacher_fk_id)
REFERENCES teachers(id)
ON DELETE SET NULL;  -- Si un enseignant est supprimé, la matière reste mais teacher_fk_id = NULL

-- ÉTAPE 3 : Créer un index pour optimiser les requêtes par enseignant
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_active
ON subjects(teacher_fk_id, is_active)
WHERE is_active = true AND deleted_at IS NULL;

-- ÉTAPE 4 : Commenter pour documentation
-- ============================================================================
COMMENT ON COLUMN subjects.teacher_fk_id IS 'FK vers teachers.id - Enseignant assigné à cette matière';
COMMENT ON COLUMN subjects.teacher_id IS 'DEPRECATED - Utiliser teacher_fk_id à la place';
COMMENT ON CONSTRAINT fk_subjects_teacher ON subjects IS 'Garantit l''intégrité référentielle entre matières et enseignants';