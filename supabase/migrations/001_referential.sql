-- FTG — Migration 001 : Référentiel & configuration (Chantier 4 §1.1)
-- Données versionnées, communes à tous les tenants. Aucune donnée applicative ici.

create extension if not exists pgcrypto;

-- ============================================================
-- referential_versions
-- ============================================================
create table if not exists referential_versions (
  id uuid primary key default gen_random_uuid(),
  semver text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  changelog text,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table referential_versions is 'Version globale du référentiel de jalons (v1.1, v1.2…). Une seule version peut être active à la fois.';

-- ============================================================
-- phases (P0..P9)
-- ============================================================
create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  ref_version_id uuid not null references referential_versions(id) on delete cascade,
  code text not null,
  name text not null,
  order_hint integer not null,
  entry_door_variant text not null default 'both' check (entry_door_variant in ('A', 'B', 'both')),
  created_at timestamptz not null default now(),
  unique (ref_version_id, code)
);

create index if not exists idx_phases_ref_version on phases(ref_version_id);

-- ============================================================
-- milestones (les 70+ jalons)
-- ============================================================
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  ref_version_id uuid not null references referential_versions(id) on delete cascade,
  phase_id uuid not null references phases(id) on delete cascade,
  code text not null,                        -- ex: P4-J3
  name text not null,
  description text,
  flags jsonb not null default '{}'::jsonb,   -- {three_ways, devils_advocate, external_proof, pedagogy_quiz}
  proof_types_accepted text[] not null default '{}',
  irreversible boolean not null default false,
  branch text check (branch in ('digital', 'physical', 'service') or branch is null),
  created_at timestamptz not null default now(),
  unique (ref_version_id, code)
);

create index if not exists idx_milestones_ref_version on milestones(ref_version_id);
create index if not exists idx_milestones_phase on milestones(phase_id);

-- ============================================================
-- milestone_dependencies (le DAG)
-- ============================================================
create table if not exists milestone_dependencies (
  milestone_id uuid not null references milestones(id) on delete cascade,
  depends_on_milestone_id uuid not null references milestones(id) on delete cascade,
  hardness text not null default 'hard' check (hardness in ('hard', 'soft')),
  -- hard = travailler sans l'amont produirait du faux → verrouille
  -- soft = ordre recommandé seulement → n'empêche pas l'ouverture
  primary key (milestone_id, depends_on_milestone_id),
  check (milestone_id <> depends_on_milestone_id)
);

create index if not exists idx_mdeps_depends_on on milestone_dependencies(depends_on_milestone_id);

-- ============================================================
-- gates (G0..G9)
-- ============================================================
create table if not exists gates (
  id uuid primary key default gen_random_uuid(),
  ref_version_id uuid not null references referential_versions(id) on delete cascade,
  code text not null,
  name text not null,
  milestone_scope uuid[] not null default '{}',
  weights jsonb not null default '{}'::jsonb,          -- {V1..V6}
  threshold numeric not null,
  critical_floors jsonb not null default '{}'::jsonb,   -- {V4: 50, ...}
  verdict_policy jsonb not null default '{}'::jsonb,    -- {pivot_enabled, arret_enabled, max_reserves: 3}
  created_at timestamptz not null default now(),
  unique (ref_version_id, code)
);

create index if not exists idx_gates_ref_version on gates(ref_version_id);

-- ============================================================
-- segments (taxonomie S1..S8, extensible)
-- ============================================================
create table if not exists segments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'draft', 'retired')),
  config jsonb not null default '{}'::jsonb,
  -- config = profil de segment complet (Chantier 2 §B1) :
  -- vocabulaire, sources prioritaires, jalons additionnels/modifiés, overrides de poids/seuils/planchers,
  -- branche P7, board (agents+leads), preuves P3 privilégiées, pièges connus, lecture ambition
  created_at timestamptz not null default now()
);

-- ============================================================
-- segment_milestone_overrides
-- ============================================================
create table if not exists segment_milestone_overrides (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references segments(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete cascade,
  action text not null check (action in ('add', 'modify', 'skip')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_smo_segment on segment_milestone_overrides(segment_id);
create index if not exists idx_smo_milestone on segment_milestone_overrides(milestone_id);

-- ============================================================
-- agents (le board — registre des agents/engines incarnés)
-- ============================================================
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,                          -- incarnation (ex: "Le Cartographe")
  domain text not null,
  mission text not null,
  description text,
  engine_id uuid,                               -- FK ajoutée après création de engines
  default_objectives_template jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft', 'retired')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- engines (registre technique)
-- ============================================================
create table if not exists engines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                    -- ex: E4, deterministic_core
  name text not null,
  current_version_id uuid,                      -- FK ajoutée après création de engine_versions
  task_types text[] not null default '{}',
  model_routing jsonb not null default '{}'::jsonb,  -- {structuring: small, drafting: mid, analysis: frontier}
  quotas_default jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft', 'retired')),
  created_at timestamptz not null default now()
);

alter table agents add constraint fk_agents_engine
  foreign key (engine_id) references engines(id) on delete set null;

-- ============================================================
-- engine_versions (versioning + anti-régression)
-- ============================================================
create table if not exists engine_versions (
  id uuid primary key default gen_random_uuid(),
  engine_id uuid not null references engines(id) on delete cascade,
  semver text not null,
  prompt_bundle_ref text,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate', 'active', 'retired')),
  eval_score jsonb not null default '{}'::jsonb,
  parent_version_id uuid references engine_versions(id) on delete set null,
  deployed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (engine_id, semver)
);

create index if not exists idx_engine_versions_engine on engine_versions(engine_id);

alter table engines add constraint fk_engines_current_version
  foreign key (current_version_id) references engine_versions(id) on delete set null;

comment on table engine_versions is 'Verrou anti-régression: candidate ne devient active que si eval_runs.passed = true (score >= version active sur TOUS les axes critiques).';
