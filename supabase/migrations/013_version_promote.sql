-- FTG — Migration 013 : version.promote sous verrous anti-régression (JC-07 Étape 3)
--
-- Codifie en base le mécanisme manquant (cf. docs/ops/engine-state.md, Sprint 0 : la
-- promotion candidate→active avait été faite en SQL à la main, sans mécanisme applicatif).
--
-- 1. VERROU « exactement une version active par engine » : index unique partiel.
-- 2. FONCTION promote_engine_version(...) : promotion transactionnelle sous verrous —
--    ne promeut candidate→active QUE si le smoke passe (vert) ET aucune régression ;
--    sinon refus explicite tracé. Rollback = re-promotion d'une version antérieure
--    (retired→active). Chaque promotion / refus / rollback écrit dans admin_audit_log,
--    dans la MÊME transaction (promotion et trace indissociables).
-- Idempotent.

-- 1. Verrou d'invariant : au plus une version 'active' par engine.
create unique index if not exists uq_engine_versions_one_active
  on engine_versions(engine_id) where status = 'active';

-- 2. Promotion sous verrous. security definer + EXECUTE révoqué au client → seul le
--    service_role (console admin serveur) peut promouvoir ; le client ne s'auto-promeut jamais.
create or replace function promote_engine_version(
  p_version_id uuid,
  p_actor_label text,
  p_smoke_passed boolean,
  p_smoke_details jsonb default '{}'::jsonb,
  p_regression_ok boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_engine_id uuid;
  v_engine_code text;
  v_target_status text;
  v_target_semver text;
  v_prev_id uuid;
  v_prev_semver text;
  v_action text;
  v_is_rollback boolean;
begin
  select ev.engine_id, ev.status, ev.semver, e.code
    into v_engine_id, v_target_status, v_target_semver, v_engine_code
    from engine_versions ev join engines e on e.id = ev.engine_id
    where ev.id = p_version_id;
  if v_engine_id is null then
    raise exception 'promote_engine_version: version % introuvable', p_version_id;
  end if;

  -- Verrou anti-régression : refus explicite tracé si smoke rouge OU régression détectée.
  if not p_smoke_passed or not p_regression_ok then
    insert into admin_audit_log(actor_label, action, target_type, target_id, target_label, details)
      values(p_actor_label, 'version.promote_refused', 'engine_version', p_version_id::text,
             v_engine_code || ' ' || v_target_semver,
             jsonb_build_object('engine', v_engine_code, 'semver', v_target_semver,
               'smoke_passed', p_smoke_passed, 'regression_ok', p_regression_ok, 'smoke', p_smoke_details));
    return jsonb_build_object('promoted', false,
      'reason', case when not p_smoke_passed then 'smoke_red' else 'regression' end,
      'engine', v_engine_code, 'semver', v_target_semver);
  end if;

  -- Déjà active → no-op idempotent (aucun acte, aucune trace).
  if v_target_status = 'active' then
    return jsonb_build_object('promoted', false, 'reason', 'already_active',
      'engine', v_engine_code, 'semver', v_target_semver);
  end if;

  v_is_rollback := (v_target_status = 'retired');
  v_action := case when v_is_rollback then 'version.rollback' else 'version.promote' end;

  select id, semver into v_prev_id, v_prev_semver
    from engine_versions where engine_id = v_engine_id and status = 'active';

  -- Swap transactionnel (le corps de fonction = une seule transaction) : on RETIRE d'abord
  -- l'ancienne active, PUIS on active la cible → respecte l'index unique partiel à tout instant.
  if v_prev_id is not null then
    update engine_versions set status = 'retired' where id = v_prev_id;
  end if;
  update engine_versions set status = 'active', deployed_at = now() where id = p_version_id;
  update engines set current_version_id = p_version_id where id = v_engine_id;

  insert into admin_audit_log(actor_label, action, target_type, target_id, target_label, details)
    values(p_actor_label, v_action, 'engine_version', p_version_id::text,
           v_engine_code || ' ' || v_target_semver,
           jsonb_build_object('engine', v_engine_code, 'to_semver', v_target_semver,
             'from_version_id', v_prev_id, 'from_semver', v_prev_semver,
             'rollback', v_is_rollback, 'smoke', p_smoke_details));

  return jsonb_build_object('promoted', true, 'action', v_action, 'engine', v_engine_code,
    'to_semver', v_target_semver, 'from_semver', v_prev_semver, 'rollback', v_is_rollback);
end;
$$;

revoke execute on function promote_engine_version(uuid, text, boolean, jsonb, boolean) from public, anon, authenticated;

comment on function promote_engine_version(uuid, text, boolean, jsonb, boolean) is
  'Promotion candidate→active sous verrous (JC-07). Promeut seulement si smoke vert ET pas de régression ; sinon refus tracé. Exactement une version active par engine (swap transactionnel + index unique partiel). Rollback = re-promotion (retired→active). Chaque promotion/refus/rollback est écrit dans admin_audit_log dans la même transaction. service_role uniquement.';