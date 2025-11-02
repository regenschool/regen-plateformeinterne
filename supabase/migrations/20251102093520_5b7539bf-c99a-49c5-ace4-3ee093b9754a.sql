-- ============================================================================
-- MIGRATION CORRECTIVE - Finalisation teacher_id → teacher_fk_id
-- ============================================================================
-- Forcer la suppression de teacher_id et rendre teacher_fk_id obligatoire
-- ============================================================================

-- ÉTAPE 1 : Vérifier et migrer toute donnée manquante
-- ============================================================================
-- S'assurer que TOUS les subjects actifs ont un teacher_fk_id
UPDATE subjects
SET teacher_fk_id = (
  SELECT id FROM teachers WHERE user_id = subjects.teacher_id LIMIT 1
)
WHERE teacher_fk_id IS NULL
  AND teacher_id IS NOT NULL
  AND is_active = true
  AND deleted_at IS NULL;

-- ÉTAPE 2 : Supprimer les subjects sans teacher_fk_id (orphelins)
-- ============================================================================
DELETE FROM subjects
WHERE teacher_fk_id IS NULL
  AND is_active = true;

-- ÉTAPE 3 : Rendre teacher_fk_id NOT NULL
-- ============================================================================
-- Maintenant que toutes les données sont migrées, on peut rendre la colonne obligatoire
ALTER TABLE subjects
ALTER COLUMN teacher_fk_id SET NOT NULL;

-- ÉTAPE 4 : Supprimer la colonne teacher_id obsolète
-- ============================================================================
-- Attention : Cette colonne peut être référencée ailleurs, donc on la supprime en dernier
ALTER TABLE subjects
DROP COLUMN teacher_id CASCADE;

-- ÉTAPE 5 : Nettoyer les grades qui référencent teacher_id (user_id)
-- ============================================================================
-- Note: grades.teacher_id contient user_id, pas teachers.id
-- On garde cette colonne car elle référence auth.users indirectement
-- Mais on doit s'assurer qu'elle est cohérente

-- Supprimer les grades dont le teacher_id ne correspond à aucun teacher
DELETE FROM grades
WHERE teacher_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM teachers WHERE user_id = grades.teacher_id
  )
  AND is_active = true;

-- Même chose pour assessments
DELETE FROM assessments
WHERE teacher_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM teachers WHERE user_id = assessments.teacher_id
  )
  AND is_active = true;

-- ÉTAPE 6 : Documenter la nouvelle structure
-- ============================================================================
COMMENT ON COLUMN subjects.teacher_fk_id IS 'FK OBLIGATOIRE vers teachers.id - Enseignant assigné à cette matière';
COMMENT ON TABLE subjects IS 'Matières - Architecture normalisée finale - teacher_id supprimée, utiliser teacher_fk_id';
COMMENT ON COLUMN grades.teacher_id IS 'Référence auth.users.id (user_id de l''enseignant) - À conserver pour compatibilité';
COMMENT ON COLUMN assessments.teacher_id IS 'Référence auth.users.id (user_id de l''enseignant) - À conserver pour compatibilité';