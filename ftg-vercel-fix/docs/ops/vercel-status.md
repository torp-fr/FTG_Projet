# Vercel — Statut (diagnostiqué et corrigé le 11/07/2026)

## Ce qui s'est passé

Après le push du Lot 1 (monorepo pnpm avec `packages/*`), tous les déploiements Vercel sont passés en erreur :

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
Error: Command "npm install" exited with 1
```

**Cause** : aucun `pnpm-lock.yaml` n'était commité dans le repo. Sans lockfile pnpm, Vercel ne détecte pas le gestionnaire de paquets et retombe sur `npm install` par défaut — qui ne sait pas résoudre le protocole `workspace:*` utilisé par les dépendances internes du monorepo (`@ftg/orchestrator` → `@ftg/engine-sdk`, etc.).

## Ce qui a été corrigé

- [x] **`pnpm-lock.yaml` généré et commité** — `pnpm install` exécuté réellement en sandbox (pas de simulation). Vérifié : `pnpm -r --if-present typecheck` passe sans erreur sur les 3 packages (`database`, `engine-sdk`, `orchestrator`) — ceci confirme aussi, au passage, la résolution inter-packages `@ftg/engine-sdk` dans `router.ts` qui n'avait pas pu être vérifiée par `tsc` pendant le Lot 1.
- [x] **`vercel.json` ajouté** avec `installCommand: pnpm install --frozen-lockfile` (pour quand une vraie app existera) et un `ignoreCommand` qui fait sauter volontairement le build tant qu'aucune app frontend réelle n'existe dans `apps/*`.

## Pourquoi "ignoré" plutôt que "corrigé en vert"

Même avec le lockfile corrigé, il n'y a **aucune app frontend réelle** à déployer aujourd'hui — `apps/porteur`, `apps/cockpit-b2b`, `apps/admin` ne contiennent qu'un `README.md` (le vrai code arrive au Lot 2). Forcer un déploiement "vert" maintenant aurait nécessité de construire une app placeholder factice, ce qui contredit le principe de neutralité factuelle (mieux vaut un statut honnête — "ignoré, en attente du Lot 2" — qu'un faux signal de succès).

Décision validée avec l'utilisateur (11/07/2026, rule-of-3) : marquer les déploiements comme **"Ignored"** plutôt que de les laisser échouer en rouge, via `ignoreCommand`. C'est un statut neutre qui indique "rien à déployer pour l'instant", pas une erreur.

## ⚠️ Verrou anti-régression — à ne pas oublier

Ce `vercel.json` fait sauter **tous** les déploiements, indéfiniment. **Dès que le Lot 2 livre une vraie app dans `apps/porteur`** (Next.js), il faudra :

1. Retirer ou adapter `ignoreCommand` dans `vercel.json` (sinon Vercel continuera d'ignorer les déploiements même une fois l'app prête).
2. Configurer le `Root Directory` du projet Vercel (`ftg-projet`) sur `apps/porteur` dans les réglages du dashboard (aucun outil automatisé ne permet de le faire depuis cette session — action utilisateur).
3. Vérifier que `apps/porteur/package.json` a un script `build` réel (Next.js) pour que `pnpm -r build` produise une sortie.

Ce point est à reprendre explicitement en tête du Lot 2.
