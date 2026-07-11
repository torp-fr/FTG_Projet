-- FTG — Migration 006 : Registre des sources de données (Chantier 3 §6)
-- Amendement au schéma Chantier 4 : ajout de data_sources, référencé par
-- les profils de segment (sources prioritaires) et par deliverables.sources
-- pour la chaîne de traçabilité/certifiabilité bout en bout.

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,               -- ex: insee_sirene, dataforseo_keywords
  name text not null,
  type text not null,                      -- ex: entreprises, naming, demande, reglementaire, local, sourcing
  licence text,
  cost_model text not null default 'free' check (cost_model in ('free', 'pay_as_you_go', 'subscription', 'per_act')),
  activation_status text not null default 'v1_free' check (activation_status in (
    'v1_free', 'v2_pay_as_you_go', 'v3_subscription', 'v4_premium', 'inactive'
  )),
  waterfall_level_default integer not null default 1 check (waterfall_level_default in (1, 2, 3)),
  engines_consumers text[] not null default '{}',
  priority text check (priority in ('P1', 'P2', 'P3', 'P4')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_data_sources_type on data_sources(type);
create index if not exists idx_data_sources_status on data_sources(activation_status);

comment on table data_sources is 'Registre des sources — chaque profil de segment y référence ses sources prioritaires par id ; deliverables.sources pointe vers ce registre + date pour la certifiabilité.';
