# 📋 Checklist Pré-Production

## ✅ Phase 1 - Sécurité (COMPLÉTÉ)

### Configuration Auth
- [x] Auto-confirm email **DÉSACTIVÉ** (utilisateurs doivent confirmer leur email)
- [x] Anonymous users **DÉSACTIVÉ**
- [ ] **ACTION REQUISE**: Activer "Password Leak Protection" dans les paramètres auth
  - Aller dans Backend > Authentication > Settings
  - Activer "Password Strength" et "Leaked Password Protection"

### RLS Policies
- [x] Audit logs vérifiés (admins et users)
- [x] Students table sécurisée (auth requis)
- [x] Grades table sécurisée (teachers + admins)
- [x] Subjects table sécurisée (teachers + admins)
- [x] Teachers table sécurisée (teachers + admins)
- [x] User roles table sécurisée (admins only)

### Tests Sécurité
- [x] Tests XSS ajoutés (`e2e/security.spec.ts`)
- [x] Tests SQL injection ajoutés
- [x] Tests headers de sécurité ajoutés
- [x] Tests sanitization ajoutés

**🔴 ACTION IMMÉDIATE**: Lancer `npx playwright test e2e/security.spec.ts`

## ✅ Phase 2 - Tests (COMPLÉTÉ)

### Tests E2E
- [x] Tests auth améliorés (`e2e/auth.spec.ts`)
- [x] Tests protected routes ajoutés
- [x] Tests validation ajoutés
- [x] Tests sécurité créés (`e2e/security.spec.ts`)
- [x] Tests performance créés (`e2e/performance.spec.ts`)

### Tests Manuels à Faire
- [ ] **ACTION REQUISE**: Créer 2-3 comptes enseignants
- [ ] **ACTION REQUISE**: Tester avec plusieurs navigateurs (Chrome, Firefox, Safari)
- [ ] **ACTION REQUISE**: Tester sur mobile (iPhone + Android)
- [ ] **ACTION REQUISE**: Tester l'installation PWA
- [ ] **ACTION REQUISE**: Tester avec connexion lente (throttling)

**🔴 ACTION IMMÉDIATE**: Lancer tous les tests
```bash
npx playwright test
npx playwright test --ui # Mode interactif
```

## ✅ Phase 3 - Monitoring & Performance (COMPLÉTÉ)

### Sentry (Error Tracking)
- [x] Sentry configuré dans `src/lib/sentry.ts`
- [x] Integration browser tracing activée
- [x] Session replay activé (10% sessions, 100% errors)
- [x] Filtrage erreurs non-critiques (ResizeObserver)
- [ ] **ACTION REQUISE**: Obtenir un DSN Sentry production
  - Aller sur https://sentry.io
  - Créer un projet React
  - Copier le DSN
  - Configurer `VITE_SENTRY_DSN` dans les secrets de production

### Web Vitals
- [x] Monitoring configuré (`src/lib/reportWebVitals.ts`)
- [x] Tests performance ajoutés (`e2e/performance.spec.ts`)
- [x] Métriques LCP, FCP, CLS trackées
- [ ] **ACTION REQUISE**: Vérifier les scores sur `/quality`

### Performance
- [ ] **ACTION REQUISE**: Tester avec 100+ étudiants
- [ ] **ACTION REQUISE**: Tester avec 500+ notes
- [ ] **ACTION REQUISE**: Vérifier temps de chargement < 3s
- [ ] **ACTION REQUISE**: Vérifier score Lighthouse > 90

**🔴 ACTION IMMÉDIATE**: 
1. Aller sur `/quality` pour voir les Web Vitals
2. Lancer `npx playwright test e2e/performance.spec.ts`

---

## 📊 Commandes Utiles

### Lancer tous les tests
```bash
# Tous les tests
npx playwright test

# Tests spécifiques
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/security.spec.ts
npx playwright test e2e/performance.spec.ts

# Mode UI (interactif)
npx playwright test --ui

# Avec rapport
npx playwright test --reporter=html
npx playwright show-report
```

### Monitoring
```bash
# Voir les logs backend
# Aller dans Backend > Logs

# Voir les métriques
# Aller sur /quality dans l'app
```

---

## 🚨 Actions Critiques Avant Production

### À FAIRE MAINTENANT
1. ✅ Désactiver auto-confirm email (FAIT)
2. 🔴 Activer Password Leak Protection (À FAIRE)
3. 🔴 Lancer tous les tests E2E (À FAIRE)
4. 🔴 Configurer Sentry DSN production (À FAIRE)
5. 🔴 Tester sur mobile (À FAIRE)

### À FAIRE CETTE SEMAINE
6. 🔴 Créer comptes enseignants production
7. 🔴 Former les utilisateurs
8. 🔴 Préparer guide utilisateur
9. 🔴 Backup initial des données
10. 🔴 Configurer domaine personnalisé (optionnel)

---

## 📈 Métriques de Succès

### Sécurité
- ✅ 0 warning linter (sauf password leak - à activer)
- ✅ 100% tables avec RLS
- ⏳ 100% tests sécurité passent

### Performance
- ⏳ LCP < 2.5s
- ⏳ FCP < 1.8s
- ⏳ CLS < 0.1
- ⏳ Lighthouse > 90

### Tests
- ⏳ 100% tests E2E passent
- ⏳ Tests mobile OK
- ⏳ Tests multi-navigateurs OK

---

## 📞 Support

- 📚 [Documentation Lovable](https://docs.lovable.dev)
- 💬 [Discord Lovable](https://discord.com/channels/1119885301872070706/1280461670979993613)
- 📖 Voir `DEPLOYMENT.md` pour le guide de déploiement complet
- 📖 Voir `SECURITY.md` pour les détails sécurité
- 📖 Voir `QUALITY.md` pour les standards qualité
