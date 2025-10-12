# ADR 001: Utilisation de Supabase comme Backend

## Statut
Accepté

## Contexte
Nous avions besoin d'un backend pour :
- Authentification des utilisateurs
- Stockage de données (étudiants, notes, etc.)
- Gestion de fichiers (photos, documents)
- Real-time pour collaboration multi-utilisateurs

Options considérées :
1. Firebase
2. Supabase
3. Backend custom (Node.js + PostgreSQL)

## Décision
Nous avons choisi **Supabase** (via Lovable Cloud).

## Raisons

### Pour Supabase
- ✅ PostgreSQL (SQL relationnel vs NoSQL Firebase)
- ✅ Row-Level Security natif (sécurité fine)
- ✅ Real-time inclus
- ✅ Open source
- ✅ Intégration native avec Lovable
- ✅ Pas de vendor lock-in (auto-hébergeable)
- ✅ Edge Functions (Deno)
- ✅ Prix transparent et prévisible

### Contre Firebase
- ❌ NoSQL compliqué pour relations complexes
- ❌ Security rules moins flexibles que RLS
- ❌ Vendor lock-in Google
- ❌ Prix imprévisible à l'échelle

### Contre Backend Custom
- ❌ Temps de développement long
- ❌ Maintenance infrastructure
- ❌ Besoin d'expertise DevOps

## Conséquences

### Positives
- Développement rapide (auth, DB, storage inclus)
- Sécurité robuste (RLS policies)
- Scalabilité automatique
- Real-time facile à implémenter

### Négatives
- Dépendance à Supabase (mitigé : open source)
- Courbe d'apprentissage PostgreSQL/RLS
- Limites du tier gratuit

### Neutres
- Migration possible vers auto-hébergement si nécessaire
- Compatibilité avec écosystème PostgreSQL

## Références
- [Supabase Documentation](https://supabase.com/docs)
- [Lovable Cloud](https://docs.lovable.dev/features/cloud)

## Date
2025-10-10
