-- FTG — Migration 011 : table `events` (socle du futur nervous system EOS).
--
-- Flux d'événements APPEND-ONLY émis par l'orchestrateur (Diffuser) à chaque run/gate.
-- JC-05 émet ces événements « même si rien ne les consomme » — pour ne pas fermer la porte
-- à EOS — mais NE construit AUCUN consommateur. Distinct de `project_journal` (digest
-- lisible humain) : ici, une enveloppe machine typée + payload structuré.
--
-- Idempotent (create table/policy if not exists / drop-create policy).

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,   -- null = événement global
  type text not null,                                          -- ex. 'engine_run.done', 'gate.evaluated', 'milestone.state_changed'
  payload jsonb not null default '{}'::jsonb,
  actor text,                                                  -- ex. 'orchestrator:diffuser', 'engine:founder_profiler'
  created_at timestamptz not null default now()
);

create index if not exists idx_events_project on events(project_id, created_at desc);
create index if not exists idx_events_type on events(type);

-- RLS : lecture project-scopée (comme les autres tables tenant), écriture via service_role
-- (bypass RLS) uniquement — le client n'émet jamais d'événement directement (principe #2).
alter table events enable row level security;

drop policy if exists events_select_scoped on events;
create policy events_select_scoped on events
  for select to authenticated
  using (project_id is null or ftg_can_access_project(project_id));

comment on table events is 'Flux d''événements append-only (socle nervous system EOS). Émis par l''orchestrateur ; aucun consommateur en JC-05. Écriture service_role uniquement.';
