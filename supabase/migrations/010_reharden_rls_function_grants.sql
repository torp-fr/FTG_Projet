-- FTG — Migration 010 : re-durcissement des grants sur les fonctions RLS.
--
-- ⚠️ DÉJÀ APPLIQUÉE en base (projet ftg-plateforme) le 11/07/2026 via Supabase MCP.
-- Ce fichier n'est ici que pour TRACER le changement dans le repo (parité migrations ↔
-- base) — ne pas ré-exécuter aveuglément. Les REVOKE sont idempotents (ré-exécution
-- sans effet ni erreur), donc rejouer la migration reste sûr.
--
-- Contexte : un CREATE OR REPLACE FUNCTION ultérieur a ré-accordé, par défaut,
-- l'EXECUTE à PUBLIC sur ces fonctions SECURITY DEFINER (comportement PostgreSQL :
-- un CREATE OR REPLACE réinitialise les privilèges par défaut). On re-révoque donc
-- explicitement l'EXECUTE pour public/anon/authenticated : ces fonctions ne doivent
-- être appelées que dans le contexte des policies RLS, jamais directement par un rôle
-- client.

-- Re-révoque l'EXECUTE public sur les fonctions RLS SECURITY DEFINER.
-- (un CREATE OR REPLACE ultérieur avait ré-accordé le grant par défaut à PUBLIC)
revoke execute on function public.ftg_current_user_id() from public, anon, authenticated;
revoke execute on function public.ftg_is_project_owner(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_is_org_member_of_project(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_can_access_project(uuid) from public, anon, authenticated;
revoke execute on function public.ftg_is_org_admin(uuid) from public, anon, authenticated;
