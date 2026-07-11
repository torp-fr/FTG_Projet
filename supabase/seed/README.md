# supabase/seed

Seed du Lot 1 — **généré et injecté** dans le projet Supabase réel `ftg-plateforme` via `scripts/lot1/generate_seed_sql.py` + `mcp__Supabase__execute_sql` :

- `referentiel_v1.1.json` → 10 phases, **75 jalons en catalogue** (70 nominaux du Chantier 1 + `P0-J0` Intake idée Porte A introduit par l'Amendement A3 + 4 variantes de branche P7 comptées séparément dans le catalogue — digital/physical/service), **79 dépendances DAG**, 10 gates (pondérations Chantier 1 §5)
- `segments_v1.json` → 8 profils de segment complets (Chantier 2 §B2)
- `data_sources.json` → 32 sources (Chantier 3 §2), niveau waterfall par défaut, statut d'activation
- `golden_cases_seed.json` → cas de référence rejoués par le test de bout en bout du Lot 1 (`packages/orchestrator/test/e2e-p0-to-p1.test.ts`) + amorce du futur harnais d'éval (Chantier 5)

**DAG P0/P1 détaillé explicitement** (dépendances hard/soft précises, cf. Amendement A2) — c'est le tronçon exercé par le critère de fin de Lot 1. **DAG P2-P9 en scaffold séquentiel par défaut** (premier jalon de phase dépend du dernier jalon de la phase précédente ; jalons suivants s'enchaînent dans l'ordre du référentiel) : fonctionnellement cohérent mais pas encore la parallélisation fine que permet le modèle DAG — à affiner lors d'un futur chantier de calibration des dépendances, non bloquant pour la suite du build.

Régénérer/rejouer sur un nouvel environnement : `python3 scripts/lot1/generate_seed_sql.py` (produit `scripts/lot1/seed_generated.sql` à partir des JSON ci-dessus) puis exécuter via `mcp__Supabase__execute_sql` ou `psql`.
