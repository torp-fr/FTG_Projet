-- FTG — Migration 012 : admin_audit_log (JC-07 Étape 2)
--
-- Journal d'audit APPEND-ONLY et IMMUABLE de TOUS les actes opérateur de la console admin
-- (impersonation, promotion/refus/rollback de version, provisioning de compte). Chaque acte
-- opérateur est écrit ici — il est impossible d'agir sans trace.
--
-- Immuabilité garantie par TRIGGER : un trigger BEFORE UPDATE/DELETE/TRUNCATE lève une
-- exception. Les triggers ne sont PAS contournés par le bypass RLS du service_role — donc
-- même le rôle serveur de la console ne peut ni modifier ni supprimer une ligne d'audit.
-- Idempotent (create table/function/trigger if not exists / drop-create).

create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,  -- opérateur FTG (null si identité dev non mappée à un user)
  actor_label text not null,                                   -- ex. 'Opérateur FTG (dev) <ops@ftg.test>'
  action text not null,                                        -- ex. 'impersonation.start', 'version.promote', 'account.provision'
  target_type text,                                            -- ex. 'project', 'porteur', 'engine_version', 'user'
  target_id text,                                              -- id de la cible (texte : couvre projets/users/versions)
  target_label text,                                           -- libellé lisible de la cible
  details jsonb not null default '{}'::jsonb,                  -- contexte (périmètre consulté, résultat smoke, niveau d'accès…)
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created on admin_audit_log(created_at desc);
create index if not exists idx_admin_audit_action on admin_audit_log(action);
create index if not exists idx_admin_audit_target on admin_audit_log(target_type, target_id);

-- Immuabilité stricte : aucune modification/suppression après insertion (append-only).
create or replace function admin_audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit_log est append-only : % interdit (audit trail immuable).', tg_op;
end;
$$;

drop trigger if exists trg_admin_audit_immutable on admin_audit_log;
create trigger trg_admin_audit_immutable
  before update or delete on admin_audit_log
  for each row execute function admin_audit_log_immutable();

-- TRUNCATE contourne les triggers de ligne → trigger d'instruction dédié.
drop trigger if exists trg_admin_audit_no_truncate on admin_audit_log;
create trigger trg_admin_audit_no_truncate
  before truncate on admin_audit_log
  for each statement execute function admin_audit_log_immutable();

-- RLS deny-by-default : aucune policy pour authenticated → le rôle client ne peut NI lire
-- NI écrire l'audit. Seul le service_role (console admin, serveur) y accède (bypass RLS).
alter table admin_audit_log enable row level security;

comment on table admin_audit_log is 'Audit trail append-only et immuable des actes opérateur (console admin JC-07). Immuabilité par trigger (UPDATE/DELETE/TRUNCATE interdits, service_role inclus). Accès service_role uniquement (RLS deny-by-default).';
