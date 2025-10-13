# 🔄 Guide de Migration - Remix du Projet Regen Directory Master

Ce guide vous accompagne dans la migration complète de votre projet lors du remix.

## 📋 Vue d'ensemble

Le remix crée une copie complète du code et du schéma de base de données, mais **ne copie pas les données**. Ce guide vous permet de sauvegarder et restaurer toutes vos données.

---

## 🚨 CE QUI SERA PERDU SANS CETTE PROCÉDURE

- ❌ **Toutes les données** : étudiants, notes, enseignants, matières, etc.
- ❌ **Les fichiers uploadés** : photos d'étudiants, documents, factures PDF
- ❌ **Les comptes utilisateurs** : tous les comptes devront être recréés
- ❌ **Les secrets/clés API** : si vous en avez configuré

---

## ✅ ÉTAPE 1 : EXPORT DES DONNÉES (AVANT LE REMIX)

### 1.1 Accéder au backend actuel

1. Dans le projet `regen-directory-master` actuel (compte Tanguy Foujols)
2. Cliquez sur le bouton **"View Backend"** dans Lovable
3. Accédez à l'éditeur SQL

### 1.2 Exécuter le script d'export

1. Copiez le contenu du fichier `1-export-data.sql`
2. Collez-le dans l'éditeur SQL du backend
3. Exécutez le script
4. **Résultat** : Des fichiers CSV sont créés dans `/tmp/`

### 1.3 Télécharger les fichiers CSV

Les fichiers suivants ont été créés :

**Données de référence :**
- `school_years.csv` - Années scolaires
- `levels.csv` - Niveaux
- `classes.csv` - Classes
- `academic_periods.csv` - Périodes académiques

**Utilisateurs et rôles :**
- `auth_users.csv` - Liste des utilisateurs (pour référence)
- `user_roles.csv` - Rôles des utilisateurs
- `dev_role_overrides.csv` - Droits admin dev

**Enseignants :**
- `teachers.csv` - Enseignants (table principale)
- `teacher_profiles.csv` - Profils détaillés

**Étudiants :**
- `students.csv` - Étudiants
- `student_enrollments.csv` - Inscriptions

**Données pédagogiques :**
- `subjects.csv` - Matières
- `grades.csv` - Notes

**Documents et factures :**
- `school_documents.csv` - Métadonnées des documents
- `teacher_invoices.csv` - Métadonnées des factures

**Autres :**
- `user_notes.csv` - Notes personnelles
- `public_quiz_links.csv` - Liens de quiz
- `quiz_scores.csv` - Scores de quiz

⚠️ **IMPORTANT** : Téléchargez **tous** ces fichiers CSV sur votre ordinateur

### 1.4 Sauvegarder manuellement les fichiers importants

**Photos d'étudiants** :
1. Notez les URLs dans `students.csv` (colonne `photo_url`)
2. Téléchargez manuellement les photos importantes

**Documents et factures** :
1. Consultez `school_documents.csv` et `teacher_invoices.csv`
2. Téléchargez les fichiers importants depuis le storage

---

## 🔄 ÉTAPE 2 : EFFECTUER LE REMIX

1. **Connectez-vous** avec le compte **Regen School**
2. Ouvrez le projet `regen-directory-master`
3. Cliquez sur le **nom du projet** en haut à gauche
4. Allez dans **Settings**
5. Cliquez sur **"Remix this project"**
6. Attendez la fin de la copie
7. **Vérifiez** que le nouveau projet s'ouvre correctement

---

## ✅ ÉTAPE 3 : IMPORT DES DONNÉES (APRÈS LE REMIX)

### 3.1 Accéder au backend du nouveau projet

1. Dans le **nouveau projet remixé** (compte Regen School)
2. Cliquez sur **"View Backend"**
3. Accédez à l'éditeur SQL

### 3.2 Uploader les fichiers CSV

1. Dans le backend, accédez à la section **Storage** ou **Files**
2. Créez un dossier `/tmp/` si nécessaire
3. Uploadez **tous les fichiers CSV** téléchargés à l'étape 1.3

### 3.3 Exécuter le script d'import

1. Copiez le contenu du fichier `2-import-data.sql`
2. Collez-le dans l'éditeur SQL
3. **Exécutez le script**
4. Vérifiez qu'aucune erreur n'apparaît

### 3.4 Vérifier l'import

Le script affiche automatiquement un résumé :

```
table_name              | count
------------------------|-------
school_years           | X
levels                 | X
classes                | X
students               | X
grades                 | X
...
```

Vérifiez que les nombres correspondent à vos données d'origine.

---

## 👥 ÉTAPE 4 : RECRÉER LES COMPTES UTILISATEURS

Les comptes utilisateurs **ne peuvent pas** être migrés automatiquement.

### 4.1 Consulter la liste des utilisateurs

Ouvrez le fichier `auth_users.csv` pour voir la liste des emails.

### 4.2 Recréer les comptes admin

1. Dans le nouveau projet, allez sur la page de **signup**
2. Créez les comptes administrateurs avec les **mêmes emails** que dans `auth_users.csv`
3. Les rôles seront automatiquement restaurés grâce à `user_roles.csv`

### 4.3 Recréer les comptes enseignants

1. Pour chaque enseignant dans `teachers.csv`
2. Créez un compte avec l'email correspondant
3. Le rôle "teacher" sera automatiquement assigné

⚠️ **Les utilisateurs devront définir de nouveaux mots de passe**

---

## 📁 ÉTAPE 5 : RESTAURER LES FICHIERS

### 5.1 Photos d'étudiants

1. Accédez au **Storage** du nouveau backend
2. Créez le bucket `student-photos` (si pas auto-créé)
3. Uploadez manuellement les photos sauvegardées
4. Les URLs dans la base de données pointent vers les anciens chemins
5. **Option A** : Réuploadez avec les mêmes noms de fichiers
6. **Option B** : Mettez à jour les URLs dans la table `students`

### 5.2 Documents et factures

1. Vérifiez `school_documents.csv` pour la liste des documents
2. Réuploadez les fichiers importants dans le bucket `school-documents`
3. Même processus pour les factures PDF

---

## 🔧 ÉTAPE 6 : VÉRIFICATIONS FINALES

### 6.1 Tester les fonctionnalités

- [ ] Connexion admin fonctionne
- [ ] Connexion enseignant fonctionne
- [ ] Liste des étudiants s'affiche correctement
- [ ] Les notes sont visibles
- [ ] Les matières sont listées
- [ ] Les classes et niveaux sont corrects

### 6.2 Vérifier les permissions

- [ ] Les enseignants voient uniquement leurs données
- [ ] Les admins ont accès à tout
- [ ] Les RLS policies fonctionnent

### 6.3 Tester les uploads

- [ ] Upload de photos d'étudiants
- [ ] Upload de documents
- [ ] Génération de factures PDF

---

## 🆘 DÉPANNAGE

### Erreur "relation does not exist"

➡️ Le schéma n'a pas été correctement copié lors du remix
➡️ Vérifiez que toutes les migrations ont été appliquées

### Erreur "violates foreign key constraint"

➡️ L'ordre d'import est important
➡️ Réexécutez le script `2-import-data.sql` dans l'ordre

### Les compteurs sont à 0 mais les données sont là

➡️ Normal, les vérifications se font après l'import
➡️ Rechargez la page et vérifiez manuellement

### Les utilisateurs ne peuvent pas se connecter

➡️ Les comptes doivent être **recréés manuellement**
➡️ Utilisez les mêmes emails que dans `auth_users.csv`

### Les photos ne s'affichent pas

➡️ Les fichiers du storage ne sont **pas copiés** lors du remix
➡️ Réuploadez manuellement les photos importantes

---

## 📊 CHECKLIST COMPLÈTE

### Avant le remix
- [ ] Script `1-export-data.sql` exécuté
- [ ] Tous les CSV téléchargés sur mon ordinateur
- [ ] Photos importantes sauvegardées
- [ ] Documents importants sauvegardés
- [ ] Liste des emails utilisateurs notée

### Pendant le remix
- [ ] Connecté avec le compte Regen School
- [ ] Remix effectué via Settings > Remix
- [ ] Nouveau projet ouvert et fonctionnel

### Après le remix
- [ ] Fichiers CSV uploadés dans `/tmp/` du nouveau backend
- [ ] Script `2-import-data.sql` exécuté sans erreur
- [ ] Vérification des comptages OK
- [ ] Comptes admin recréés
- [ ] Comptes enseignants recréés
- [ ] Photos réuploadées
- [ ] Documents réuploadés
- [ ] Tests fonctionnels réalisés
- [ ] Ancien projet archivé/supprimé

---

## ⏱️ ESTIMATION DU TEMPS

- **Export des données** : 10-15 minutes
- **Remix du projet** : 5-10 minutes
- **Import des données** : 10-15 minutes
- **Recréation des comptes** : 20-30 minutes (selon le nombre)
- **Upload des fichiers** : 30-60 minutes (selon la quantité)
- **Tests et vérifications** : 30 minutes

**TOTAL ESTIMÉ** : 2 à 3 heures

---

## 📞 BESOIN D'AIDE ?

Si vous rencontrez des problèmes lors de la migration :

1. Vérifiez que tous les CSV ont bien été téléchargés
2. Relisez les messages d'erreur SQL
3. Contactez le support Lovable si le problème persiste
4. Conservez **toujours** l'ancien projet jusqu'à ce que le nouveau soit 100% fonctionnel

---

## ✅ MIGRATION TERMINÉE

Une fois tous les tests réalisés avec succès :

1. Mettez à jour vos favoris/bookmarks
2. Informez les utilisateurs du nouveau projet
3. Archivez ou supprimez l'ancien projet (après une période de sécurité)

**Félicitations ! Votre migration est terminée.** 🎉
