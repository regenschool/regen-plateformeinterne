# 🧪 TESTS DE NON-RÉGRESSION - MIGRATION PHASE 3A

## 📋 Vue d'ensemble

Ce fichier documente les tests de non-régression pour valider la migration vers `subject_id`.

## 🎯 Objectifs

1. ✅ Vérifier que **TOUTES** les fonctionnalités existantes fonctionnent toujours
2. ✅ Valider que la migration n'a **cassé aucune feature**
3. ✅ S'assurer que les performances sont maintenues ou améliorées
4. ✅ Confirmer que les données sont correctement migrées

## 📝 Tests Automatisés (E2E)

### Fichier : `e2e/migration-phase3a.spec.ts`

| Test | Description | Statut |
|------|-------------|--------|
| 1. Création de note | Créer une note avec `subject_id` | ⏳ À exécuter |
| 2. Édition de note | Modifier une note existante | ⏳ À exécuter |
| 3. Suppression de note | Supprimer une note | ⏳ À exécuter |
| 4. Import CSV | Tester l'import en masse | ⏳ À exécuter |
| 5. StudentDetailDrawer | Affichage des notes par étudiant | ⏳ À exécuter |
| 6. Console errors | Pas d'erreurs liées à `subject_id` | ⏳ À exécuter |
| 7. Performance | Temps de chargement < 3s | ⏳ À exécuter |
| 8. Données | `subject_id` présent dans les réponses | ⏳ À exécuter |

## 🔧 Comment Exécuter les Tests

### En mode interactif (recommandé)
```bash
npx playwright test e2e/migration-phase3a.spec.ts --ui
```

### En mode headless
```bash
npx playwright test e2e/migration-phase3a.spec.ts
```

### Avec rapport HTML
```bash
npx playwright test e2e/migration-phase3a.spec.ts --reporter=html
npx playwright show-report
```

## ✅ Checklist Tests Manuels

### 1. 📊 Page /grades
- [ ] Sélection d'une matière fonctionne
- [ ] Liste des notes s'affiche correctement
- [ ] Création d'une note → succès
- [ ] Édition d'une note → succès
- [ ] Suppression d'une note → succès
- [ ] Import CSV → pas d'erreur
- [ ] Temps réel → les changements apparaissent immédiatement

### 2. 👥 Page /directory
- [ ] Liste des étudiants s'affiche
- [ ] Clic sur un étudiant → drawer s'ouvre
- [ ] Notes de l'étudiant affichées dans le drawer
- [ ] Pas d'erreurs dans la console

### 3. 📈 Génération de Bulletins
- [ ] Sélection classe/année/semestre fonctionne
- [ ] Génération d'un bulletin individuel → succès
- [ ] Les notes apparaissent correctement dans le bulletin
- [ ] Moyennes calculées correctement

### 4. 📋 Console & Network
- [ ] Aucune erreur liée à `subject_id` dans la console
- [ ] Les requêtes contiennent bien `subject_id`
- [ ] Pas de requêtes qui échouent
- [ ] Temps de réponse < 500ms pour les requêtes de notes

## 🔍 Points de Vigilance

### ⚠️ Problèmes Potentiels

1. **Données manquantes**
   - Vérifier que tous les `subject_id` sont bien renseignés
   - Aucune note avec `subject_id = NULL`

2. **Performances**
   - Les JOINs ne doivent pas ralentir les requêtes
   - Vérifier que les index sont bien utilisés

3. **Backward Compatibility**
   - Les anciennes colonnes sont toujours synchronisées
   - Dual Write fonctionne correctement

4. **Real-time**
   - Les subscriptions Supabase écoutent sur `subject_id`
   - Les changements se propagent immédiatement

## 📊 Critères de Succès

### ✅ Migration validée si :

1. **Tous les tests E2E passent** (8/8)
2. **Tous les tests manuels validés** (checklist complète)
3. **Performance maintenue ou améliorée**
4. **Zéro erreur critique en console**
5. **Données cohérentes** (subject_id + colonnes dénormalisées)

### ❌ Migration à revoir si :

1. Un seul test E2E échoue
2. Des erreurs critiques en console
3. Performance dégradée (> 3s de chargement)
4. Données incohérentes
5. Fonctionnalité cassée

## 🚀 Prochaines Étapes

### Si tous les tests passent ✅ :
1. ✅ Continuer Phase 3A (migrer StudentDetailDrawer + fonction DB)
2. ✅ Passer à Phase 3B (rendre subject_id NOT NULL)

### Si des tests échouent ❌ :
1. ⚠️ **STOP** - Ne pas continuer la migration
2. 🔍 Analyser les erreurs
3. 🛠️ Corriger les problèmes
4. 🔄 Re-tester jusqu'à ce que tous les tests passent

## 📞 En Cas de Problème

Si vous rencontrez des erreurs pendant les tests :

1. **Copier l'erreur exacte**
2. **Noter l'étape où ça a planté**
3. **Vérifier la console navigateur (F12)**
4. **Me partager ces informations**

Je vous aiderai à diagnostiquer et corriger ! 💙

---

## 📈 Historique des Tests

| Date | Tests Passés | Tests Échoués | Notes |
|------|--------------|---------------|-------|
| - | - | - | Première exécution à venir |

---

**Créé le :** 2025-10-23  
**Dernière mise à jour :** 2025-10-23
