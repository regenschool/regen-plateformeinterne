# Guide d'Onboarding Administrateur - Regen School

## Bienvenue sur la plateforme Regen School

Ce guide vous accompagne pas à pas dans la prise en main de la plateforme en tant qu'administrateur.

---

## 📋 Table des matières

1. [Première connexion](#première-connexion)
2. [Comprendre l'interface](#comprendre-linterface)
3. [Gestion des utilisateurs](#gestion-des-utilisateurs)
4. [Configuration de l'année scolaire](#configuration-de-lannée-scolaire)
5. [Gestion des classes et niveaux](#gestion-des-classes-et-niveaux)
6. [Gestion des matières](#gestion-des-matières)
7. [Gestion des étudiants](#gestion-des-étudiants)
8. [Consultation des notes](#consultation-des-notes)
9. [Gestion des documents](#gestion-des-documents)
10. [Journal d'audit](#journal-daudit)
11. [Bonnes pratiques](#bonnes-pratiques)

---

## 🔐 Première connexion

### Étape 1 : Réception de l'invitation
Vous avez reçu un email d'invitation avec un lien unique. Ce lien reste valide jusqu'à ce que vous créiez votre compte.

### Étape 2 : Création de votre compte
1. Cliquez sur le lien dans l'email
2. Vous êtes redirigé vers la page "Compléter mon profil"
3. **Définissez votre mot de passe** (minimum 8 caractères)
4. Remplissez vos informations de profil :
   - Téléphone (optionnel)
   - Adresse (optionnel)
5. Cliquez sur "Enregistrer"

### Étape 3 : Première visite
Après validation, vous êtes automatiquement connecté et redirigé vers le tableau de bord.

**Note importante** : En tant qu'administrateur, vous avez également le rôle "enseignant" pour pouvoir accéder à toutes les fonctionnalités.

---

## 🎯 Comprendre l'interface

### Navigation principale
La navigation se trouve dans la barre latérale gauche :

- **📊 Tableau de bord** : Vue d'ensemble de la plateforme
- **👥 Annuaire** : Liste des étudiants et enseignants
- **📝 Notes** : Consultation et gestion des notes
- **📚 Matières** : Gestion de vos matières (vue enseignant)
- **✓ Tests** : Gestion des évaluations
- **❓ Quiz** : Création de quiz publics
- **⚙️ Paramètres** : Configuration de la plateforme (admin uniquement)
- **🔍 Audit** : Journal des actions (admin uniquement)
- **👤 Profil** : Votre profil personnel

### Basculer entre les rôles
En haut à droite, vous pouvez basculer entre le mode "Administrateur" et "Enseignant" pour voir les différentes vues.

---

## 👥 Gestion des utilisateurs

### Inviter un nouvel utilisateur

1. **Accéder à la gestion des utilisateurs**
   - Cliquez sur **⚙️ Paramètres** dans le menu
   - Sélectionnez l'onglet **Utilisateurs**

2. **Créer une invitation**
   - Cliquez sur **➕ Inviter un utilisateur**
   - Remplissez le formulaire :
     - **Email** : L'adresse email de l'utilisateur
     - **Nom complet** : Prénom et nom
     - **Rôle** : Choisissez entre :
       - `Admin` : Accès complet + rôle enseignant automatique
       - `Enseignant` : Gestion des notes et matières uniquement
   - Cliquez sur **Envoyer l'invitation**

3. **Suivi de l'invitation**
   - L'utilisateur reçoit un email avec un lien d'invitation
   - Dans la liste, son statut apparaît comme "En attente"
   - Une fois le profil complété, le statut passe à "Actif"

### Renvoyer une invitation
Si un utilisateur n'a pas cliqué sur le lien :
1. Trouvez l'utilisateur dans la liste
2. Cliquez sur **🔄 Renvoyer l'invitation**

### Réinitialiser un mot de passe
Pour un utilisateur qui a oublié son mot de passe :
1. Trouvez l'utilisateur dans la liste
2. Cliquez sur **🔑 Réinitialiser le mot de passe**
3. Un lien de réinitialisation est envoyé par email

### Modifier les informations d'un enseignant
1. Cliquez sur **✏️** à côté de l'enseignant
2. Modifiez le nom complet et/ou le téléphone
3. Cliquez sur **Enregistrer**

### Supprimer un utilisateur
⚠️ **Attention** : Cette action est irréversible
1. Cliquez sur **🗑️** à côté de l'utilisateur
2. Confirmez la suppression
3. Toutes les données associées (rôles, profils) seront supprimées

### Gérer les rôles
Vous pouvez ajouter/retirer des rôles en cliquant sur les badges :
- 🛡️ **Admin**
- 👨‍🏫 **Enseignant**

**Note** : Un utilisateur doit avoir au moins un rôle.

---

## 📅 Configuration de l'année scolaire

### Créer une nouvelle année scolaire

1. **Accéder aux paramètres**
   - Cliquez sur **⚙️ Paramètres** → **Années scolaires**

2. **Ajouter une année**
   - Cliquez sur **➕ Nouvelle année scolaire**
   - Remplissez :
     - **Libellé** : Ex. "2024-2025"
     - **Date de début** : 1er septembre 2024
     - **Date de fin** : 30 juin 2025
     - **Active** : ✓ (une seule année peut être active)
   - Cliquez sur **Créer**

3. **Activer/Désactiver une année**
   - Utilisez le commutateur dans la liste
   - **Important** : Activer une année désactive automatiquement l'ancienne

### Créer des périodes académiques

Les périodes académiques permettent de découper l'année (trimestres, semestres).

1. **Accéder aux périodes**
   - **⚙️ Paramètres** → **Périodes académiques**

2. **Ajouter une période**
   - Cliquez sur **➕ Nouvelle période**
   - Remplissez :
     - **Libellé** : Ex. "Trimestre 1", "Semestre 1"
     - **Année scolaire** : Sélectionnez l'année
     - **Date de début** : 1er septembre 2024
     - **Date de fin** : 31 décembre 2024
     - **Active** : ✓
   - Cliquez sur **Créer**

**Astuce** : Créez toutes vos périodes dès le début de l'année pour faciliter la saisie des notes.

---

## 🏫 Gestion des classes et niveaux

### Créer des niveaux

1. **Accéder aux niveaux**
   - **⚙️ Paramètres** → **Niveaux**

2. **Ajouter un niveau**
   - Cliquez sur **➕ Nouveau niveau**
   - Entrez le nom : Ex. "Licence 1", "Master 2", "BTS 1ère année"
   - Cliquez sur **Créer**

### Créer des classes

1. **Accéder aux classes**
   - **⚙️ Paramètres** → **Classes**

2. **Ajouter une classe**
   - Cliquez sur **➕ Nouvelle classe**
   - Remplissez :
     - **Nom** : Ex. "L1-A", "M2-Informatique"
     - **Niveau** : Sélectionnez le niveau
     - **Capacité** : Nombre maximum d'étudiants (optionnel)
     - **Active** : ✓
   - Cliquez sur **Créer**

**Astuce** : Créez d'abord tous vos niveaux, puis toutes vos classes pour faciliter l'organisation.

---

## 📚 Gestion des matières

### Accéder à la gestion des matières

- **⚙️ Paramètres** → **Matières**

Cette section liste toutes les matières créées par tous les enseignants.

### Créer une nouvelle matière (en tant qu'enseignant)

Pour créer une matière, basculez en mode enseignant :
1. Allez dans **📚 Matières** (menu principal)
2. Cliquez sur **➕ Nouvelle matière**
3. Remplissez :
   - **Nom de la matière** : Ex. "Mathématiques", "Histoire"
   - **Classe** : Sélectionnez la classe
   - **Année scolaire** : Sélectionnez l'année active
   - **Période** : Trimestre ou semestre
4. Cliquez sur **Créer**

---

## 👨‍🎓 Gestion des étudiants

### Ajouter un étudiant manuellement

1. **Accéder à l'annuaire**
   - Cliquez sur **👥 Annuaire**

2. **Ajouter un étudiant**
   - Cliquez sur **➕ Ajouter un étudiant**
   - Remplissez le formulaire :
     - **Prénom** et **Nom**
     - **Classe** : Sélectionnez la classe
     - **Année scolaire** : Sélectionnez l'année active
     - **Date de naissance** (optionnel)
     - **Besoins spécifiques** (optionnel)
     - **Formation** (optionnel)
     - **Entreprise** (optionnel - pour alternants)
   - Cliquez sur **Ajouter**

### Importer des étudiants en masse (CSV)

1. **Préparer votre fichier CSV**
   - Format : `prenom,nom,classe,date_naissance,besoins_specifiques,formation,entreprise`
   - Exemple :
     ```csv
     Jean,Dupont,L1-A,2000-05-15,,Licence Informatique,
     Marie,Martin,L1-A,2001-03-20,,Licence Informatique,Entreprise ABC
     ```

2. **Importer le fichier**
   - Dans l'annuaire, cliquez sur **📥 Importer des étudiants**
   - Sélectionnez votre fichier CSV
   - Vérifiez l'aperçu
   - Cliquez sur **Importer**

### Modifier un étudiant

1. Trouvez l'étudiant dans l'annuaire
2. Cliquez sur **✏️ Modifier**
3. Modifiez les informations
4. Cliquez sur **Enregistrer**

### Ajouter une photo à un étudiant

1. Dans la fiche de l'étudiant, cliquez sur l'avatar
2. Sélectionnez une photo
3. Elle est automatiquement sauvegardée

---

## 📊 Consultation des notes

### Accéder aux notes

- Cliquez sur **📝 Notes** dans le menu principal

### Filtrer les notes

Utilisez les filtres en haut de la page :
- **Année scolaire**
- **Classe**
- **Matière**
- **Période académique**
- **Type d'évaluation** : Contrôle continu, Examen, TP, Projet

### Exporter les notes

1. Appliquez vos filtres
2. Cliquez sur **📥 Exporter CSV**
3. Le fichier CSV est téléchargé avec toutes les notes filtrées

### Visualiser les statistiques

Les notes affichent automatiquement :
- **Moyenne de la classe**
- **Note minimale**
- **Note maximale**
- **Graphiques** : Distribution des notes

---

## 📁 Gestion des documents

### Documents des enseignants

1. **Accéder aux documents**
   - **⚙️ Paramètres** → **Documents enseignants**

2. **Catégories de documents**
   Vous pouvez gérer les catégories requises pour l'onboarding des enseignants.

3. **Consulter les documents d'un enseignant**
   - Sélectionnez un enseignant
   - Voir tous ses documents téléversés
   - Statut : En attente / Approuvé / Rejeté

4. **Approuver/Rejeter un document**
   - Cliquez sur le document
   - Changez le statut
   - Ajoutez des notes si nécessaire

---

## 🔍 Journal d'audit

### Accéder à l'audit

- Cliquez sur **🔍 Audit** dans le menu principal

### Utiliser l'audit

Le journal d'audit enregistre **toutes les actions** effectuées sur les données sensibles :
- Création, modification, suppression d'utilisateurs
- Modifications de notes
- Suppression d'étudiants
- Connexions/déconnexions
- Exports de données

### Filtrer les logs

Utilisez les filtres pour :
- **Utilisateur** : Voir les actions d'une personne spécifique
- **Table** : Filtrer par type de données (students, grades, etc.)
- **Action** : INSERT, UPDATE, DELETE, LOGIN, EXPORT
- **Date** : Période spécifique

### Voir les détails d'une action

Chaque log affiche :
- **Date et heure précise**
- **Utilisateur** qui a effectué l'action
- **Action** effectuée
- **Table** concernée
- **Anciennes valeurs** (avant modification)
- **Nouvelles valeurs** (après modification)
- **Adresse IP** et **navigateur** utilisé

**Cas d'usage** :
- Traçabilité complète des modifications
- Investigations en cas de problème
- Conformité RGPD

---

## ✅ Bonnes pratiques

### Sécurité

1. **Mot de passe fort** : Minimum 12 caractères, avec majuscules, chiffres et symboles
2. **Ne partagez jamais** votre mot de passe
3. **Déconnexion** : Déconnectez-vous sur les ordinateurs partagés
4. **Vérification des actions** : Consultez régulièrement l'audit

### Organisation

1. **Créez la structure avant les données** :
   - Années scolaires → Périodes → Niveaux → Classes → Étudiants

2. **Nommage cohérent** :
   - Classes : "L1-A", "M2-Info" (court et explicite)
   - Matières : Noms complets

3. **Synchronisation** :
   - Utilisez le bouton **Synchroniser les référentiels** après avoir modifié niveaux/classes/années pour mettre à jour les données existantes

### Gestion des utilisateurs

1. **Invitations groupées** : Préparez une liste pour inviter plusieurs enseignants d'un coup
2. **Vérification** : Vérifiez que les enseignants ont bien complété leur profil avant de leur assigner des tâches
3. **Rôles appropriés** : Ne donnez le rôle admin qu'aux personnes de confiance

### Données des étudiants

1. **Import CSV recommandé** pour les grandes promotions
2. **Vérifiez les doublons** avant d'importer
3. **Photos** : Ajoutez les photos progressivement, pas obligatoires au départ

### Sauvegarde et exports

1. **Exports réguliers** : Exportez les notes à la fin de chaque période
2. **Conservation** : Gardez les exports CSV en sauvegarde locale
3. **Audit** : Consultez l'audit mensuellement pour vérifier l'activité

---

## 🆘 Support et aide

### En cas de problème

1. **Consultez ce guide** en premier
2. **Vérifiez l'audit** si une donnée semble incorrecte
3. **Contactez le support technique** si le problème persiste

### Ressources

- **Guide utilisateur enseignant** : Partagez-le avec vos enseignants
- **FAQ** : Questions fréquentes (à venir)
- **Vidéos tutorielles** : Démonstrations visuelles (à venir)

---

## 🎓 Résumé du workflow recommandé

### Au début de l'année

1. ✅ Créer l'année scolaire
2. ✅ Créer les périodes académiques
3. ✅ Créer/Vérifier les niveaux
4. ✅ Créer/Vérifier les classes
5. ✅ Inviter les enseignants
6. ✅ Attendre que les enseignants complètent leur profil
7. ✅ Importer les étudiants (CSV recommandé)
8. ✅ Les enseignants créent leurs matières
9. ✅ Les enseignants saisissent les notes

### Pendant l'année

- 📊 Consulter régulièrement les notes
- 👥 Ajouter de nouveaux étudiants si besoin
- 🔍 Vérifier l'audit mensuellement
- 📁 Suivre les documents enseignants
- 📥 Exporter les notes à chaque fin de période

### Fin d'année

- 📥 Export final de toutes les notes
- 📋 Archivage des données
- 🔄 Préparation de l'année suivante
- 🗄️ Désactivation de l'année scolaire terminée

---

**Félicitations !** Vous êtes maintenant prêt à utiliser Regen School en tant qu'administrateur. 🎉

Pour toute question, n'hésitez pas à consulter à nouveau ce guide ou à contacter le support.
