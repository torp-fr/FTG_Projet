-- FTG — Migration 003 : Exécution du parcours (Chantier 4 §1.3)

-- ============================================================
-- project_milestones (instance de chaque jalon pour un projet)
-- ============================================================
create table if not exists project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  milestone_id uuid not null references milestones(id) on delete cascade,
  state text not null default 'locked' check (state in (
    'locked', 'available', 'recommended', 'in_progress',
    'awaiting_proof', 'awaiting_review', 'done', 'forced'
  )),
  -- locked/available/recommended sont DÉRIVÉS du DAG à la lecture (Sequencer),
  -- matérialisés ici en cache pour l'UI — jamais source de vérité
  opened_at timestamptz,
  done_at timestamptz,
  forced_reason text,
  quality_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, milestone_id)
);

create index if not exists idx_pm_project on project_milestones(project_id);
create index if not exists idx_pm_milestone on project_milestones(milestone_id);
create index if not exists idx_pm_state on project_milestones(state);

create trigger trg_project_milestones_updated_at
  before update on project_milestones
  for each row execute function set_updated_at();

-- ============================================================
-- evidences (preuves — anti-gaming)
-- ============================================================
create table if not exists evidences (
  id uuid primary key default gen_random_uuid(),
  project_milestone_id uuid not null references project_milestones(id) on delete cascade,
  type text not null check (type in ('structured', 'upload', 'webhook', 'quiz', 'external_check')),
  payload jsonb not null default '{}'::jsonb,
  file_ref text,
  hash text,
  captured_at timestamptz not null default now(),
  verified boolean not null default false,
  verification jsonb not null default '{}'::jsonb,   -- méthode, croisements
  weight numeric not null default 1
);

create index if not exists idx_evidences_pm on evidences(project_milestone_id);

-- ============================================================
-- deliverables (livrables versionnés)
-- ============================================================
create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  project_milestone_id uuid references project_milestones(id) on delete set null,
  engine_run_id uuid,   -- FK ajoutée en migration 004 (engine_runs)
  type text not null,
  title text not null,
  version integer not null default 1,
  content_ref text,                              -- storage
  structured_data jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,     -- [{claim_ref, source, date, url, is_estimate, method}]
  pedagogy jsonb not null default '{}'::jsonb,     -- {beginner, intermediate, advanced}
  status text not null default 'draft' check (status in ('draft', 'delivered', 'enriched', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deliverables_project on deliverables(project_id);
create index if not exists idx_deliverables_pm on deliverables(project_milestone_id);

create trigger trg_deliverables_updated_at
  before update on deliverables
  for each row execute function set_updated_at();

-- ============================================================
-- deliverable_threads / deliverable_messages (chat de feedback — A5.6)
-- ============================================================
create table if not exists deliverable_threads (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null unique references deliverables(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists deliverable_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references deliverable_threads(id) on delete cascade,
  author text not null check (author in ('user', 'agent')),
  content text not null,
  intent text check (intent in ('question', 'correction', 'enrichment_request', 'approval')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
  -- une correction/incompréhension peut déclencher un engine_run d'enrichissement
  -- lié au même livrable (version++) — orchestré côté application
);

create index if not exists idx_dmessages_thread on deliverable_messages(thread_id);

-- ============================================================
-- gate_evaluations (verdicts — serveur uniquement)
-- ============================================================
create table if not exists gate_evaluations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  gate_id uuid not null references gates(id) on delete cascade,
  computed_scores jsonb not null default '{}'::jsonb,   -- {V1..V6, composite}
  verdict text not null check (verdict in (
    'validated', 'validated_with_reserves', 'conditions_not_met',
    'alternatives_detected', 'facts_and_options'
  )),
  -- nommage aligné neutralité factuelle (Amendement D25) ; mapping interne conservé :
  --   conditions_not_met      = "Conditions non remplies"     (ex BLOQUÉ)
  --   alternatives_detected   = "Alternatives détectées"      (ex PIVOT RECOMMANDÉ)
  --   facts_and_options       = "État des faits & options"    (ex ARRÊT RECOMMANDÉ)
  solution_paths jsonb not null default '[]'::jsonb,     -- ≥1 obligatoire hors 'validated'
  facts jsonb not null default '[]'::jsonb,               -- chaque fait sourcé
  engine_version_refs jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now()
);

create index if not exists idx_gate_evals_project on gate_evaluations(project_id);
create index if not exists idx_gate_evals_gate on gate_evaluations(gate_id);

-- ============================================================
-- reserves (réserves ouvertes, max 3 — verrou qualité global)
-- ============================================================
create table if not exists reserves (
  id uuid primary key default gen_random_uuid(),
  gate_evaluation_id uuid not null references gate_evaluations(id) on delete cascade,
  vector text not null check (vector in ('V1', 'V2', 'V3', 'V4', 'V5', 'V6')),
  description text not null,
  lift_action text,
  due_gate_code text,
  status text not null default 'open' check (status in ('open', 'lifted', 'expired')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reserves_gate_eval on reserves(gate_evaluation_id);
create index if not exists idx_reserves_status on reserves(status);

-- ============================================================
-- agent_objectives (OKR du board, dérivés ambition × segment)
-- ============================================================
create table if not exists agent_objectives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  objective text not null,
  key_results jsonb not null default '[]'::jsonb,
  progress numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'done', 'stalled', 'retired')),
  derived_from jsonb not null default '{}'::jsonb,   -- {ambition, segment}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_obj_project on agent_objectives(project_id);
create index if not exists idx_agent_obj_agent on agent_objectives(agent_id);

create trigger trg_agent_objectives_updated_at
  before update on agent_objectives
  for each row execute function set_updated_at();

-- ============================================================
-- project_journal (journal de bord / état canonique — Addendum A2.1)
-- ============================================================
create table if not exists project_journal (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  event_type text not null check (event_type in (
    'deliverable', 'gate', 'decision', 'message', 'alert', 'override'
  )),
  digest text not null,                 -- résumé structuré
  payload_ref text,
  actor text,
  created_at timestamptz not null default now()
);

create index if not exists idx_journal_project on project_journal(project_id, created_at desc);

-- ============================================================
-- decisions (arbitrages du porteur — règle des 3 voies)
-- ============================================================
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  options jsonb not null default '[]'::jsonb,     -- jusqu'à 3 options
  chosen_index integer,
  founder_motivation text,
  created_at timestamptz not null default now()
  -- nourrit founder_profile (builder_vs_opportunist_reading, etc.)
);

create index if not exists idx_decisions_project on decisions(project_id);
