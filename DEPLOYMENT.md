# 🚀 Guide de Mise en Production - GradeFlow

Ce guide vous accompagne pas à pas pour mettre votre application en ligne. **Aucune compétence technique requise !**

---

## 📋 Checklist Avant Déploiement

Avant de publier, vérifiez que tout fonctionne bien :

- [ ] Vous pouvez vous connecter avec votre compte admin
- [ ] Vous pouvez ajouter un étudiant
- [ ] Vous pouvez ajouter une note
- [ ] La page "Qualité & Performance" affiche des données
- [ ] Vous avez fait un export de sauvegarde depuis la page Qualité

---

## 🌐 Étape 1 : Publier l'Application

### Sur Lovable (le plus simple)

1. **Cliquez sur le bouton "Publish"** en haut à droite de l'éditeur Lovable
2. Lovable va déployer automatiquement votre app
3. Vous recevrez une URL du type : `votre-app.lovable.app`
4. **C'est tout !** Votre app est en ligne 🎉

### Tester votre app publiée

1. Ouvrez l'URL dans un nouvel onglet
2. Connectez-vous avec votre compte
3. Vérifiez que tout fonctionne comme dans l'éditeur

---

## 🏠 Étape 2 : Connecter Votre Propre Domaine (Optionnel)

Si vous voulez une adresse personnalisée comme `notes.monecole.fr` :

### A. Acheter un nom de domaine

Si vous n'en avez pas déjà un, achetez-le chez :
- **OVH** (français, facile) : ovh.com
- **Gandi** (français) : gandi.net
- **Google Domains** : domains.google

💰 Prix : ~10-15€/an

### B. Connecter le domaine à Lovable

1. Dans Lovable, allez dans **Project > Settings > Domains**
2. Cliquez sur "**Connect Domain**"
3. Entrez votre nom de domaine (ex: `notes.monecole.fr`)
4. Lovable va vous donner des instructions à suivre

### C. Configurer chez votre hébergeur de domaine

Lovable va vous demander d'ajouter un **Enregistrement A** :

```
Type: A
Nom: @ (ou www)
Valeur: 185.158.133.1
```

**Comment faire chez les principaux hébergeurs :**

#### OVH
1. Connectez-vous à votre espace client OVH
2. Allez dans "Noms de domaine"
3. Cliquez sur votre domaine > "Zone DNS"
4. Cliquez "Ajouter une entrée"
5. Choisissez "A"
6. Laissez le sous-domaine vide (ou mettez @)
7. Mettez l'IP : `185.158.133.1`
8. Validez

#### Gandi
1. Connectez-vous à Gandi
2. "Mes domaines" > Cliquez sur votre domaine
3. "Enregistrements DNS"
4. "Ajouter un enregistrement"
5. Type: A, Nom: @, Valeur: `185.158.133.1`
6. Enregistrez

#### Google Domains
1. Connectez-vous à Google Domains
2. Cliquez sur votre domaine > "DNS"
3. "Gérer les enregistrements personnalisés"
4. Créer un enregistrement : @ / A / 185.158.133.1
5. Enregistrez

### D. Attendre la propagation DNS

- ⏰ Ça peut prendre **24 à 48 heures** (souvent beaucoup moins)
- Vous pouvez vérifier sur : https://dnschecker.org
- Le certificat SSL (https) sera automatiquement installé par Lovable

---

## 📱 Étape 3 : Installer comme Application Mobile

Votre app est maintenant une **PWA** (Progressive Web App). Vos utilisateurs peuvent l'installer comme une vraie app !

### Sur iPhone/iPad (Safari)

1. Ouvrez votre site dans Safari
2. Appuyez sur le bouton "Partager" 📤
3. Faites défiler et choisissez "**Sur l'écran d'accueil**"
4. Nommez l'app "GradeFlow" (ou autre)
5. Appuyez sur "Ajouter"
6. L'icône apparaît sur votre écran d'accueil ✅

### Sur Android (Chrome)

1. Ouvrez votre site dans Chrome
2. Appuyez sur les **trois points** en haut à droite
3. Choisissez "**Installer l'application**" ou "Ajouter à l'écran d'accueil"
4. Confirmez
5. L'icône apparaît sur votre écran d'accueil ✅

### Sur Ordinateur (Chrome/Edge)

1. Ouvrez votre site
2. Regardez dans la barre d'adresse : il y a une **petite icône d'installation** ⬇️
3. Cliquez dessus
4. Cliquez "Installer"
5. L'app s'ouvre dans sa propre fenêtre ✅

---

## 🔒 Étape 4 : Sécurité & Comptes Utilisateurs

### Créer des comptes pour vos professeurs

**Option A : Depuis l'interface (recommandé)**
1. Connectez-vous en tant qu'admin
2. Allez dans **Paramètres > Utilisateurs**
3. Cliquez "Ajouter un utilisateur"
4. Entrez l'email du professeur
5. Attribuez le rôle "Enseignant"
6. Le professeur recevra un email pour créer son mot de passe

**Option B : Laisser les professeurs s'inscrire**
1. Partagez le lien de votre app
2. Les professeurs cliquent sur "S'inscrire"
3. Vous validez ensuite leur compte dans **Paramètres > Utilisateurs**

### Désactiver la confirmation d'email (pour les tests)

Pour accélérer les tests sans avoir à confirmer par email :

1. Allez dans votre backend Lovable Cloud
   <lov-actions>
     <lov-open-backend>Ouvrir le Backend</lov-open-backend>
   </lov-actions>
2. Allez dans "Authentication" > "Providers" > "Email"
3. Décochez "Confirm email"
4. Sauvegardez

⚠️ **IMPORTANT** : Réactivez cette option avant la vraie mise en production !

---

## 💾 Étape 5 : Sauvegardes Régulières

### Automatique (déjà en place)

Lovable Cloud fait des sauvegardes automatiques de votre base de données :
- 📅 **Quotidiennes** : conservées 7 jours
- 🔄 Vous pouvez restaurer en cas de problème

### Manuel (recommandé chaque mois)

1. Allez dans **Qualité & Performance**
2. Cliquez sur "**Export Backup**"
3. Un fichier JSON se télécharge avec toutes vos données
4. 💾 Conservez ce fichier en sécurité (Google Drive, clé USB...)

**Quand faire un backup manuel ?**
- 📆 Une fois par mois
- 📝 Avant une grosse modification
- 🎓 À la fin de chaque année scolaire

---

## 📊 Étape 6 : Surveiller Votre Application

### Page Qualité & Performance

Consultez cette page **une fois par semaine** :

1. Allez dans **Gestion > Qualité & Performance**
2. Vérifiez que le score global est **> 75%**
3. Si une métrique est en **rouge** : 
   - Prenez une capture d'écran
   - Contactez le support Lovable
   - Faites un backup

### Archivage des anciennes années

Pour garder l'application rapide :

1. Allez dans **Paramètres > Archivage**
2. Sélectionnez les années scolaires terminées
3. Cliquez "Archiver"
4. Les données restent accessibles mais n'encombrent plus l'app

---

## ⚙️ Étape 7 : Configuration Backend (Déjà Fait !)

Vous n'avez **rien à faire** ici, tout est déjà configuré automatiquement par Lovable Cloud :

✅ Base de données Supabase  
✅ Authentification  
✅ Stockage de fichiers  
✅ Certificat SSL  
✅ Sauvegardes automatiques  

Si vous voulez voir les détails techniques (optionnel) :
<lov-actions>
  <lov-open-backend>Voir le Backend</lov-open-backend>
</lov-actions>

---

## 🆘 En Cas de Problème

### L'application ne se charge pas

1. Vérifiez votre connexion internet
2. Essayez de vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
3. Si le problème persiste, consultez la page Qualité

### Impossible de se connecter

1. Vérifiez que vous utilisez le bon email/mot de passe
2. Utilisez "Mot de passe oublié" pour réinitialiser
3. Vérifiez que votre compte est bien créé (demandez à un admin)

### Les données ne s'affichent pas

1. Rechargez la page (F5)
2. Vérifiez la page Qualité
3. Si ça persiste plus de 5 minutes : contactez le support

### Restaurer une ancienne version

Si vous avez fait une erreur :

1. Allez dans l'historique du projet Lovable
2. Trouvez la version qui fonctionnait
3. Cliquez sur "Restore"

Ou utilisez un backup manuel (voir Étape 5)

---

## 📞 Support & Aide

### Documentation Lovable
- Guide officiel : https://docs.lovable.dev
- Communauté Discord : https://discord.gg/lovable

### Votre Checklist de Démarrage

- [ ] ✅ App publiée sur Lovable
- [ ] ✅ Compte admin créé et testé
- [ ] ✅ Premier backup manuel effectué
- [ ] ✅ PWA installée sur au moins un appareil
- [ ] ✅ Page Qualité consultée et OK
- [ ] 🎯 (Optionnel) Domaine personnalisé configuré
- [ ] 🎯 (Optionnel) Comptes professeurs créés

---

## 🎉 Félicitations !

Votre application est maintenant en production et accessible à tous vos utilisateurs !

**Prochaines étapes recommandées :**
1. Formez vos professeurs à l'utilisation
2. Faites un backup manuel avant la rentrée
3. Consultez la page Qualité une fois par semaine

**Besoin d'aide ?** N'hésitez pas à revenir vers l'assistant Lovable ! 💙
