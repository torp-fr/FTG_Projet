# Lot 1 — Statut (exécuté et vérifié le 11/07/2026)

Détail complet dans le Claude Project : `ftg-plan-execution-lot0-1-2.md` §7.

## Résumé

- [x] Schéma appliqué sur `ftg-plateforme` (8 migrations, 36 tables, RLS partout) — `supabase/migrations/`
- [x] Seed injecté (référentiel V1.1, 8 segments, 32 sources) — `supabase/seed/`
- [x] Types TypeScript générés depuis le schéma réel — `packages/database/src/types.ts`
- [x] Sequencer + Gatekeeper implémentés et testés — `packages/orchestrator/src/`
- [x] Contrat d'engine (enveloppes + garanties) — `packages/engine-sdk/src/`
- [x] Test de bout en bout DAG P0→P1 vert — `packages/orchestrator/test/e2e-p0-to-p1.test.ts`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — à récupérer du dashboard, nécessaire pour que le Gatekeeper réel écrive en base (Lot 2)
- [ ] `pnpm install` réel dans le monorepo (les imports inter-packages sont vérifiés par exécution directe `tsx`, pas encore par `pnpm -r typecheck`)
- [ ] Router/Diffuser/Supervisor : forme posée, branchement DB/LLM réel au Lot 2

## Comment rejouer le test de bout en bout

```bash
npx tsx packages/orchestrator/test/e2e-p0-to-p1.test.ts
```

Aucune dépendance réseau — fixtures pures reproduisant le référentiel V1.1 seedé.

## Comment vérifier le schéma en base

Dashboard Supabase → projet `ftg-plateforme` → Table Editor, ou :

```sql
select count(*) from milestones;        -- 75
select count(*) from milestone_dependencies; -- 79
select count(*) from gates;              -- 10
select count(*) from segments;           -- 8
select count(*) from data_sources;       -- 32
```
