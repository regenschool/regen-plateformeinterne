# Historique des Bugs et Corrections

Ce document recense tous les bugs corrigés dans l'application pour assurer qu'ils ne se reproduisent pas lors de futures modifications.

---

## 🐛 Bug #1 : Duplication des notes lors de la complétion d'épreuve

**Date de découverte** : 2025-10-12
**Sévérité** : Haute
**Status** : ✅ Corrigé

### Description du problème
Lorsqu'un enseignant complète une épreuve existante en ajoutant des notes pour des étudiants manquants, les notes se dupliquent au lieu de créer une seule entrée par étudiant/épreuve.

### Cause racine
Le code utilisait `supabase.from("grades").upsert(gradeData, { onConflict: '...' })` qui **n'est pas supporté par l'API Supabase**. La clause `onConflict` n'existe pas dans Supabase, donc l'upsert créait systématiquement de nouvelles lignes au lieu de mettre à jour les existantes.

### Fichiers concernés
- `src/components/GradeEntryDialog.tsx` (lignes 200-230)
- `src/hooks/useGrades.ts` (hook `useAddGrade`, lignes 82-104) - ⚠️ **RÉINTRODUIT puis RE-CORRIGÉ le 2025-10-12**

### Solution appliquée
Remplacer l'upsert avec `onConflict` par une logique explicite :
1. **Vérifier** d'abord si une note existe déjà pour cette combinaison étudiant/épreuve
2. **UPDATE** si elle existe
3. **INSERT** sinon

```typescript
// ✅ CORRECT - Vérifier puis UPDATE ou INSERT
const { data: existingGrade } = await supabase
  .from('grades')
  .select('id')
  .eq('student_id', student.id)
  .eq('subject', subject)
  .eq('school_year', subjectMetadata?.schoolYear || '')
  .eq('semester', subjectMetadata?.semester || '')
  .eq('assessment_name', assessmentName.trim())
  .eq('assessment_type', assessmentType as any)
  .maybeSingle();

if (existingGrade) {
  // Update existing grade
  await supabase.from('grades').update(gradeData).eq('id', existingGrade.id);
} else {
  // Insert new grade
  await supabase.from('grades').insert([gradeData]);
}
```

```typescript
// ❌ INCORRECT - Ne fonctionne pas avec Supabase
await supabase.from("grades").upsert(gradeData, {
  onConflict: 'student_id,subject,school_year,semester,assessment_name,assessment_type,assessment_custom_label'
});
```

### Tests de non-régression
Pour vérifier que ce bug ne revient pas :
1. Créer une épreuve avec des notes pour quelques étudiants
2. Compléter l'épreuve en ajoutant des notes pour les étudiants manquants
3. Vérifier qu'il n'y a qu'une seule note par étudiant dans la base de données

### Prévention
- ⚠️ **NE JAMAIS** utiliser `onConflict` avec Supabase (ni dans les composants, ni dans les hooks)
- ✅ **TOUJOURS** vérifier l'existence avant insert/update pour éviter les doublons
- ✅ Utiliser `.maybeSingle()` pour les vérifications d'existence
- ⚠️ **ATTENTION**: Ce bug a été réintroduit dans `useGrades.ts` lors de la normalisation de la base de données

### Régression détectée et corrigée
**Date**: 2025-10-12 (même jour)
**Contexte**: Lors de l'adaptation du code pour la nouvelle architecture normalisée, le hook `useAddGrade` dans `src/hooks/useGrades.ts` utilisait à nouveau `.upsert()` avec `onConflict`, réintroduisant le bug.
**Correction appliquée**: Même logique check-then-update/insert implémentée dans le hook.

---

## 📋 Template pour futurs bugs

Lors de la découverte d'un nouveau bug, documenter ici avec :
- **Date de découverte**
- **Sévérité** (Basse / Moyenne / Haute / Critique)
- **Description du problème**
- **Cause racine**
- **Fichiers concernés**
- **Solution appliquée**
- **Tests de non-régression**
- **Prévention**

---

## 🔄 Processus de gestion des bugs

### Avant toute modification majeure du code :
1. ✅ Lire ce fichier `BUGS_FIXES.md`
2. ✅ Vérifier si les fichiers modifiés sont concernés par des bugs passés
3. ✅ S'assurer que les corrections précédentes sont préservées
4. ✅ Ajouter des tests pour les cas critiques

### Après correction d'un bug :
1. ✅ Documenter le bug dans ce fichier
2. ✅ Tester la correction
3. ✅ Vérifier qu'aucune régression n'a été introduite
4. ✅ Informer l'utilisateur de la correction et de la prévention

---

## 💡 Bonnes pratiques générales

### Supabase
- Ne jamais utiliser `onConflict` dans `.upsert()` - non supporté
- Toujours utiliser `.maybeSingle()` pour les requêtes qui peuvent ne rien retourner
- Utiliser `.single()` uniquement quand on est sûr qu'une ligne existe

### React Query
- Toujours invalider les caches concernés après une mutation
- Utiliser des queryKeys cohérentes et prédictibles

### Gestion des formulaires
- Réinitialiser les états lors de la fermeture des dialogs
- Vérifier les duplicatas avant insertion en base

---

*Dernière mise à jour : 2025-10-12*
