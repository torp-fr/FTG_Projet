-- FTG — Migration 005 : Qualité & auto-amélioration (Chantier 4 §1.5)
-- Le prisme permanent : golden sets, rejeux, boucle terrain, rapports.

-- ============================================================
-- golden_cases (cas de référence par engine ET par livrable de chantier)
-- ============================================================
create table if not exists golden_cases (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('engine', 'referential', 'segment_profile', 'document')),
  target_id uuid,
  input_fixture jsonb not null default '{}'::jsonb,
  expected_qualities jsonb not null default '{}'::jsonb,   -- rubrique notée
  created_at timestamptz not null default now()
);

create index if not exists idx_golden_cases_target on golden_cases(target_type, target_id);

-- ============================================================
-- eval_runs (rejeux)
-- ============================================================
create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('engine', 'referential', 'segment_profile', 'document')),
  target_id uuid,
  candidate_version_id uuid,
  scores jsonb not null default '{}'::jsonb,     -- par axe, jamais moyennés seuls
  vs_active jsonb not null default '{}'::jsonb,  -- delta par axe
  passed boolean not null default false,
  ran_at timestamptz not null default now()
);

create index if not exists idx_eval_runs_target on eval_runs(target_type, target_id);

-- ============================================================
-- improvement_backlog (boucle terrain — Addendum §3.4)
-- ============================================================
create table if not exists improvement_backlog (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('engine', 'referential', 'segment_profile', 'document')),
  target_id uuid,
  signal text not null check (signal in (
    'rating', 'override', 'contested_verdict', 'unresolved_thread', 'watch_alert', 'adversarial_review'
  )),
  description text not null,
  impact_score numeric,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_improvement_backlog_target on improvement_backlog(target_type, target_id);
create index if not exists idx_improvement_backlog_status on improvement_backlog(status);

-- ============================================================
-- quality_reports (rapport mensuel interne — argument B2B)
-- ============================================================
create table if not exists quality_reports (
  id uuid primary key default gen_random_uuid(),
  period text not null,    -- ex: '2026-07'
  per_engine jsonb not null default '{}'::jsonb,
  regressions_blocked integer not null default 0,
  improvements integer not null default 0,
  created_at timestamptz not null default now(),
  unique (period)
);

comment on table eval_runs is 'Verrou anti-régression: passed=true seulement si score >= version active sur TOUS les axes critiques (aucune moyenne masquante).';
