-- FTG — Migration 009 : backfill de reproductibilité (durcissement « 008 » fantôme).
--
-- Contexte : la migration 008 (« security_hardening ») a été appliquée DIRECTEMENT en base
-- au Lot 1 (via Supabase MCP) puis tracée dans supabase_migrations.schema_migrations, mais
-- SANS fichier .sql dans le repo. Deux de ses effets n'étaient donc reconstructibles depuis
-- aucun fichier de migration :
--   (1) search_path figé sur la fonction trigger set_updated_at (créée en 002 SANS clause
--       `set search_path`) — advisory linter Supabase « function search_path mutable » ;
--   (2) EXECUTE révoqué sur les fonctions RLS SECURITY DEFINER ftg_* pour public/anon/
--       authenticated (le fichier 010 le ré-assure déjà, mais on le capture ici pour que la
--       chaîne 001→009 reproduise seule l'état durci).
--
-- Ce fichier capture EXACTEMENT ces effets, de façon IDEMPOTENTE (ré-exécution sans effet ni
-- erreur), afin que le schéma live soit 100 % reconstructible depuis les fichiers de migration
-- (parité fichiers ↔ base). Il est SÛR de le rejouer.

-- (1) set_updated_at : search_path figé (idempotent — repositionne la même valeur).
alter function public.set_updated_at() set search_path = public;

-- (2) ftg_* : EXECUTE réservé au contexte des policies RLS (jamais appelées par un rôle
--     client). REVOKE idempotent. Le fichier 010 ré-applique ces révocations après un
--     éventuel CREATE OR REPLACE ultérieur qui réaccorderait le grant par défaut à PUBLIC.
revoke execute on function public.ftg_current_user_id() from public, anon, authenticated;
revoke execute on function public.ftg_is_project_owner(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_is_org_member_of_project(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_can_access_project(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_is_org_admin(uuid) from public, anon, authenticated;
