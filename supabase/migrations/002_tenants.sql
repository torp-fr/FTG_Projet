-- FTG — Migration 002 : Tenants, comptes & projets (Chantier 4 §1.2)

-- ============================================================
-- organizations (B2B : incubateur, CCI, école)
-- ============================================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  plan text not null default 'free' check (plan in ('free', 'paid')),
  llm_channel text not null default 'pooled_quota' check (llm_channel in ('byok_org', 'pooled_quota')),
  byok_key_ref text,                       -- opaque, pointeur vault — jamais la clé en clair
  settings jsonb not null default '{}'::jsonb,  -- {gate_mode: strict, seuils custom...}
  created_at timestamptz not null default now()
);

-- ============================================================
-- users (porteurs + advisors + admins FTG)
-- ============================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_ref uuid unique references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- org_members (chargés d'accompagnement)
-- ============================================================
create table if not exists org_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'advisor' check (role in ('admin', 'advisor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists idx_org_members_user on org_members(user_id);

-- ============================================================
-- projects (LE projet entrepreneurial)
-- ============================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,   -- nullable = B2C direct
  entry_door text not null check (entry_door in ('A', 'B')),
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'closed', 'graduated')),
  segment_primary_id uuid references segments(id) on delete set null,
  segment_secondary_ids uuid[] not null default '{}',
  ambition_profile text check (ambition_profile in ('complement', 'independance', 'croissance', 'scale')),
  ref_version_id uuid not null references referential_versions(id),  -- figé à la création, migrable explicitement
  gate_mode text not null default 'free' check (gate_mode in ('strict', 'free')),
  geo_lenses jsonb not null default '["france"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_owner on projects(owner_user_id);
create index if not exists idx_projects_org on projects(org_id);
create index if not exists idx_projects_segment_primary on projects(segment_primary_id);

-- ============================================================
-- founder_profiles (sorties P0 — profil d'incarnation)
-- ============================================================
create table if not exists founder_profiles (
  project_id uuid primary key references projects(id) on delete cascade,
  competencies jsonb not null default '{}'::jsonb,
  resources jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  risk_appetite text,
  intrinsic_nature jsonb not null default '{}'::jsonb,
  mantra text,
  internal_objectives jsonb not null default '{}'::jsonb,
  builder_vs_opportunist_reading text,
  engagement jsonb not null default '{}'::jsonb,   -- {hours_week, capital, horizon}
  version integer not null default 1,
  validated_at timestamptz,
  updated_at timestamptz not null default now()
);

-- trigger générique updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create trigger trg_founder_profiles_updated_at
  before update on founder_profiles
  for each row execute function set_updated_at();
