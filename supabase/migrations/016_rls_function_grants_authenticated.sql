-- FTG — Migration 016 : EXECUTE des fonctions RLS pour `authenticated` (JC-08a Étape 1)
--
-- Corrige un défaut LATENT révélé par l'arrivée de l'auth réelle. La migration 010 avait
-- révoqué l'EXECUTE de ces fonctions SECURITY DEFINER à public/anon/authenticated « car elles
-- ne doivent être appelées que dans le contexte des policies RLS ». Or l'évaluation d'une
-- policy RLS appelle la fonction AVEC LE RÔLE DU DEMANDEUR : sans EXECUTE, tout SELECT scoppé
-- par un utilisateur `authenticated` échoue avec « permission denied for function ».
--
-- Ce défaut n'avait jamais été observé car TOUS les accès app passaient par service_role
-- (bypass RLS). JC-08a introduit des lectures réellement authentifiées (porteur/conseiller via
-- leur session) → l'EXECUTE `authenticated` est requis pour que la RLS fonctionne.
--
-- Ne ré-accorde RIEN à anon/public : seul `authenticated` en a besoin (les policies scoppées
-- sont `to authenticated`). Ces fonctions ne renvoient que des booléens / l'id de l'utilisateur
-- courant à partir de auth.uid() — aucune fuite. Idempotent.

grant execute on function public.ftg_current_user_id() to authenticated;
grant execute on function public.ftg_is_project_owner(uuid) to authenticated;
grant execute on function public.ftg_is_org_member_of_project(uuid) to authenticated;
grant execute on function public.ftg_can_access_project(uuid) to authenticated;
grant execute on function public.ftg_is_org_admin(uuid) to authenticated;
grant execute on function public.ftg_shares_org_cohort(uuid) to authenticated;