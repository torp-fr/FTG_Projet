# supabase/migrations

Schéma SQL versionné (Chantier 4 §1). Ordre de création prévu au Lot 1 :

1. `001_referential.sql` — `referential_versions`, `phases`, `milestones`, `milestone_dependencies`, `gates`, `segments`, `segment_milestone_overrides`, `agents`, `engines`, `engine_versions`
2. `002_tenants.sql` — `organizations`, `org_members`, `users`, `projects`, `founder_profiles` (+ RLS)
3. `003_execution.sql` — `project_milestones`, `evidences`, `deliverables`, `deliverable_threads`, `deliverable_messages`, `gate_evaluations`, `reserves`, `agent_objectives`, `project_journal`, `decisions`
4. `004_runs_llm_knowledge.sql` — `engine_runs`, `llm_connections`, `usage_quotas`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks` (pgvector), `watch_feeds`, `watch_alerts`
5. `005_quality.sql` — `golden_cases`, `eval_runs`, `improvement_backlog`, `quality_reports`
6. `006_data_sources.sql` — registre `data_sources` (amendement Chantier 3 §6)
7. `007_rls_policies.sql` — policies RLS consolidées (isolation par `project_id`/`org_id`)

**RLS active sur toute table tenant-scopée dès sa création** — pas de migration "RLS plus tard".
