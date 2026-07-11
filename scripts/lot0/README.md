# scripts/lot0

Scripts d'aide à la configuration infra du Lot 0 (à écrire une fois les comptes créés et validés) :

- `check-env.sh` — vérifie que toutes les clés de `.env` requises sont présentes avant de lancer le Lot 1
- `seed-sources-registry.ts` — injecte le registre `data_sources` (Chantier 3) une fois les comptes sources créés

Rien n'est exécuté automatiquement ici : ce dossier attend la validation des comptes (cf. `docs/ops/lot0-checklist.md`).
