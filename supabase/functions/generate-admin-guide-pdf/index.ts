import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Embedded markdown content to avoid file access issues
    const markdown = `# 📘 Guide d'Onboarding Administrateur - Regen School

> **Version Débutant - Pas à Pas**  
> Ce guide est conçu pour vous accompagner dans vos premiers pas en tant qu'administrateur de la plateforme Regen School, même si vous n'avez jamais utilisé ce type d'outil auparavant.

---

## Table des Matières

1. [Première Connexion](#première-connexion)
2. [Comprendre l'Interface](#comprendre-linterface)
3. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
4. [Configuration de l'Année Scolaire](#configuration-de-lannée-scolaire)
5. [Gestion des Classes et Niveaux](#gestion-des-classes-et-niveaux)
6. [Gestion des Matières](#gestion-des-matières)
7. [Gestion des Étudiants](#gestion-des-étudiants)
8. [Consultation des Notes](#consultation-des-notes)
9. [Gestion des Documents](#gestion-des-documents)
10. [Journal d'Audit](#journal-daudit)
11. [Bonnes Pratiques](#bonnes-pratiques)
12. [Support et Aide](#support-et-aide)
13. [Récapitulatif du Workflow Recommandé](#récapitulatif-du-workflow-recommandé)

---

## Première Connexion

### Étape 1 : Réception de l'Invitation

Vous recevrez un **email d'invitation** contenant un lien pour créer votre compte administrateur.

**Exemple d'email :**
\`\`\`
Objet : Invitation à rejoindre Regen School
Bonjour,

Vous avez été invité(e) à rejoindre Regen School en tant qu'administrateur.
Cliquez sur le lien ci-dessous pour créer votre compte :
[Créer mon compte]

Ce lien est valable pendant 7 jours.
\`\`\`

### Étape 2 : Création de votre compte

1. Cliquez sur le lien dans l'email
2. Vous arriverez sur une page de création de compte
3. Entrez votre **mot de passe** (minimum 8 caractères)
4. Confirmez votre mot de passe
5. Cliquez sur **"Créer mon compte"**

> **💡 Conseil :** Utilisez un mot de passe fort combinant majuscules, minuscules, chiffres et caractères spéciaux.

### Étape 3 : Première connexion

Une fois votre compte créé, vous serez automatiquement connecté(e) et dirigé(e) vers le **tableau de bord**.

> **ℹ️ Important :** En tant qu'administrateur, vous avez aussi automatiquement le rôle "enseignant". Vous pouvez donc créer des matières et saisir des notes si besoin.

---

## Comprendre l'Interface

### Navigation Principale

L'interface est organisée en plusieurs sections accessibles depuis le menu principal :

- **Tableau de bord** : Vue d'ensemble de l'activité
- **Annuaire** : Liste de tous les étudiants
- **Notes** : Consultation et saisie des notes
- **Matières** : Gestion des matières enseignées
- **Paramètres** : Configuration du système (réservé aux administrateurs)
- **Audit** : Journal de toutes les actions importantes
- **Profil** : Vos informations personnelles

### Bascule de Rôle

En haut à droite de l'interface, vous pouvez basculer entre vos rôles :
- **Mode Administrateur** : Accès complet à tous les paramètres
- **Mode Enseignant** : Vue et fonctionnalités d'un enseignant

> **💡 Astuce :** Utilisez le mode enseignant pour tester l'expérience de vos collègues.

---

## Gestion des Utilisateurs

### Inviter un Nouvel Utilisateur

**Chemin :** Paramètres → Utilisateurs → "Inviter un utilisateur"

1. Cliquez sur le bouton **"Inviter un utilisateur"**
2. Remplissez le formulaire :
   - **Email** : L'adresse email de la personne
   - **Nom complet** : Son nom et prénom
   - **Rôle** : Admin ou Enseignant
   - **Matière(s)** : (Uniquement pour les enseignants) Sélectionnez les matières qu'il/elle enseignera
3. Cliquez sur **"Envoyer l'invitation"**

**Que se passe-t-il ensuite ?**
- La personne reçoit un email d'invitation
- Elle a 7 jours pour créer son compte
- Une fois son compte créé, elle apparaît dans la liste des utilisateurs

### Renvoyer une Invitation

Si un utilisateur n'a pas reçu ou a perdu son email d'invitation :

1. Allez dans **Paramètres → Utilisateurs**
2. Trouvez l'utilisateur dans la liste
3. Cliquez sur le bouton **"Renvoyer l'invitation"**

### Réinitialiser un Mot de Passe

Si un utilisateur a oublié son mot de passe :

1. Allez dans **Paramètres → Utilisateurs**
2. Trouvez l'utilisateur dans la liste
3. Cliquez sur **"Réinitialiser le mot de passe"**
4. L'utilisateur recevra un email avec un lien pour définir un nouveau mot de passe

### Modifier les Informations d'un Enseignant

Pour modifier les matières assignées à un enseignant :

1. Allez dans **Paramètres → Enseignants**
2. Trouvez l'enseignant dans la liste
3. Cliquez sur l'icône **crayon** (édition)
4. Modifiez les informations nécessaires
5. Cliquez sur **"Mettre à jour"**

### Supprimer un Utilisateur

> **⚠️ Attention :** La suppression est définitive et supprime également toutes les données associées (notes saisies, etc.)

1. Allez dans **Paramètres → Utilisateurs**
2. Trouvez l'utilisateur dans la liste
3. Cliquez sur l'icône **poubelle**
4. Confirmez la suppression

---

## Configuration de l'Année Scolaire

### Créer une Nouvelle Année Scolaire

**Chemin :** Paramètres → Années Scolaires → "Nouvelle année scolaire"

1. Cliquez sur **"Nouvelle année scolaire"**
2. Remplissez les informations :
   - **Nom** : Ex. "2024-2025"
   - **Date de début** : Premier jour de l'année scolaire
   - **Date de fin** : Dernier jour de l'année scolaire
   - **Est active** : Cochez si c'est l'année en cours
3. Cliquez sur **"Créer"**

> **💡 Important :** Une seule année scolaire peut être "active" à la fois.

### Créer des Périodes Académiques (Trimestres/Semestres)

Une fois l'année scolaire créée, vous devez définir les périodes :

**Chemin :** Paramètres → Années Scolaires → [Votre année] → "Nouvelle période"

1. Sélectionnez votre année scolaire dans la liste
2. Cliquez sur **"Nouvelle période"**
3. Remplissez :
   - **Nom** : Ex. "Trimestre 1" ou "Semestre 1"
   - **Date de début** : Premier jour de la période
   - **Date de fin** : Dernier jour de la période
4. Cliquez sur **"Créer"**

**Exemple de configuration :**
\`\`\`
Année 2024-2025
├── Trimestre 1 : 01/09/2024 - 20/12/2024
├── Trimestre 2 : 06/01/2025 - 04/04/2025
└── Trimestre 3 : 21/04/2025 - 04/07/2025
\`\`\`

---

## Gestion des Classes et Niveaux

### Créer un Niveau Académique

**Chemin :** Paramètres → Niveaux → "Nouveau niveau"

Les niveaux représentent les années d'études (ex: Licence 1, Master 2, etc.)

1. Cliquez sur **"Nouveau niveau"**
2. Entrez le **nom du niveau** : Ex. "Licence 1"
3. Cliquez sur **"Créer"**

### Créer une Classe

**Chemin :** Paramètres → Classes → "Nouvelle classe"

Les classes sont des groupes d'étudiants au sein d'un niveau.

1. Cliquez sur **"Nouvelle classe"**
2. Remplissez :
   - **Nom** : Ex. "L1-A" ou "L1-Groupe A"
   - **Niveau** : Sélectionnez le niveau associé
   - **Année scolaire** : Sélectionnez l'année concernée
3. Cliquez sur **"Créer"**

**Exemple de structure :**
\`\`\`
Licence 1
├── L1-A (30 étudiants)
├── L1-B (28 étudiants)
└── L1-C (32 étudiants)
\`\`\`

---

## Gestion des Matières

### Accéder à la Gestion des Matières

**Chemin :** Paramètres → Matières

Ici vous pouvez voir toutes les matières créées par les enseignants.

> **ℹ️ Note :** Seuls les enseignants peuvent créer de nouvelles matières. En tant qu'admin, vous pouvez les visualiser et les gérer, mais la création se fait depuis le rôle enseignant.

### Créer une Matière (en tant qu'enseignant)

Si vous devez créer une matière :

1. Basculez en **mode enseignant** (sélecteur en haut à droite)
2. Allez dans **Matières**
3. Cliquez sur **"Nouvelle matière"**
4. Remplissez les informations et créez

---

## Gestion des Étudiants

### Ajouter un Étudiant Manuellement

**Chemin :** Annuaire → "Ajouter un étudiant"

1. Cliquez sur **"Ajouter un étudiant"**
2. Remplissez le formulaire :
   - **Nom** et **Prénom**
   - **Email** (optionnel mais recommandé)
   - **Date de naissance**
   - **Niveau** : Sélectionnez le niveau
   - **Classe** : Sélectionnez la classe
   - **Statut** : Actif par défaut
3. Cliquez sur **"Ajouter"**

### Importer des Étudiants en Masse

Pour gagner du temps, vous pouvez importer plusieurs étudiants via un fichier CSV.

**Chemin :** Annuaire → "Importer des étudiants"

1. Cliquez sur **"Importer des étudiants"**
2. Téléchargez le **modèle CSV** fourni
3. Remplissez le fichier CSV avec vos données :
   - Respectez l'ordre des colonnes
   - Format des dates : JJ/MM/AAAA
   - Vérifiez qu'il n'y a pas de lignes vides
4. Importez le fichier
5. Vérifiez les données dans l'aperçu
6. Cliquez sur **"Confirmer l'import"**

**Format du CSV :**
\`\`\`csv
nom,prenom,email,date_naissance,niveau,classe
Dupont,Jean,jean.dupont@example.com,15/03/2004,Licence 1,L1-A
Martin,Marie,marie.martin@example.com,22/07/2004,Licence 1,L1-A
\`\`\`

### Modifier un Étudiant

1. Dans **Annuaire**, trouvez l'étudiant
2. Cliquez sur sa fiche
3. Cliquez sur **"Modifier"**
4. Effectuez vos modifications
5. Cliquez sur **"Enregistrer"**

### Ajouter une Photo à un Étudiant

1. Ouvrez la fiche de l'étudiant
2. Cliquez sur l'avatar (image de profil)
3. Sélectionnez une image depuis votre ordinateur
4. La photo est automatiquement enregistrée

---

## Consultation des Notes

### Accéder aux Notes

**Chemin :** Notes

Dans cette section, vous pouvez consulter toutes les notes saisies par les enseignants.

### Filtrer les Notes

Utilisez les filtres en haut de la page pour affiner votre recherche :
- **Année scolaire**
- **Période académique**
- **Niveau**
- **Classe**
- **Matière**

### Exporter les Notes

1. Appliquez vos filtres si nécessaire
2. Cliquez sur **"Exporter en CSV"**
3. Le fichier sera téléchargé automatiquement

### Statistiques Automatiques

Le système affiche automatiquement :
- Moyenne de la classe
- Nombre d'étudiants
- Note minimale et maximale
- Distribution des notes

---

## Gestion des Documents

Les enseignants peuvent déposer des documents (cours, TD, supports pédagogiques).

**Chemin :** Paramètres → Documents

### Consulter les Documents

Vous pouvez voir tous les documents déposés par les enseignants, organisés par :
- Catégorie
- Enseignant
- Date de dépôt

### Approuver ou Rejeter un Document

Si la validation est activée dans votre établissement :

1. Allez dans **Paramètres → Documents**
2. Trouvez le document en attente
3. Cliquez sur :
   - **"Approuver"** pour valider le document
   - **"Rejeter"** pour refuser (ajoutez un commentaire expliquant pourquoi)

---

## Journal d'Audit

Le journal d'audit enregistre toutes les actions sensibles effectuées sur la plateforme.

**Chemin :** Audit

### Que trouve-t-on dans le journal d'audit ?

- Création/modification/suppression d'utilisateurs
- Création/modification/suppression d'étudiants
- Saisie et modification de notes
- Imports de données
- Changements de configuration

### Filtrer les Logs

Vous pouvez filtrer par :
- **Utilisateur** : Qui a effectué l'action
- **Type d'action** : Création, modification, suppression
- **Table affectée** : Étudiants, notes, utilisateurs, etc.
- **Date** : Période spécifique

### Détails d'un Log

Chaque entrée du journal contient :
- **Date et heure** précise
- **Utilisateur** qui a effectué l'action
- **Type d'action**
- **Détails** de ce qui a été modifié
- **Anciennes et nouvelles valeurs** (pour les modifications)

**Exemple de log :**
\`\`\`
📅 17/10/2025 14:32:15
👤 Marie Dupont
✏️ Modification
📊 Table : students
🔍 Détails : Changement de classe
   Ancien : L1-A
   Nouveau : L1-B
   Étudiant : Jean Martin
\`\`\`

---

## Bonnes Pratiques

### Sécurité

1. **Mots de passe** : Encouragez l'utilisation de mots de passe forts
2. **Révision régulière** : Vérifiez périodiquement la liste des utilisateurs actifs
3. **Rôles appropriés** : N'accordez le rôle admin qu'aux personnes qui en ont vraiment besoin
4. **Consultation des logs** : Consultez régulièrement le journal d'audit

### Organisation

1. **Structure claire** : 
   - Créez la structure (années → périodes → niveaux → classes) AVANT d'ajouter les étudiants
   - Utilisez des noms de classes cohérents (ex: L1-A, L1-B au lieu de "Groupe 1", "Groupe 2")

2. **Conventions de nommage** :
   - Années scolaires : "2024-2025"
   - Périodes : "Trimestre 1", "Semestre 1"
   - Classes : "L1-A", "M2-INFO-B"

### Gestion des Utilisateurs

1. **Invitations** : Envoyez les invitations au moins une semaine avant le début de l'année
2. **Suivi** : Vérifiez que tous les invités ont créé leur compte
3. **Communication** : Prévenez les enseignants de vérifier leurs spams

### Gestion des Données Étudiantes

1. **Imports CSV** :
   - Testez d'abord avec un petit fichier (5-10 étudiants)
   - Vérifiez l'aperçu avant de confirmer
   - Gardez une copie de sauvegarde de vos fichiers CSV

2. **Vérification** :
   - Après un import, vérifiez quelques fiches aléatoirement
   - Assurez-vous que les classes et niveaux sont corrects

### Sauvegardes et Exports

1. Exportez régulièrement les données importantes (étudiants, notes)
2. Conservez ces exports dans un endroit sûr
3. Effectuez un export complet en fin de chaque période académique

---

## Support et Aide

### En Cas de Problème

1. **Consultez d'abord ce guide** : La solution est peut-être ici
2. **Vérifiez les logs** : Le journal d'audit peut vous aider à comprendre ce qui s'est passé
3. **Contactez le support** : Si le problème persiste

### Ressources Disponibles

- **Guide utilisateur** : Ce document
- **FAQ** : Questions fréquemment posées (accessible depuis le menu d'aide)
- **Tutoriels vidéo** : Disponibles dans la section Aide
- **Support technique** : support@regen-school.com

---

## Récapitulatif du Workflow Recommandé

### Au Début de l'Année Scolaire

\`\`\`
1. Créer l'année scolaire
   ↓
2. Créer les périodes académiques (trimestres/semestres)
   ↓
3. Créer/vérifier les niveaux académiques
   ↓
4. Créer les classes pour chaque niveau
   ↓
5. Inviter les enseignants
   ↓
6. Attendre que les enseignants créent leurs matières
   ↓
7. Importer ou ajouter les étudiants
   ↓
8. Vérifier que tout est en place
   ↓
9. Formation rapide des enseignants
   ↓
10. Début de l'année ! 🎉
\`\`\`

### Pendant l'Année

- Consultation régulière du journal d'audit
- Vérification des notes saisies
- Ajout de nouveaux étudiants si nécessaire
- Gestion des demandes des enseignants

### Fin d'Année

- Export complet des notes
- Export de la liste des étudiants
- Préparation de l'année suivante
- Archivage des données

---

**Félicitations !** 🎊  
Vous êtes maintenant prêt(e) à administrer efficacement la plateforme Regen School.

N'hésitez pas à explorer l'interface, tester les fonctionnalités en environnement de test, et à consulter ce guide aussi souvent que nécessaire.

**Bonne administration !** 📚✨`;

    // Convert markdown to styled HTML
    const html = generateStyledHTML(markdown);

    // Return HTML that can be printed as PDF
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error generating guide:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateStyledHTML(markdown: string): string {
  // Convert markdown to HTML with enhanced styling
  let html = markdown;

  // Escape HTML special characters in code blocks first
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return '<pre><code>' + escapeHtml(code.trim()) + '</code></pre>';
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
    return '<ul>' + match + '</ul>';
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.trim()) return '';
    if (para.startsWith('<h') || para.startsWith('<ul') || 
        para.startsWith('<pre') || para.startsWith('<hr') ||
        para.startsWith('<blockquote')) {
      return para;
    }
    return '<p>' + para + '</p>';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide Administrateur - Regen School</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm;
    }
    
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
      h1, h2, h3 { page-break-after: avoid; }
      pre, blockquote { page-break-inside: avoid; }
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      color: #1a202c;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
    }
    
    h1 {
      color: #2563eb;
      font-size: 2.5em;
      border-bottom: 4px solid #2563eb;
      padding-bottom: 15px;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #1e40af;
      font-size: 2em;
      margin-top: 35px;
      margin-bottom: 15px;
      border-left: 6px solid #3b82f6;
      padding-left: 15px;
    }
    
    h3 {
      color: #3b82f6;
      font-size: 1.5em;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    
    p {
      margin: 12px 0;
      text-align: justify;
    }
    
    pre {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-left: 6px solid #3b82f6;
      padding: 20px;
      overflow-x: auto;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
      margin: 20px 0;
    }
    
    code {
      background: #e5e7eb;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #dc2626;
    }
    
    pre code {
      background: transparent;
      padding: 0;
      color: #1e293b;
    }
    
    blockquote {
      background: #fef3c7;
      border-left: 6px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      font-style: italic;
    }
    
    ul, ol {
      margin: 15px 0;
      padding-left: 40px;
    }
    
    li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    a {
      color: #2563eb;
      text-decoration: none;
      border-bottom: 1px solid #93c5fd;
    }
    
    a:hover {
      border-bottom-color: #2563eb;
    }
    
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 40px 0;
    }
    
    strong {
      color: #1e40af;
      font-weight: 600;
    }
    
    .cover {
      text-align: center;
      padding: 150px 0;
      page-break-after: always;
    }
    
    .cover h1 {
      font-size: 4em;
      border: none;
      margin-bottom: 30px;
      color: #1e40af;
    }
    
    .cover p {
      font-size: 1.8em;
      color: #64748b;
      margin: 20px 0;
    }
    
    .cover .subtitle {
      font-size: 1.4em;
      color: #475569;
      margin-top: 60px;
      font-weight: 500;
    }
    
    .cover .date {
      font-size: 1.1em;
      color: #94a3b8;
      margin-top: 80px;
    }
    
    @media screen {
      body {
        background: #f1f5f9;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>📘 Guide Administrateur</h1>
    <p>Regen School</p>
    <p class="subtitle">Version Débutant - Pas à Pas</p>
    <p class="date">${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  
  <div class="content">
    ${html}
  </div>
  
  <script>
    // Auto-print on load if requested
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoprint') === 'true') {
      window.onload = () => {
        setTimeout(() => window.print(), 500);
      };
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
