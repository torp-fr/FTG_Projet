-- FTG — Migration 014 : niveau d'accès des comptes pilotes B2B2C (JC-07 Étape 4)
--
-- Additif et rétro-compatible : ajoute l'entitlement d'accès d'un parcours pilote sur `projects`.
-- Les lignes existantes prennent 'complet' par défaut (aucune régression de la cohorte ni des
-- runs réels). L'entitlement est consommé par le gate de l'orchestrateur (portée des phases /
-- engines accessibles) — la VISIBILITÉ reste régie par les RLS existantes (owner + membres org),
-- inchangées. Idempotent.

alter table projects
  add column if not exists access_level text not null default 'complet'
  check (access_level in ('freemium', 'partiel', 'complet'));

alter table projects
  add column if not exists access_scope jsonb not null default '{}'::jsonb;

comment on column projects.access_level is
  'Niveau d''accès du compte pilote (JC-07) : freemium (P0 gratuit) / partiel (périmètre access_scope) / complet. Additif ; consommé par le gate orchestrateur. La visibilité reste régie par les RLS existantes.';
comment on column projects.access_scope is
  'Périmètre du niveau ''partiel'' (ex. {"phases":["P0","P1","P2"]}). Vide pour freemium/complet.';