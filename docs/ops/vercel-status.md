# Vercel — Statut (diagnostiqué et corrigé le 11/07/2026)

## Ce qui s'est passé

Après le push du Lot 1 (monorepo pnpm avec packages/*), tous les déploiements Vercel
sont passés en erreur : npm ne sait pas résoudre "workspace:*" (protocole pnpm-only)
utilisé entre les dépendances internes du monorepo.

## Ce qui a été corrigé

- [x] pnpm-lock.yaml généré et commité (pnpm install exécuté réellement, pas simulé)
- [x] vercel.json ajouté (installCommand pnpm + ignoreCommand tant qu'aucune app
      frontend réelle n'existe)

## ⚠️ Verrou anti-régression — à ne pas oublier au Lot 2

Ce vercel.json fait sauter TOUS les déploiements indéfiniment. Dès que le Lot 2 livre
une vraie app dans apps/porteur (Next.js), il faudra :
1. Retirer ou adapter ignoreCommand dans vercel.json.
2. Configurer le Root Directory du projet Vercel "ftg-projet" sur apps/porteur dans
   les réglages du dashboard (action manuelle, pas automatisable).
3. Vérifier que apps/porteur/package.json a un script "build" réel (Next.js).

---

## JC-08a — Déploiement protégé multi-app (2026-07-12)

Les 3 apps existent (porteur, cockpit-b2b, admin) et sont **protégées par une auth Supabase
réelle** (middleware par app : tout accès non authentifié → /login). Chaque app utilise le
middleware Next.js (auth) → il faut le **builder Next.js natif de Vercel**, donc **un projet
Vercel par app avec un Root Directory dédié** (le hack buildCommand+outputDirectory à la racine
ne gère pas correctement le middleware).

### Topologie recommandée (un projet Vercel par app)

| App | Projet Vercel | Root Directory | Port dev |
|---|---|---|---|
| Porteur (B2C) | `ftg-projet` (existant, à repointer) | `apps/porteur` | 3002 |
| Cockpit (B2B) | `ftg-cockpit` (à créer) | `apps/cockpit-b2b` | 3001 |
| Admin (opérateur) | `ftg-admin` (à créer) | `apps/admin` | 3003 |

Chaque app porte son propre `apps/*/vercel.json` (framework `nextjs`, `installCommand`
pnpm workspace, `ignoreCommand` = ne builder que si l'app ou `packages/` a changé). Le
`vercel.json` **racine** ne sert plus qu'à ignorer un éventuel build à la racine du repo
(non utilisé) — chaque projet lit le vercel.json de SON Root Directory.

### Variables d'environnement (par projet Vercel)

| Variable | porteur | cockpit | admin | Portée |
|---|:-:|:-:|:-:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | publique (navigateur) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | publique (navigateur, RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ❌ | ✅ | **serveur uniquement** |

- **porteur & cockpit n'ont PLUS de service_role** : toutes leurs lectures passent par le
  client SESSION (clé anon, RLS). Ne PAS mettre `SUPABASE_SERVICE_ROLE_KEY` sur ces projets.
- **admin** garde `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement, jamais `NEXT_PUBLIC_`) pour
  la supervision globale + l'écriture de l'audit + promote + provisioning, gardé derrière
  l'auth opérateur (`is_operator`). `FTG_ADMIN_OPERATOR_*` sont optionnels (repli hors session).

### Actions dashboard Vercel (côté fondateur — NON automatisables depuis la session)

1. **Projet `ftg-projet`** → Settings → General → **Root Directory = `apps/porteur`** (le
   repointer sur l'app porteur). Enlève de facto le skip racine (le projet lira
   `apps/porteur/vercel.json`).
2. **Créer `ftg-cockpit`** (Import du repo `torp-fr/FTG_Projet`) → Root Directory = `apps/cockpit-b2b`.
3. **Créer `ftg-admin`** (Import du même repo) → Root Directory = `apps/admin`.
4. **Env vars** sur chaque projet selon le tableau ci-dessus (Settings → Environment Variables,
   scope Production + Preview).
5. **Redeploy** chaque projet (ou push) → vérifier un déploiement **READY** (fini le CANCELED).
6. *(Défense en profondeur, optionnel)* Vercel **Deployment Protection** peut rester désactivée :
   la protection réelle est l'auth in-app (middleware). Aucune donnée porteur/cohorte n'est servie
   sans session (redirection /login vérifiée en runtime).

### Comptes de login de démo (seed : `pnpm tsx scripts/jc08-seed-auth.ts`)

| Rôle | Email | Accès |
|---|---|---|
| Porteur | `karim.demo@ftg.test` | son projet (Atelier menuiserie) |
| Conseiller | `conseiller.demo@ftg.test` | cohorte org « Incubateur Démo — CCI Test » |
| Opérateur | `ops@ftg.test` | console admin (is_operator) |

Mot de passe démo commun : `FtgDemo2026!` (à changer hors démo).
