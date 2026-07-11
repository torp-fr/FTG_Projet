# supabase/migrations

Schéma SQL versionné (Chantier 4 §1). **Appliqué au Lot 1** sur le projet Supabase réel `ftg-plateforme` (ref `zhkrpnjfqrrtfuddqznt`, région `eu-west-1`) via `mcp__Supabase__apply_migration` — 36 tables créées, RLS active partout, 5 fonctions helper `ftg_*` posées pour les policies (Chantier 4 §6). État vérifié avec `list_tables` + `get_advisors` (sécurité) après application.

1. `001_referential.sql` — `referential_versions`, `phases`, `milestones`, `milestone_dependencies`, `gates`, `segments`, `segment_milestone_overrides`, `agents`, `engines`, `engine_versions` — **appliqué**
2. `002_tenants.sql` — `organizations`, `org_members`, `users`, `projects`, `founder_profiles` — **appliqué**
3. `003_execution.sql` — `project_milestones`, `evidences`, `deliverables`, `deliverable_threads`, `deliverable_messages`, `gate_evaluations`, `reserves`, `agent_objectives`, `project_journal`, `decisions` — **appliqué**
4. `004_runs_llm_knowledge.sql` — `engine_runs`, `llm_connections`, `usage_quotas`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks` (pgvector), `watch_feeds`, `watch_alerts` — **appliqué**
5. `005_quality.sql` — `golden_cases`, `eval_runs`, `improvement_backlog`, `quality_reports` — **appliqué**
6. `006_data_sources.sql` — registre `data_sources` (amendement Chantier 3 §6) — **appliqué**
7. `007_rls_policies.sql` — policies RLS consolidées (isolation par `project_id`/`org_id`, fonctions `security definer` `ftg_current_user_id`, `ftg_is_project_owner`, `ftg_is_org_member_of_project`, `ftg_can_access_project`, `ftg_is_org_admin`) — **appliqué**
8. `008_security_hardening.sql` (non fichier — appliqué directement) — durcissement post-application : `search_path` figé sur `set_updated_at`, `EXECUTE` des fonctions `ftg_*` révoqué pour `anon`/`authenticated` (elles restent utilisables PAR les policies RLS elles-mêmes) — corrige les advisories du linter Supabase — **appliqué**

**RLS active sur toute table tenant-scopée dès sa création** — pas de migration "RLS plus tard".

Point non-bloquant restant (advisory mineur du linter, non corrigé pour ne pas risquer `knowledge_chunks.embedding` en cours de Lot 1) : l'extension `vector` est installée dans le schéma `public` plutôt que dans un schéma `extensions` dédié — à déplacer lors d'une future migration de nettoyage si besoin.

Pour rejouer ce schéma sur un nouvel environnement (ex. staging) : appliquer les 7 fichiers `.sql` dans l'ordre via `supabase db push` ou `mcp__Supabase__apply_migration`.
