import "server-only";
import type { Json } from "@ftg/database";
import { getServiceClient } from "./supabase";
import { getOperator } from "./operator";

/**
 * Engines & version.promote (Étape 3 JC-07).
 *
 * La promotion candidate→active passe par la fonction base `promote_engine_version` (migration
 * 013) : verrous anti-régression (refus si smoke rouge), swap transactionnel (exactement une
 * version active par engine, garanti aussi par un index unique partiel), audit dans la même
 * transaction. Ce module lit l'état des engines et expose le smoke + la promotion.
 */

export interface EngineVersionRow {
  id: string;
  semver: string;
  status: string;
  deployedAt: string | null;
  parentVersionId: string | null;
  isCurrent: boolean;
}
export interface EngineRow {
  id: string;
  code: string;
  name: string;
  status: string;
  currentVersionId: string | null;
  versions: EngineVersionRow[];
  lastRun: { status: string; taskType: string; finishedAt: string | null } | null;
}

export async function getEnginesOverview(): Promise<EngineRow[]> {
  const c = getServiceClient();
  const { data: enginesRaw } = await c.from("engines").select("id, code, name, status, current_version_id").order("code");
  const engines = (enginesRaw ?? []) as Array<{ id: string; code: string; name: string; status: string; current_version_id: string | null }>;

  const { data: versRaw } = await c.from("engine_versions").select("id, engine_id, semver, status, deployed_at, parent_version_id");
  const vers = (versRaw ?? []) as Array<{ id: string; engine_id: string; semver: string; status: string; deployed_at: string | null; parent_version_id: string | null }>;

  // Dernier run réel par engine (via ses versions) — santé opérationnelle observée.
  const versionToEngine = new Map<string, string>();
  for (const v of vers) versionToEngine.set(v.id, v.engine_id);
  const { data: runsRaw } = await c
    .from("engine_runs")
    .select("engine_version_id, status, task_type, finished_at")
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(400);
  const lastRunByEngine = new Map<string, { status: string; taskType: string; finishedAt: string | null }>();
  for (const r of (runsRaw ?? []) as Array<{ engine_version_id: string; status: string; task_type: string; finished_at: string | null }>) {
    const eng = versionToEngine.get(r.engine_version_id);
    if (eng && !lastRunByEngine.has(eng)) lastRunByEngine.set(eng, { status: r.status, taskType: r.task_type, finishedAt: r.finished_at });
  }

  return engines.map((e) => ({
    id: e.id,
    code: e.code,
    name: e.name,
    status: e.status,
    currentVersionId: e.current_version_id,
    versions: vers
      .filter((v) => v.engine_id === e.id)
      .sort((a, b) => (a.semver < b.semver ? -1 : 1))
      .map((v) => ({ id: v.id, semver: v.semver, status: v.status, deployedAt: v.deployed_at, parentVersionId: v.parent_version_id, isCurrent: v.id === e.current_version_id })),
    lastRun: lastRunByEngine.get(e.id) ?? null,
  }));
}

export interface SmokeResult {
  passed: boolean;
  details: Record<string, unknown>;
}

/**
 * Smoke réel de l'engine avant promotion.
 *
 * Dans cet environnement (dev, sans ANTHROPIC_API_KEY), le smoke LLM complet de chaque engine
 * vit dans la couche scripts (scripts/e*-smoke-test.ts) et son résultat peut être passé à
 * `promote_engine_version`. Le smoke exécuté ici est un smoke réel LÉGER, coût-neutre : il
 * vérifie la santé opérationnelle observée de l'engine — son DERNIER run réel enregistré a
 * abouti (status='done'). Fail-closed : sans run réel probant, la promotion est refusée.
 */
export async function runEngineSmoke(engineCode: string): Promise<SmokeResult> {
  const c = getServiceClient();
  const { data: engRaw } = await c.from("engines").select("id, code, status").eq("code", engineCode).maybeSingle();
  const eng = engRaw as { id: string; code: string; status: string } | null;
  if (!eng) return { passed: false, details: { reason: `engine ${engineCode} introuvable` } };

  const { data: versRaw } = await c.from("engine_versions").select("id").eq("engine_id", eng.id);
  const versionIds = ((versRaw ?? []) as Array<{ id: string }>).map((v) => v.id);
  if (versionIds.length === 0) return { passed: false, details: { reason: "aucune version enregistrée pour cet engine" } };

  const { data: runRaw } = await c
    .from("engine_runs")
    .select("id, status, task_type, finished_at")
    .in("engine_version_id", versionIds)
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const lastRun = runRaw as { id: string; status: string; task_type: string; finished_at: string | null } | null;
  if (!lastRun) {
    return {
      passed: false,
      details: { reason: "aucun run réel enregistré — exécuter le smoke (scripts/e*-smoke-test) avant promotion", basis: "dernier_run_réel" },
    };
  }

  const passed = lastRun.status === "done";
  return {
    passed,
    details: {
      basis: "dernier_run_réel",
      lastRunId: lastRun.id,
      status: lastRun.status,
      taskType: lastRun.task_type,
      finishedAt: lastRun.finished_at,
      note: "smoke léger (santé engine). Smoke LLM complet de la version candidate = scripts/e*-smoke-test.",
    },
  };
}

export interface PromoteResult {
  promoted: boolean;
  action?: string;
  reason?: string;
  engine?: string;
  to_semver?: string;
  from_semver?: string | null;
  rollback?: boolean;
  semver?: string;
}

/** Appelle la fonction base sous verrous (refus si smoke rouge, swap atomique + audit). */
export async function promoteVersion(versionId: string, smoke: SmokeResult, regressionOk = true): Promise<PromoteResult> {
  const c = getServiceClient();
  const op = await getOperator();
  const { data, error } = await c.rpc("promote_engine_version", {
    p_version_id: versionId,
    p_actor_label: op.label,
    p_smoke_passed: smoke.passed,
    p_smoke_details: smoke.details as unknown as Json,
    p_regression_ok: regressionOk,
  });
  if (error) throw new Error(`promoteVersion: ${error.message}`);
  return (data ?? {}) as unknown as PromoteResult;
}
