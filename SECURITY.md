# Guide de Sécurité - Application de Gestion Scolaire

## 🔒 Vue d'ensemble

Ce document décrit les mesures de sécurité implémentées dans l'application.

## 1. Audit Logging (Journal d'Audit)

### Tables Concernées
Toutes les opérations (INSERT, UPDATE, DELETE) sur les tables suivantes sont automatiquement loggées :
- `students` - Étudiants
- `grades` - Notes
- `subjects` - Matières
- `teachers` - Enseignants
- `user_roles` - Rôles utilisateurs

### Structure des Logs
Chaque log contient :
- **user_id** : Utilisateur ayant effectué l'action
- **action** : Type d'opération (INSERT, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT)
- **table_name** : Table concernée
- **record_id** : ID de l'enregistrement modifié
- **old_values** : Valeurs avant modification (pour UPDATE et DELETE)
- **new_values** : Nouvelles valeurs (pour INSERT et UPDATE)
- **ip_address** : Adresse IP (si disponible)
- **user_agent** : Agent utilisateur
- **created_at** : Timestamp de l'action

### Accès aux Logs
- Les **administrateurs** peuvent voir tous les logs
- Les **utilisateurs** peuvent voir leurs propres logs
- Les logs sont accessibles via l'interface d'administration

### Rétention
- Les logs sont conservés **90 jours** par défaut
- Un nettoyage automatique peut être configuré via la fonction `cleanup_old_audit_logs()`

## 2. Rate Limiting

### Limites par Endpoint

| Endpoint | Max Requêtes | Fenêtre |
|----------|-------------|---------|
| Import Étudiants | 10 | 60 min |
| Import Matières | 10 | 60 min |
| Import Notes en Masse | 20 | 60 min |
| Export de Données | 30 | 60 min |
| Création Étudiant | 100 | 60 min |
| Création Note | 200 | 60 min |

### Implémentation
```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';

try {
  await checkRateLimit(RATE_LIMITS.IMPORT_STUDENTS);
  // Effectuer l'opération
} catch (error) {
  if (error instanceof RateLimitError) {
    toast.error(`Limite atteinte. Réessayez dans ${error.retryAfter}s`);
  }
}
```

### Nettoyage
Les entrées de rate limiting sont automatiquement supprimées après **1 heure** via la fonction `cleanup_old_rate_limits()`.

## 3. Row Level Security (RLS)

### Principe
Toutes les tables ont des politiques RLS activées qui garantissent que :
- Les **enseignants** ne voient que leurs propres données
- Les **administrateurs** ont accès à toutes les données
- Les données sensibles sont protégées

### Politiques Principales

#### Students
```sql
-- Les enseignants voient tous les étudiants (pour les cours)
CREATE POLICY "Authenticated users can view all students"
ON students FOR SELECT TO authenticated USING (true);

-- Seuls les utilisateurs authentifiés peuvent modifier
CREATE POLICY "Authenticated users can update students"
ON students FOR UPDATE TO authenticated USING (true);
```

#### Grades
```sql
-- Les enseignants voient uniquement leurs notes
CREATE POLICY "Teachers can view their own grades"
ON grades FOR SELECT USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));

-- Les enseignants créent uniquement leurs notes
CREATE POLICY "Teachers can create grades"
ON grades FOR INSERT WITH CHECK (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));
```

#### Subjects
```sql
-- Les enseignants voient uniquement leurs matières
CREATE POLICY "Teachers can view their own subjects"
ON subjects FOR SELECT USING (auth.uid() = teacher_id OR has_role(auth.uid(), 'admin'));
```

## 4. Security Headers

Les en-têtes de sécurité suivants sont configurés :

### Content Security Policy (CSP)
Prévient les attaques XSS en contrôlant les sources de contenu autorisées.

### Strict-Transport-Security (HSTS)
Force l'utilisation de HTTPS pendant 1 an.

### X-Frame-Options
Empêche l'application d'être chargée dans une iframe (protection contre le clickjacking).

### X-Content-Type-Options
Empêche le navigateur de deviner le type MIME.

### X-XSS-Protection
Active la protection XSS native du navigateur.

### Referrer-Policy
Contrôle les informations envoyées dans l'en-tête Referer.

### Permissions-Policy
Désactive les fonctionnalités du navigateur non nécessaires (géolocalisation, caméra, etc.).

## 5. Validation des Entrées

### Côté Client
Toutes les entrées utilisateur sont validées avec **Zod** :
```typescript
const studentSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  // ...
});
```

### Côté Serveur
Les RLS policies et contraintes de base de données assurent une validation supplémentaire.

## 6. Authentification

### Méthodes Supportées
- Email/mot de passe
- OAuth (si configuré)

### Sécurité des Sessions
- Sessions stockées dans localStorage
- Refresh automatique des tokens
- Expiration configurable

### Rôles
- **admin** : Accès complet
- **teacher** : Accès limité à ses données

## 7. Gestion des Secrets

### Variables d'Environnement
Toutes les clés sensibles sont stockées dans :
- `.env` (développement local)
- Supabase Secrets (production)

### Secrets Utilisés
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement)

## 8. Bonnes Pratiques

### Pour les Développeurs
1. ✅ **Toujours** utiliser les queries Supabase paramétrées (jamais de SQL brut)
2. ✅ **Valider** toutes les entrées côté client ET serveur
3. ✅ **Tester** les RLS policies avant déploiement
4. ✅ **Vérifier** les logs d'audit régulièrement
5. ✅ **Mettre à jour** les dépendances régulièrement

### Pour les Administrateurs
1. ✅ **Surveiller** les logs d'audit pour détecter les activités suspectes
2. ✅ **Configurer** des alertes pour les tentatives de rate limiting
3. ✅ **Exporter** les logs d'audit régulièrement pour archivage
4. ✅ **Réviser** les permissions des utilisateurs trimestriellement
5. ✅ **Tester** la restauration des backups régulièrement

## 9. Procédures d'Incident

### En cas de Fuite de Données Suspectée
1. 🚨 Consulter immédiatement les logs d'audit
2. 🚨 Identifier l'utilisateur et la portée
3. 🚨 Révoquer les accès si nécessaire
4. 🚨 Notifier les parties concernées
5. 🚨 Renforcer les mesures de sécurité

### En cas d'Attaque par Déni de Service
1. 🚨 Vérifier les tables `rate_limits`
2. 🚨 Identifier les IPs suspectes
3. 🚨 Bloquer au niveau firewall si nécessaire
4. 🚨 Ajuster les limites de rate limiting

## 10. Checklist de Sécurité Pré-Déploiement

- [ ] Tous les secrets sont dans les variables d'environnement
- [ ] RLS activé sur toutes les tables
- [ ] Audit logging configuré
- [ ] Rate limiting testé
- [ ] Security headers configurés
- [ ] Validation des entrées implémentée
- [ ] Tests de sécurité passés
- [ ] Documentation à jour
- [ ] Backups configurés
- [ ] Plan de réponse aux incidents documenté

## 11. Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Content Security Policy Reference](https://content-security-policy.com/)

## 12. Contact

En cas de découverte de vulnérabilité, contactez immédiatement l'équipe de sécurité.
