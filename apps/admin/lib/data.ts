import "server-only";
import { getServiceClient } from "./supabase";

/**
 * Couche de lecture SUPERVISION (Étape 1 JC-07) — pure lecture des VRAIS états produits
 * par l'orchestrateur JC-05 : project_milestones, gate_evaluations, engine_runs, events,
 * project_journal, deliverables. Aucune écriture ici (supervision pure). Service_role
 * (bypass RLS) : l'opérateur voit toutes les organisations/projets, cohorte seedée + runs réels.
 */

const PHASE_ORDER = ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
const phaseOf = (code: string) => code.split("-")[0] ?? "P0";
const orderOf = (ph: string) => PHASE_ORDER.indexOf(ph);
const maxPhase = (codes: string[]) => codes.reduce((best, p) => (orderOf(p) > orderOf(best) ? p : best), "P0");

type Client = ReturnType<typeof getServiceClient>;

async function idNameMap(
  c: Client,
  table: "segments" | "gates" | "milestones",
  col: "name" | "code",
  ids: string[],
): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  const uniq = [...new Set(ids)].filter(Boolean);
  if (uniq.length === 0) return m;
  const { data } = await c.from(table).select(`id, ${col}`).in("id", uniq);
  for (const r of (data ?? []) as Array<Record<string, string>>) m.set(r.id, r[col] ?? "");
  return m;
}

function deriveCurrentPhase(codesByState: Array<{ code: string; state: string }>): string {
  const inProg = codesByState.filter((m) => ["in_progress", "awaiting_proof", "awaiting_review"].includes(m.state));
  if (inProg.length) return maxPhase(inProg.map((m) => phaseOf(m.code)));
  const done = codesByState.filter((m) => ["done", "forced"].includes(m.state));
  if (done.length) return maxPhase(done.map((m) => phaseOf(m.code)));
  return "P0";
}

// latest verdict = gate le plus avancé (code décroissant), à défaut le plus récent.
function pickLatestGate<T extends { gateCode: string; evaluatedAt: string }>(evals: T[]): T | null {
  if (evals.length === 0) return null;
  return [...evals].sort((a, b) =>
    a.gateCode < b.gateCode ? 1 : a.gateCode > b.gateCode ? -1 : a.evaluatedAt < b.evaluatedAt ? 1 : -1,
  )[0] ?? null;
}

// ── Supervision : liste organisations / projets ──────────────────────────────

export interface SupervisionRow {
  id: string;
  name: string;
  ownerName: string;
  status: string;
  entryDoor: string;
  ambition: string | null;
  segment: string | null;
  currentPhase: string;
  doneCount: number;
  seededCount: number;
  pct: number;
  verdict: string | null;
  vectors: Record<string, number>;
  nDeliverables: number;
  nRuns: number;
}
export interface SupervisionOrg {
  orgId: string | null;
  orgName: string;
  orgType: string | null;
  rows: SupervisionRow[];
}
export interface SupervisionOverview {
  orgs: SupervisionOrg[];
  kpis: { orgs: number; projects: number; byPhase: Record<string, number>; byVerdict: Record<string, number> };
}

function count(vals: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of vals) out[v] = (out[v] ?? 0) + 1;
  return out;
}

export async function getSupervisionOverview(): Promise<SupervisionOverview> {
  const c = getServiceClient();

  const { data: orgsRaw } = await c.from("organizations").select("id, name, type").order("name");
  const orgs = (orgsRaw ?? []) as Array<{ id: string; name: string; type: string | null }>;

  const { data: projectsRaw } = await c
    .from("projects")
    .select("id, name, entry_door, ambition_profile, status, owner_user_id, segment_primary_id, org_id")
    .order("created_at");
  const projects = (projectsRaw ?? []) as Array<{
    id: string; name: string; entry_door: string; ambition_profile: string | null;
    status: string; owner_user_id: string; segment_primary_id: string | null; org_id: string | null;
  }>;
  if (projects.length === 0) {
    return { orgs: [], kpis: { orgs: orgs.length, projects: 0, byPhase: {}, byVerdict: {} } };
  }
  const ids = projects.map((p) => p.id);

  const { data: usersRaw } = await c.from("users").select("id, profile").in("id", projects.map((p) => p.owner_user_id));
  const ownerName = new Map<string, string>();
  for (const u of (usersRaw ?? []) as Array<{ id: string; profile: { name?: string } | null }>) {
    ownerName.set(u.id, u.profile?.name ?? "—");
  }
  const segName = await idNameMap(c, "segments", "name", projects.map((p) => p.segment_primary_id).filter((x): x is string => !!x));

  const { data: pmsRaw } = await c.from("project_milestones").select("project_id, state, milestone_id").in("project_id", ids);
  const pms = (pmsRaw ?? []) as Array<{ project_id: string; state: string; milestone_id: string }>;
  const msCode = await idNameMap(c, "milestones", "code", pms.map((m) => m.milestone_id));

  const { data: gesRaw } = await c.from("gate_evaluations").select("project_id, verdict, evaluated_at, gate_id, computed_scores").in("project_id", ids);
  const ges = (gesRaw ?? []) as Array<{ project_id: string; verdict: string; evaluated_at: string; gate_id: string; computed_scores: Record<string, number> | null }>;
  const gateCode = await idNameMap(c, "gates", "code", ges.map((g) => g.gate_id));

  const { data: delsRaw } = await c.from("deliverables").select("project_id").in("project_id", ids);
  const dels = (delsRaw ?? []) as Array<{ project_id: string }>;
  const { data: runsRaw } = await c.from("engine_runs").select("project_id").in("project_id", ids);
  const runs = (runsRaw ?? []) as Array<{ project_id: string }>;

  const rowFor = (p: (typeof projects)[number]): SupervisionRow => {
    const myPms = pms.filter((m) => m.project_id === p.id).map((m) => ({ code: msCode.get(m.milestone_id) ?? "", state: m.state }));
    const doneCount = myPms.filter((m) => ["done", "forced"].includes(m.state)).length;
    const seededCount = myPms.length;
    const gl = ges
      .filter((g) => g.project_id === p.id)
      .map((g) => ({ gateCode: gateCode.get(g.gate_id) ?? "", verdict: g.verdict, evaluatedAt: g.evaluated_at, scores: (g.computed_scores ?? {}) as Record<string, number> }));
    const latest = pickLatestGate(gl);
    return {
      id: p.id,
      name: p.name,
      ownerName: ownerName.get(p.owner_user_id) ?? "—",
      status: p.status,
      entryDoor: p.entry_door,
      ambition: p.ambition_profile,
      segment: p.segment_primary_id ? segName.get(p.segment_primary_id) ?? null : null,
      currentPhase: deriveCurrentPhase(myPms),
      doneCount,
      seededCount,
      pct: seededCount ? Math.round((100 * doneCount) / seededCount) : 0,
      verdict: latest?.verdict ?? null,
      vectors: latest ? Object.fromEntries(Object.entries(latest.scores).filter(([k]) => /^V\d$/.test(k))) : {},
      nDeliverables: dels.filter((d) => d.project_id === p.id).length,
      nRuns: runs.filter((r) => r.project_id === p.id).length,
    };
  };

  const grouped: SupervisionOrg[] = [];
  for (const o of orgs) {
    const rows = projects.filter((p) => p.org_id === o.id).map(rowFor);
    if (rows.length) grouped.push({ orgId: o.id, orgName: o.name, orgType: o.type, rows });
  }
  const orphanRows = projects.filter((p) => !p.org_id).map(rowFor);
  if (orphanRows.length) {
    grouped.push({ orgId: null, orgName: "Projets hors organisation (runs directs)", orgType: null, rows: orphanRows });
  }

  const allRows = grouped.flatMap((g) => g.rows);
  return {
    orgs: grouped,
    kpis: {
      orgs: grouped.length,
      projects: allRows.length,
      byPhase: count(allRows.map((r) => r.currentPhase)),
      byVerdict: count(allRows.map((r) => r.verdict ?? "—")),
    },
  };
}

// ── Supervision : fiche projet (tous les vrais états) ────────────────────────

export interface JalonView { code: string; phase: string; state: string; quality: number | null; forcedReason: string | null; doneAt: string | null }
export interface GateFullView {
  code: string;
  verdict: string;
  computedScores: Record<string, number>;
  reserves: Array<{ vector?: string; detail?: string }>;
  solutionPaths: Array<{ title?: string; description?: string }>;
  evaluatedAt: string;
}
export interface RunView {
  id: string;
  engineCode: string;
  taskType: string;
  status: string;
  costEstimate: number | null;
  tokens: number;
  modelCalls: number;
  qualitySelf: number | null;
  researchDepth: number;
  startedAt: string | null;
  finishedAt: string | null;
}
export interface JournalView { id: string; eventType: string; digest: string; actor: string | null; createdAt: string }
export interface EventView { id: string; type: string; actor: string | null; payload: Record<string, unknown>; createdAt: string }
export interface DeliverableRow { id: string; type: string; title: string; version: number; status: string; createdAt: string }

export interface ProjectSupervision {
  id: string;
  name: string;
  ownerName: string;
  ownerUserId: string;
  orgName: string | null;
  segment: string | null;
  ambition: string | null;
  status: string;
  entryDoor: string;
  accessLevel: string | null;
  currentPhase: string;
  progression: { doneCount: number; seededCount: number; pct: number };
  jalons: JalonView[];
  gates: GateFullView[];
  runs: RunView[];
  deliverables: DeliverableRow[];
  journal: JournalView[];
  events: EventView[];
}

export async function getProjectSupervision(id: string): Promise<ProjectSupervision | null> {
  const c = getServiceClient();

  const { data: pRaw } = await c
    .from("projects")
    .select("id, name, entry_door, ambition_profile, status, owner_user_id, segment_primary_id, org_id, access_level")
    .eq("id", id)
    .maybeSingle();
  const p = pRaw as {
    id: string; name: string; entry_door: string; ambition_profile: string | null; status: string;
    owner_user_id: string; segment_primary_id: string | null; org_id: string | null; access_level: string | null;
  } | null;
  if (!p) return null;

  const { data: uRaw } = await c.from("users").select("profile").eq("id", p.owner_user_id).maybeSingle();
  const ownerName = (uRaw as { profile: { name?: string } | null } | null)?.profile?.name ?? "—";
  const orgName = p.org_id ? ((await c.from("organizations").select("name").eq("id", p.org_id).maybeSingle()).data as { name: string } | null)?.name ?? null : null;
  const segment = p.segment_primary_id ? (await idNameMap(c, "segments", "name", [p.segment_primary_id])).get(p.segment_primary_id) ?? null : null;

  // Jalons
  const { data: pmsRaw } = await c.from("project_milestones").select("state, milestone_id, quality_score, forced_reason, done_at").eq("project_id", id);
  const pms = (pmsRaw ?? []) as Array<{ state: string; milestone_id: string; quality_score: number | null; forced_reason: string | null; done_at: string | null }>;
  const msCode = await idNameMap(c, "milestones", "code", pms.map((m) => m.milestone_id));
  const jalons: JalonView[] = pms
    .map((m) => {
      const code = msCode.get(m.milestone_id) ?? "";
      return { code, phase: phaseOf(code), state: m.state, quality: m.quality_score, forcedReason: m.forced_reason, doneAt: m.done_at };
    })
    .filter((j) => j.code)
    .sort((a, b) => (a.code < b.code ? -1 : 1));
  const doneCount = jalons.filter((j) => ["done", "forced"].includes(j.state)).length;
  const seededCount = jalons.length;

  // Gates
  const { data: gesRaw } = await c.from("gate_evaluations").select("gate_id, verdict, computed_scores, facts, solution_paths, evaluated_at").eq("project_id", id);
  const ges = (gesRaw ?? []) as Array<{ gate_id: string; verdict: string; computed_scores: Record<string, number> | null; facts: unknown; solution_paths: unknown; evaluated_at: string }>;
  const gateCode = await idNameMap(c, "gates", "code", ges.map((g) => g.gate_id));
  const gates: GateFullView[] = ges
    .map((g) => {
      const facts = Array.isArray(g.facts) ? (g.facts as Array<Record<string, unknown>>) : [];
      return {
        code: gateCode.get(g.gate_id) ?? "",
        verdict: g.verdict,
        computedScores: (g.computed_scores ?? {}) as Record<string, number>,
        reserves: facts.filter((f) => f.kind === "reserve").map((f) => ({ vector: f.vector as string | undefined, detail: f.detail as string | undefined })),
        solutionPaths: Array.isArray(g.solution_paths) ? (g.solution_paths as GateFullView["solutionPaths"]) : [],
        evaluatedAt: g.evaluated_at,
      };
    })
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  // Engine runs (coût/tokens) + engines mapping + quality_self depuis events
  const { data: enginesRaw } = await c.from("engines").select("id, code");
  const engineById = new Map<string, string>();
  for (const e of (enginesRaw ?? []) as Array<{ id: string; code: string }>) engineById.set(e.id, e.code);
  const { data: evRaw } = await c.from("engine_versions").select("id, engine_id");
  const versionToEngine = new Map<string, string>();
  for (const v of (evRaw ?? []) as Array<{ id: string; engine_id: string }>) versionToEngine.set(v.id, v.engine_id);

  const { data: runsRaw } = await c
    .from("engine_runs")
    .select("id, engine_version_id, task_type, status, cost_estimate, model_calls, research_depth, started_at, finished_at")
    .eq("project_id", id)
    .order("created_at");
  const rawRuns = (runsRaw ?? []) as Array<{
    id: string; engine_version_id: string; task_type: string; status: string; cost_estimate: number | null;
    model_calls: unknown; research_depth: number; started_at: string | null; finished_at: string | null;
  }>;

  // quality_self n'est pas une colonne : l'orchestrateur l'émet dans events.payload (engine_run.done).
  const { data: eventsRaw } = await c.from("events").select("id, type, actor, payload, created_at").eq("project_id", id).order("created_at", { ascending: false });
  const events = (eventsRaw ?? []) as Array<{ id: string; type: string; actor: string | null; payload: Record<string, unknown>; created_at: string }>;
  const qualityByRun = new Map<string, number>();
  for (const ev of events) {
    const runId = ev.payload?.engine_run_id as string | undefined;
    const q = ev.payload?.quality_self as number | undefined;
    if (runId && typeof q === "number" && !qualityByRun.has(runId)) qualityByRun.set(runId, q);
  }

  const { sumTokens, countModelCalls } = await import("./format");
  const runs: RunView[] = rawRuns.map((r) => {
    const engineId = versionToEngine.get(r.engine_version_id);
    return {
      id: r.id,
      engineCode: (engineId && engineById.get(engineId)) || "—",
      taskType: r.task_type,
      status: r.status,
      costEstimate: r.cost_estimate,
      tokens: sumTokens(r.model_calls),
      modelCalls: countModelCalls(r.model_calls),
      qualitySelf: qualityByRun.get(r.id) ?? null,
      researchDepth: r.research_depth,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
    };
  });

  // Livrables (résumé), journal
  const { data: delsRaw } = await c.from("deliverables").select("id, type, title, version, status, created_at").eq("project_id", id).order("created_at");
  const deliverables: DeliverableRow[] = ((delsRaw ?? []) as Array<{ id: string; type: string; title: string; version: number; status: string; created_at: string }>).map((d) => ({
    id: d.id, type: d.type, title: d.title, version: d.version, status: d.status, createdAt: d.created_at,
  }));

  const { data: jrRaw } = await c.from("project_journal").select("id, event_type, digest, actor, created_at").eq("project_id", id).order("created_at", { ascending: false });
  const journal: JournalView[] = ((jrRaw ?? []) as Array<{ id: string; event_type: string; digest: string; actor: string | null; created_at: string }>).map((j) => ({
    id: j.id, eventType: j.event_type, digest: j.digest, actor: j.actor, createdAt: j.created_at,
  }));

  return {
    id: p.id,
    name: p.name,
    ownerName,
    ownerUserId: p.owner_user_id,
    orgName,
    segment,
    ambition: p.ambition_profile,
    status: p.status,
    entryDoor: p.entry_door,
    accessLevel: p.access_level ?? null,
    currentPhase: deriveCurrentPhase(jalons),
    progression: { doneCount, seededCount, pct: seededCount ? Math.round((100 * doneCount) / seededCount) : 0 },
    jalons,
    gates,
    runs,
    deliverables,
    journal,
    events: events.map((e) => ({ id: e.id, type: e.type, actor: e.actor, payload: e.payload, createdAt: e.created_at })),
  };
}
