-- FTG — Migration 015 : auth réelle + 3 rôles (JC-08a Étape 1)
--
-- Additif et rétro-compatible. Câble l'auth Supabase (auth.users ↔ public.users.auth_ref
-- déjà présent) aux 3 rôles :
--   • Porteur   → RLS existante (owner) : voit son projet.
--   • Conseiller → membre d'org (org_members) : voit la cohorte de son org.
--   • Opérateur → drapeau `is_operator` : accède à la console admin.
-- N'affaiblit AUCUNE policy existante ni l'immuabilité de l'audit. Idempotent.

-- 1. Drapeau opérateur FTG (accès console admin). Additif, défaut false.
alter table users add column if not exists is_operator boolean not null default false;

-- 2. Helper security definer (même pattern que les ftg_*) : le lecteur partage-t-il une
--    organisation avec le porteur cible ? Utilisé par la policy cockpit ci-dessous.
create or replace function ftg_shares_org_cohort(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from projects p
    join org_members om on om.org_id = p.org_id
    where p.owner_user_id = p_user_id and om.user_id = ftg_current_user_id()
  )
$$;
revoke execute on function ftg_shares_org_cohort(uuid) from public, anon, authenticated;

-- 3. Additif : un membre d'org peut lire les lignes `users` des porteurs de sa cohorte
--    (le cockpit affiche les noms des porteurs). N'ouvre RIEN d'autre : strictement les
--    porteurs possédant un projet dans une org dont le lecteur est membre. S'ajoute (OR)
--    à users_select_self ; un porteur ne gagne aucun accès.
drop policy if exists users_select_org_cohort on users;
create policy users_select_org_cohort on users
  for select to authenticated
  using (ftg_shares_org_cohort(id));

-- 4. Helper : la ligne public.users de l'utilisateur auth courant est-elle opérateur ?
--    (résolu aussi côté serveur admin via service_role ; fourni pour cohérence.)
create or replace function ftg_is_operator()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_operator from users where auth_ref = auth.uid()), false)
$$;
revoke execute on function ftg_is_operator() from public, anon, authenticated;

comment on column users.is_operator is 'Opérateur FTG (accès console admin, JC-08a). Additif ; défaut false.';
comment on function ftg_shares_org_cohort(uuid) is 'Vrai si l''utilisateur courant est membre d''une org à laquelle appartient un projet du porteur cible. Socle de la policy cockpit users_select_org_cohort.';