-- FTG — Migration 004 : Runs, LLM & connaissance (Chantier 4 §1.4)

create extension if not exists vector;

-- ============================================================
-- engine_runs (chaque invocation d'engine — traçabilité totale)
-- ============================================================
create table if not exists engine_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  engine_version_id uuid not null references engine_versions(id),
  task_type text not null,
  input_envelope jsonb not null,
  input_structured_validated boolean not null default false,
  research_depth integer not null default 0,          -- ≥3 si tâche recherche (standard A5.1)
  model_calls jsonb not null default '[]'::jsonb,      -- [{provider, model, tier, tokens, channel}]
  llm_channel text not null check (llm_channel in ('oauth_user', 'byok_org', 'pooled')),
  cost_estimate numeric,
  output_envelope_ref text,
  status text not null default 'queued' check (status in (
    'queued', 'running', 'awaiting_user', 'done', 'failed'
  )),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_engine_runs_project on engine_runs(project_id);
create index if not exists idx_engine_runs_status on engine_runs(status);

alter table deliverables add constraint fk_deliverables_engine_run
  foreign key (engine_run_id) references engine_runs(id) on delete set null;

-- ============================================================
-- llm_connections (canaux LLM par utilisateur/org)
-- ============================================================
create table if not exists llm_connections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id) on delete cascade,
  owner_org_id uuid references organizations(id) on delete cascade,
  provider text not null,
  channel text not null check (channel in ('oauth', 'api_key')),
  credential_ref text,      -- vault, opaque
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  consent_scope jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  check (
    (owner_user_id is not null and owner_org_id is null) or
    (owner_user_id is null and owner_org_id is not null)
  )
);

create index if not exists idx_llm_conn_user on llm_connections(owner_user_id);
create index if not exists idx_llm_conn_org on llm_connections(owner_org_id);

-- ============================================================
-- usage_quotas (quotas par module + crédits — V1.1)
-- ============================================================
create table if not exists usage_quotas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  module_code text not null,
  included jsonb not null default '{}'::jsonb,
  consumed jsonb not null default '{}'::jsonb,
  credit_balance numeric not null default 0,   -- closed-loop, V1.1
  updated_at timestamptz not null default now(),
  unique (project_id, module_code)
);

create trigger trg_usage_quotas_updated_at
  before update on usage_quotas
  for each row execute function set_updated_at();

-- ============================================================
-- knowledge_bases / knowledge_documents / knowledge_chunks
-- (cerveau métier optionnel par projet — Addendum §7)
-- ============================================================
create table if not exists knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  doc_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  knowledge_base_id uuid not null references knowledge_bases(id) on delete cascade,
  title text,
  source_ref text,
  status text not null default 'pending' check (status in ('pending', 'ingested', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_kdocs_kb on knowledge_documents(knowledge_base_id);
create index if not exists idx_kchunks_doc on knowledge_chunks(document_id);
create index if not exists idx_kchunks_embedding on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- watch_feeds / watch_alerts (veilles pin & cron — Chantier 3 §3)
-- ============================================================
create table if not exists watch_feeds (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'segment', 'project')),
  source text not null,
  schedule text not null,      -- cron-like
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists watch_alerts (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references watch_feeds(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,  -- routing
  summary text not null,
  relevance_score numeric,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_watch_alerts_feed on watch_alerts(feed_id);
create index if not exists idx_watch_alerts_project on watch_alerts(project_id);
