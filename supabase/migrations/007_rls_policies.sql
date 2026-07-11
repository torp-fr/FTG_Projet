-- FTG — Migration 007 : RLS consolidée (Chantier 4 §0 principe 8, §6)
-- Un porteur ne voit que ses projets ; un advisor ne voit que sa cohorte (org) ;
-- verdicts/scores en lecture seule côté client (jamais d'INSERT/UPDATE direct sur
-- gate_evaluations, reserves, engine_runs depuis le rôle authenticated).
-- Les tables de référence (référentiel, segments, engines, sources) sont en lecture
-- seule pour authenticated ; toute écriture y transite par service_role (bypass RLS).

-- ============================================================
-- Fonctions utilitaires (security definer, évitent la récursion RLS)
-- ============================================================
create or replace function ftg_current_user_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from users where auth_ref = auth.uid()
$$;

create or replace function ftg_is_project_owner(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from projects
    where id = p_project_id and owner_user_id = ftg_current_user_id()
  )
$$;

create or replace function ftg_is_org_member_of_project(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from projects p
    join org_members om on om.org_id = p.org_id
    where p.id = p_project_id and om.user_id = ftg_current_user_id()
  )
$$;

create or replace function ftg_can_access_project(p_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select ftg_is_project_owner(p_project_id) or ftg_is_org_member_of_project(p_project_id)
$$;

create or replace function ftg_is_org_admin(p_org_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from org_members
    where org_id = p_org_id and user_id = ftg_current_user_id() and role = 'admin'
  )
$$;

-- ============================================================
-- Référentiel & configuration : lecture seule pour authenticated
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'referential_versions', 'phases', 'milestones', 'milestone_dependencies',
    'gates', 'segments', 'segment_milestone_overrides', 'agents', 'engines',
    'engine_versions', 'data_sources', 'watch_feeds',
    'golden_cases', 'eval_runs', 'improvement_backlog', 'quality_reports'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      t || '_read_all', t
    );
  end loop;
end $$;

-- ============================================================
-- users
-- ============================================================
alter table users enable row level security;

create policy users_select_self on users
  for select to authenticated
  using (auth_ref = auth.uid());

create policy users_update_self on users
  for update to authenticated
  using (auth_ref = auth.uid())
  with check (auth_ref = auth.uid());

-- ============================================================
-- organizations / org_members
-- ============================================================
alter table organizations enable row level security;
alter table org_members enable row level security;

create policy organizations_select_member on organizations
  for select to authenticated
  using (
    exists (select 1 from org_members om where om.org_id = organizations.id and om.user_id = ftg_current_user_id())
  );

create policy org_members_select_own_org on org_members
  for select to authenticated
  using (
    exists (select 1 from org_members om where om.org_id = org_members.org_id and om.user_id = ftg_current_user_id())
  );

create policy org_members_write_admin on org_members
  for all to authenticated
  using (ftg_is_org_admin(org_id))
  with check (ftg_is_org_admin(org_id));

-- ============================================================
-- projects
-- ============================================================
alter table projects enable row level security;

create policy projects_select_owner_or_org on projects
  for select to authenticated
  using (ftg_can_access_project(id));

create policy projects_insert_owner on projects
  for insert to authenticated
  with check (owner_user_id = ftg_current_user_id());

create policy projects_update_owner_or_admin on projects
  for update to authenticated
  using (ftg_is_project_owner(id) or (org_id is not null and ftg_is_org_admin(org_id)))
  with check (ftg_is_project_owner(id) or (org_id is not null and ftg_is_org_admin(org_id)));

-- ============================================================
-- Tables scoped par project_id (lecture: owner ou membre org ; écriture applicative
-- via service_role pour les tables issues de calculs serveur — gate_evaluations,
-- reserves, engine_runs — le client n'y écrit jamais directement, principe #2)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'founder_profiles', 'project_milestones', 'deliverables', 'gate_evaluations',
    'agent_objectives', 'project_journal', 'decisions', 'engine_runs',
    'usage_quotas', 'knowledge_bases'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (ftg_can_access_project(project_id))',
      t || '_select_scoped', t
    );
  end loop;
end $$;

-- founder_profiles: le porteur peut éditer son propre profil
create policy founder_profiles_write_owner on founder_profiles
  for all to authenticated
  using (ftg_is_project_owner(project_id))
  with check (ftg_is_project_owner(project_id));

-- project_milestones: écriture applicative (open/force) réservée au porteur/advisor,
-- mais le champ `state` en résultat de calcul reste recalculé serveur (Sequencer)
create policy project_milestones_write_owner_or_org on project_milestones
  for update to authenticated
  using (ftg_can_access_project(project_id))
  with check (ftg_can_access_project(project_id));

-- decisions: le porteur trace ses arbitrages
create policy decisions_write_owner on decisions
  for insert to authenticated
  with check (ftg_is_project_owner(project_id));

-- knowledge_bases: le porteur gère sa base de connaissance
create policy knowledge_bases_write_owner on knowledge_bases
  for all to authenticated
  using (ftg_is_project_owner(project_id))
  with check (ftg_is_project_owner(project_id));

-- gate_evaluations, reserves, engine_runs, usage_quotas, agent_objectives, project_journal :
-- SELECT seul côté client (principe #2 : le client ne calcule ni ne force un verdict).
-- Toute écriture transite par les fonctions serveur (service_role, bypass RLS).

-- ============================================================
-- evidences (via project_milestones)
-- ============================================================
alter table evidences enable row level security;

create policy evidences_select_scoped on evidences
  for select to authenticated
  using (
    exists (
      select 1 from project_milestones pm
      where pm.id = evidences.project_milestone_id and ftg_can_access_project(pm.project_id)
    )
  );

create policy evidences_insert_owner on evidences
  for insert to authenticated
  with check (
    exists (
      select 1 from project_milestones pm
      where pm.id = evidences.project_milestone_id and ftg_is_project_owner(pm.project_id)
    )
  );

-- ============================================================
-- deliverable_threads / deliverable_messages (via deliverables)
-- ============================================================
alter table deliverable_threads enable row level security;
alter table deliverable_messages enable row level security;

create policy deliverable_threads_select_scoped on deliverable_threads
  for select to authenticated
  using (
    exists (
      select 1 from deliverables d
      where d.id = deliverable_threads.deliverable_id and ftg_can_access_project(d.project_id)
    )
  );

create policy deliverable_messages_select_scoped on deliverable_messages
  for select to authenticated
  using (
    exists (
      select 1 from deliverable_threads t
      join deliverables d on d.id = t.deliverable_id
      where t.id = deliverable_messages.thread_id and ftg_can_access_project(d.project_id)
    )
  );

create policy deliverable_messages_insert_scoped on deliverable_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from deliverable_threads t
      join deliverables d on d.id = t.deliverable_id
      where t.id = deliverable_messages.thread_id and ftg_can_access_project(d.project_id)
    )
  );

-- ============================================================
-- reserves (via gate_evaluations)
-- ============================================================
alter table reserves enable row level security;

create policy reserves_select_scoped on reserves
  for select to authenticated
  using (
    exists (
      select 1 from gate_evaluations ge
      where ge.id = reserves.gate_evaluation_id and ftg_can_access_project(ge.project_id)
    )
  );

-- ============================================================
-- knowledge_documents / knowledge_chunks (via knowledge_bases)
-- ============================================================
alter table knowledge_documents enable row level security;
alter table knowledge_chunks enable row level security;

create policy knowledge_documents_scoped on knowledge_documents
  for all to authenticated
  using (
    exists (
      select 1 from knowledge_bases kb
      where kb.id = knowledge_documents.knowledge_base_id and ftg_is_project_owner(kb.project_id)
    )
  )
  with check (
    exists (
      select 1 from knowledge_bases kb
      where kb.id = knowledge_documents.knowledge_base_id and ftg_is_project_owner(kb.project_id)
    )
  );

create policy knowledge_chunks_scoped on knowledge_chunks
  for all to authenticated
  using (
    exists (
      select 1 from knowledge_documents kd
      join knowledge_bases kb on kb.id = kd.knowledge_base_id
      where kd.id = knowledge_chunks.document_id and ftg_is_project_owner(kb.project_id)
    )
  )
  with check (
    exists (
      select 1 from knowledge_documents kd
      join knowledge_bases kb on kb.id = kd.knowledge_base_id
      where kd.id = knowledge_chunks.document_id and ftg_is_project_owner(kb.project_id)
    )
  );

-- ============================================================
-- watch_alerts (routing par projet, ou global si project_id null → org/global feed)
-- ============================================================
alter table watch_alerts enable row level security;

create policy watch_alerts_select_scoped on watch_alerts
  for select to authenticated
  using (project_id is null or ftg_can_access_project(project_id));

-- ============================================================
-- llm_connections : strictement l'utilisateur ou l'admin d'org concerné
-- ============================================================
alter table llm_connections enable row level security;

create policy llm_connections_select_self on llm_connections
  for select to authenticated
  using (
    owner_user_id = ftg_current_user_id()
    or (owner_org_id is not null and ftg_is_org_admin(owner_org_id))
  );

create policy llm_connections_write_self on llm_connections
  for all to authenticated
  using (
    owner_user_id = ftg_current_user_id()
    or (owner_org_id is not null and ftg_is_org_admin(owner_org_id))
  )
  with check (
    owner_user_id = ftg_current_user_id()
    or (owner_org_id is not null and ftg_is_org_admin(owner_org_id))
  );

comment on function ftg_can_access_project(uuid) is 'Vrai si l''utilisateur courant est propriétaire du projet ou membre de son organisation. Utilisé comme socle de toutes les policies RLS scoped par projet.';
