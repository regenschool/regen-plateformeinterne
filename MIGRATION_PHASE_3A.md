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

### Composants migrés ✅ :
1. ✅ `src/pages/Grades.tsx` - Page principale MIGRÉ
   - Utilise `useGradesNormalized()` avec `subject_id`
   - Passe `subjectId` à tous les composants enfants
   - Real-time via `useRealtimeGrades(subjectId)`
   
2. ✅ `src/components/EditGradeDialog.tsx` - MIGRÉ
   - Utilise `useUpdateGradeNormalized()` et `useDeleteGradeNormalized()`
   
3. ✅ `src/hooks/useRealtimeGrades.ts` - MIGRÉ
   - Écoute sur `subject_id` au lieu de colonnes dénormalisées

4. ✅ `src/components/BulkGradeImport.tsx` - MIGRÉ
   - Utilise `useAddGradeNormalized()` avec `subject_id`
   - Import en série avec gestion d'erreurs granulaire
   
5. ✅ `src/components/StudentDetailDrawer.tsx` - MIGRÉ
   - Utilise `useStudentGradesNormalized()` pour récupérer les notes de l'étudiant

6. ✅ Fonction DB `calculate_class_subject_stats()` - MIGRÉ
   - Réécriture complète avec JOIN sur subjects via subject_id
   - Architecture normalisée avec index optimisés

### Tests à effectuer :
- [x] Création de note avec `subject_id` ✅
- [x] Édition de note existante ✅
- [x] Suppression de note ✅
- [x] Import en masse ✅
- [ ] Génération de bulletins
- [x] Statistiques de classe ✅ (via fonction DB migrée)
- [ ] Affichage notes étudiant (StudentDetailDrawer)
- [ ] Tests E2E de non-régression

## 🔧 Phase 3B - À venir
Une fois Phase 3A validée :
1. Rendre `subject_id` NOT NULL
2. Supprimer les colonnes dénormalisées
3. Mettre à jour les index
4. Mettre à jour les RLS policies si nécessaire

### ✅ Résolution pour Phase 3B

**Import CSV de matières avec enseignant inexistant - RÉSOLU :**
- **Fichier modifié:** `src/components/ImportSubjectsDialog.tsx`
- **Solution implémentée:** Validation intelligente avec détection de doublons
- **Fonctionnement:**
  1. **Détection fuzzy** : Calcul de similarité Levenshtein (seuil 70%) pour détecter emails similaires
  2. **Étape de validation** : Interface utilisateur pour choisir l'action avant import
  3. **Options par enseignant manquant :**
     - Créer nouveau compte (via edge function `invite-user`)
     - Utiliser un enseignant existant similaire
     - Ignorer cette ligne
  4. **Prévention doublons** : Suggestions automatiques si email similaire détecté
- **Avantages:**
  - Évite les erreurs d'intégrité (`teacher_id` toujours défini)
  - Prévient les doublons par fautes de frappe
  - Contrôle manuel pour chaque décision
  - Prêt pour Phase 3B (`teacher_id NOT NULL` possible)

## 📊 Avantages attendus
- **Performance** : JOINs optimisés, moins de colonnes indexées
- **Intégrité** : CASCADE automatique, impossible d'avoir des orphelins
- **Maintenabilité** : Une seule source de vérité (table `subjects`)
- **Évolutivité** : Ajout facile de nouvelles propriétés (coef, catégorie, etc.)

## ⚠️ Points d'attention
- Les anciens hooks (`useGrades.ts`) restent disponibles pendant la transition
- Tous les nouveaux développements doivent utiliser les hooks normalisés
- Vérifier les performances des JOINs (devrait être optimal avec les index)
