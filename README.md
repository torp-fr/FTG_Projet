# FTG — Found The Grow

**Incubateur IA d'exécution entrepreneuriale.** SaaS B2B2C (incubateurs, CCI, écoles) qui accompagne un porteur de projet de l'idée à la première vente vérifiée, au travers d'un référentiel de 70 jalons / 10 gates / 9 vecteurs de maturité, orchestrés par un board d'agents (engines) incarnés.

> Ce dépôt est **hermétique** : aucune dépendance, aucun compte, aucune ressource partagée avec d'autres projets (ex. TORP). Toute intégration externe est spécifique à FTG et nommée comme telle.

## Statut

Conception verrouillée (11 chantiers — voir le projet Claude "FTG_Found_The_Grow"). Build en cours : **Lot 0 → Lot 1 → Lot 2** (voir `docs/architecture/backlog.md` et le plan d'exécution soumis en fin de session de démarrage).

## Structure du dépôt

```
apps/
  porteur/        # Console porteur — le "verre d'eau" (dashboard progression, board, livrables)
  cockpit-b2b/     # Console accompagnant — cohorte, fiche projet, comité de sélection
  admin/           # Console admin (Lot 5 — supervision, impersonation auditée, promotion sous verrou)

packages/
  database/        # Types générés Supabase + client typé
  orchestrator/     # Sequencer (DAG) · Router · Diffuser · Gatekeeper · Supervisor (Chantier 4 §4)
  engine-sdk/        # Contrat d'engine standard : enveloppes I/O, helpers waterfall/pédagogie/sources
  referential/        # Loader + types du référentiel versionné (phases, jalons, gates, segments)
  ui/                  # Design system partagé (accueil du skill ui-ux-pro-max à intégrer)

supabase/
  migrations/       # Schéma SQL (Chantier 4 §1) — RLS, versionné
  functions/         # Edge Functions : endpoints orchestrateur (Chantier 4 §5) + engines
  seed/               # Seed du référentiel V1.1, des 8 profils de segment, du registre data_sources

docs/
  architecture/     # Miroir technique des chantiers (ADR), schéma, contrat d'engine, backlog
  ops/                # Runbooks Lot 0 (création comptes, remplissage du vault/coffre d'accès)

scripts/
  lot0/              # Scripts d'aide à la configuration infra (checklists, gabarits .env)

infra/               # Références de configuration (jamais de secret en clair ici)
```

## Principes non négociables (rappel, cf. chantiers)

1. Gates validés **côté serveur uniquement** — jamais par le client.
2. Neutralité factuelle orientée solutions — jamais de jugement de faisabilité, toujours ≥1 chemin de solution.
3. Recherche waterfall ≥ 3 niveaux sur toute tâche de recherche.
4. Règle des 3 propositions sur toute décision structurante (🔀).
5. Avocat du diable systématique sur les jalons marqués 😈.
6. Verrous anti-régression : toute évolution passe par golden set + déploiement conditionnel.
7. Multi-tenant natif (RLS), étanchéité totale entre organisations B2B.
8. Zéro fait non sourcé — toute estimation est étiquetée `[E]` avec sa méthode.

## Démarrage

Voir `docs/ops/lot0-checklist.md` pour la configuration infra (Supabase EU / Vercel / Stripe test / GitHub), puis `docs/architecture/backlog.md` pour l'enchaînement des lots.
