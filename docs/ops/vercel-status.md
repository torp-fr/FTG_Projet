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
