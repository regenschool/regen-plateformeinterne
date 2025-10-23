# Phase 3A - Migration vers Architecture Normalisée

## 🎯 Objectif
Migrer progressivement le code pour utiliser `subject_id` (FK) au lieu des colonnes dénormalisées (`subject`, `class_name`, `school_year`, `semester`, `teacher_id`).

## ✅ Statut Actuel

### Phase 1 - Terminée ✓
- Ajout de la colonne `subject_id` (UUID, nullable) dans `grades` et `assessments`
- Création des index pour optimisation

### Phase 2 - Terminée ✓
- Population des `subject_id` existants via UPDATE avec JOIN

### Phase 3A - EN COURS 🔄
#### Fichiers créés :
1. ✅ `src/hooks/useGradesNormalized.ts` - Nouveaux hooks avec JOIN sur subjects
2. ✅ `src/hooks/useSubjectId.ts` - Utilitaire de transition
3. ✅ `src/components/GradeEntryDialog.tsx` - Modifié pour accepter `subjectId` (backward compatible)

#### Stratégie de migration :
- **Backward Compatibility** : Les anciens codes continuent de fonctionner
- **Gradual Adoption** : Nouveaux composants utilisent les hooks normalisés
- **Dual Write** : On écrit à la fois `subject_id` ET les colonnes dénormalisées
- **Progressive Cleanup** : Une fois tous les composants migrés, on passe à Phase 3B

## 📋 Prochaines Étapes

### Composants à migrer (ordre de priorité) :
1. ⏳ `src/pages/Grades.tsx` - Page principale (1431 lignes)
   - Utiliser `useGradesNormalized()` au lieu de requêtes directes
   - Passer `subjectId` aux composants enfants
   
2. ⏳ `src/components/EditGradeDialog.tsx`
   - Utiliser `useUpdateGradeNormalized()`
   
3. ⏳ `src/components/BulkGradeImport.tsx`
   - Récupérer `subject_id` avant insertion
   
4. ⏳ `src/components/StudentDetailDrawer.tsx`
   - Utiliser `useStudentGradesNormalized()`

5. ⏳ Fonction DB `calculate_class_subject_stats()`
   - Réécrire pour utiliser JOIN sur subjects via subject_id

### Tests à effectuer :
- [ ] Création de note avec `subject_id`
- [ ] Édition de note existante
- [ ] Suppression de note
- [ ] Import en masse
- [ ] Génération de bulletins
- [ ] Statistiques de classe

## 🔧 Phase 3B - À venir
Une fois Phase 3A validée :
1. Rendre `subject_id` NOT NULL
2. Supprimer les colonnes dénormalisées
3. Mettre à jour les index
4. Mettre à jour les RLS policies si nécessaire

## 📊 Avantages attendus
- **Performance** : JOINs optimisés, moins de colonnes indexées
- **Intégrité** : CASCADE automatique, impossible d'avoir des orphelins
- **Maintenabilité** : Une seule source de vérité (table `subjects`)
- **Évolutivité** : Ajout facile de nouvelles propriétés (coef, catégorie, etc.)

## ⚠️ Points d'attention
- Les anciens hooks (`useGrades.ts`) restent disponibles pendant la transition
- Tous les nouveaux développements doivent utiliser les hooks normalisés
- Vérifier les performances des JOINs (devrait être optimal avec les index)
