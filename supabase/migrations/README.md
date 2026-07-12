# supabase/migrations

Schéma SQL versionné (Chantier 4 §1). **Appliqué au Lot 1** sur le projet Supabase réel `ftg-plateforme` (ref `zhkrpnjfqrrtfuddqznt`, région `eu-west-1`) via `mcp__Supabase__apply_migration` — 36 tables créées, RLS active partout, 5 fonctions helper `ftg_*` posées pour les policies (Chantier 4 §6). État vérifié avec `list_tables` + `get_advisors` (sécurité) après application.

1. `001_referential.sql` — `referential_versions`, `phases`, `milestones`, `milestone_dependencies`, `gates`, `segments`, `segment_milestone_overrides`, `agents`, `engines`, `engine_versions` — **appliqué**
2. `002_tenants.sql` — `organizations`, `org_members`, `users`, `projects`, `founder_profiles` — **appliqué**
3. `003_execution.sql` — `project_milestones`, `evidences`, `deliverables`, `deliverable_threads`, `deliverable_messages`, `gate_evaluations`, `reserves`, `agent_objectives`, `project_journal`, `decisions` — **appliqué**
4. `004_runs_llm_knowledge.sql` — `engine_runs`, `llm_connections`, `usage_quotas`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks` (pgvector), `watch_feeds`, `watch_alerts` — **appliqué**
5. `005_quality.sql` — `golden_cases`, `eval_runs`, `improvement_backlog`, `quality_reports` — **appliqué**
6. `006_data_sources.sql` — registre `data_sources` (amendement Chantier 3 §6) — **appliqué**
7. `007_rls_policies.sql` — policies RLS consolidées (isolation par `project_id`/`org_id`, fonctions `security definer` `ftg_current_user_id`, `ftg_is_project_owner`, `ftg_is_org_member_of_project`, `ftg_can_access_project`, `ftg_is_org_admin`) — **appliqué**
8. `008_security_hardening` (**tracée en base, sans fichier** — appliquée directement au Lot 1 via MCP) — durcissement post-application : `search_path` figé sur `set_updated_at`, `EXECUTE` des fonctions `ftg_*` révoqué pour `anon`/`authenticated` (elles restent utilisables PAR les policies RLS elles-mêmes) — corrige les advisories du linter Supabase — **appliqué**
9. `009_rls_reproducibility_backfill.sql` — **backfill de reproductibilité** : capture, de façon IDEMPOTENTE, l'effet de la « 008 » fantôme (search_path de `set_updated_at` + REVOKE EXECUTE des `ftg_*`) pour que le schéma live soit 100 % reconstructible depuis les fichiers (parité fichiers ↔ base) — **appliqué**
10. `010_reharden_rls_function_grants.sql` — re-révoque l'`EXECUTE` des `ftg_*` (un `CREATE OR REPLACE` ultérieur réaccorde le grant par défaut à PUBLIC). Idempotent. **Appliquée en base au Lot 1** ; ce fichier trace le changement — **appliqué**
11. `011_events.sql` — table `events` (flux append-only, socle du futur nervous system EOS). Émise par l'orchestrateur (JC-05) ; RLS project-scopée, écriture service_role. Aucun consommateur. Idempotent — **appliqué**

> **Reproductibilité (vérifiée S0.1)** : le schéma live == fichiers. Policies (49) et tables RLS-actives (38) correspondent EXACTEMENT à `007`. Le durcissement de fonctions (`set_updated_at.search_path` + révocations `ftg_*`) est capturé par `009` (idempotent) et `010`. La « 008 » reste tracée en base sans fichier (historique Lot 1) ; son effet est intégralement rejouable via `009`+`010`.

**RLS active sur toute table tenant-scopée dès sa création** — pas de migration "RLS plus tard".

Point non-bloquant restant (advisory mineur du linter, non corrigé pour ne pas risquer `knowledge_chunks.embedding` en cours de Lot 1) : l'extension `vector` est installée dans le schéma `public` plutôt que dans un schéma `extensions` dédié — à déplacer lors d'une future migration de nettoyage si besoin.

Pour rejouer ce schéma sur un nouvel environnement (ex. staging) : appliquer les fichiers `.sql` dans l'ordre (`001`→`007`, `009`, `010`) via `supabase db push` ou `mcp__Supabase__apply_migration`. La chaîne reproduit l'intégralité du schéma live, durcissement inclus.
