import "server-only";
import { getServiceClient, DEMO_ORG_NAME } from "./supabase";

export const PHASE_ORDER = ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];

function phaseOf(code: string): string {
  return code.split("-")[0] ?? "P0";
}
function count(vals: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of vals) out[v] = (out[v] ?? 0) + 1;
  return out;
}
function maxPhase(codes: string[]): string {
  let best = "P0";
  for (const p of codes) if (PHASE_ORDER.indexOf(p) > PHASE_ORDER.indexOf(best)) best = p;
  return best;
}

interface Pm {
  state: string;
  code: string;
  quality: number | null;
}

function deriveCurrentPhase(pms: Pm[]): string {
  const inProg = pms.filter((m) => ["in_progress", "awaiting_proof", "awaiting_review"].includes(m.state));
  if (inProg.length) return maxPhase(inProg.map((m) => phaseOf(m.code)));
  const done = pms.filter((m) => ["done", "forced"].includes(m.state));
  if (done.length) return maxPhase(done.map((m) => phaseOf(m.code)));
  return "P0";
}

// latest verdict = gate le plus avancé (code décroissant), à défaut le plus récent.
function pickLatestVerdict(evals: GateEval[]): string | null {
  if (evals.length === 0) return null;
  const sorted = [...evals].sort((a, b) =>
    a.gateCode < b.gateCode ? 1 : a.gateCode > b.gateCode ? -1 : a.evaluatedAt < b.evaluatedAt ? 1 : -1,
  );
  return sorted[0]?.verdict ?? null;
}

// ── Cohorte ──────────────────────────────────────────────────────────────────

export interface CohortRow {
  id: string;
  name: string;
  ownerName: string;
  entryDoor: string;
  ambition: string | null;
  segment: string | null;
  status: string;
  currentPhase: string;
  verdict: string | null;
  v3: number | null;
  nDeliverables: number;
  watch: boolean;
  watchReasons: string[];
}
export interface CohortData {
  orgId: string | null;
  orgName: string;
  rows: CohortRow[];
  kpis: { total: number; byPhase: Record<string, number>; byVerdict: Record<string, number>; watch: number };
}

interface GateEval {
  gateCode: string;
  verdict: string;
  evaluatedAt: string;
}

const EMPTY_COHORT = (orgId: string | null): CohortData => ({
  orgId,
  orgName: DEMO_ORG_NAME,
  rows: [],
  kpis: { total: 0, byPhase: {}, byVerdict: {}, watch: 0 },
});

async function idNameMap(
  c: ReturnType<typeof getServiceClient>,
  table: "segments" | "gates" | "milestones",
  col: "name" | "code",
  ids: string[],
): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  if (ids.length === 0) return m;
  const { data } = await c.from(table).select(`id, ${col}`).in("id", ids);
  for (const r of (data ?? []) as Array<Record<string, string>>) m.set(r.id, r[col] ?? "");
  return m;
}

export async function getCohort(): Promise<CohortData> {
  const c = getServiceClient();
  const { data: org } = await c.from("organizations").select("id").eq("name", DEMO_ORG_NAME).maybeSingle();
  const orgId = (org as { id: string } | null)?.id ?? null;
  if (!orgId) return EMPTY_COHORT(null);

  const { data: projectsRaw } = await c
    .from("projects")
    .select("id, name, entry_door, ambition_profile, status, owner_user_id, segment_primary_id")
    .eq("org_id", orgId)
    .order("created_at");
  const projects = (projectsRaw ?? []) as Array<{
    id: string; name: string; entry_door: string; ambition_profile: string | null;
    status: string; owner_user_id: string; segment_primary_id: string | null;
  }>;
  if (projects.length === 0) return EMPTY_COHORT(orgId);
  const ids = projects.map((p) => p.id);

  const { data: usersRaw } = await c.from("users").select("id, profile").in("id", projects.map((p) => p.owner_user_id));
  const ownerName = new Map<string, string>();
  for (const u of (usersRaw ?? []) as Array<{ id: string; profile: { name?: string } | null }>) {
    ownerName.set(u.id, u.profile?.name ?? "—");
  }
  const segName = await idNameMap(c, "segments", "name", projects.map((p) => p.segment_primary_id).filter((x): x is string => !!x));

  const { data: gesRaw } = await c.from("gate_evaluations").select("project_id, verdict, evaluated_at, gate_id").in("project_id", ids);
  const ges = (gesRaw ?? []) as Array<{ project_id: string; verdict: string; evaluated_at: string; gate_id: string }>;
  const gateCode = await idNameMap(c, "gates", "code", ges.map((g) => g.gate_id));

  const { data: delsRaw } = await c.from("deliverables").select("project_id, type, structured_data").in("project_id", ids);
  const dels = (delsRaw ?? []) as Array<{ project_id: string; type: string; structured_data: { composite_v3?: number } | null }>;

  const { data: pmsRaw } = await c.from("project_milestones").select("project_id, state, milestone_id, quality_score").in("project_id", ids);
  const pms = (pmsRaw ?? []) as Array<{ project_id: string; state: string; milestone_id: string; quality_score: number | null }>;
  const msCode = await idNameMap(c, "milestones", "code", pms.map((m) => m.milestone_id));

  const rows: CohortRow[] = projects.map((p) => {
    const gl = ges.filter((g) => g.project_id === p.id).map((g) => ({ gateCode: gateCode.get(g.gate_id) ?? "", verdict: g.verdict, evaluatedAt: g.evaluated_at }));
    const verdict = pickLatestVerdict(gl);
    const myDels = dels.filter((d) => d.project_id === p.id);
    const match = myDels.find((d) => d.type === "match_report");
    const v3raw = match ? Number(match.structured_data?.composite_v3 ?? NaN) : NaN;
    const v3 = Number.isFinite(v3raw) ? v3raw : null;
    const myPms: Pm[] = pms.filter((m) => m.project_id === p.id).map((m) => ({ state: m.state, code: msCode.get(m.milestone_id) ?? "", quality: m.quality_score }));
    const watchReasons: string[] = [];
    if (verdict === "conditions_not_met" || verdict === "facts_and_options") watchReasons.push("dernier gate à surveiller");
    if (v3 !== null && v3 < 40) watchReasons.push(`V3 bas (${v3})`);
    if (p.status === "paused") watchReasons.push("projet en pause");
    return {
      id: p.id, name: p.name, ownerName: ownerName.get(p.owner_user_id) ?? "—",
      entryDoor: p.entry_door, ambition: p.ambition_profile, segment: p.segment_primary_id ? segName.get(p.segment_primary_id) ?? null : null,
      status: p.status, currentPhase: deriveCurrentPhase(myPms), verdict, v3, nDeliverables: myDels.length,
      watch: watchReasons.length > 0, watchReasons,
    };
  });

  return {
    orgId, orgName: DEMO_ORG_NAME, rows,
    kpis: { total: rows.length, byPhase: count(rows.map((r) => r.currentPhase)), byVerdict: count(rows.map((r) => r.verdict ?? "—")), watch: rows.filter((r) => r.watch).length },
  };
}

// ── Fiche projet ─────────────────────────────────────────────────────────────

export interface PhaseStep {
  code: string;
  name: string;
  state: "done" | "in_progress" | "available" | "locked";
  reason?: string;
}
export interface GateView {
  code: string;
  verdict: string;
  computedScores: Record<string, number>;
  facts: Array<Record<string, unknown>>;
  solutionPaths: Array<{ title?: string; description?: string; actions?: string[] }>;
}
export interface DeliverableView {
  id: string;
  type: string;
  title: string;
  version: number;
  status: string;
  createdAt: string;
  data: Record<string, unknown>;
}
export interface ProjectView {
  id: string;
  name: string;
  ownerName: string;
  segment: string | null;
  ambition: string | null;
  status: string;
  entryDoor: string;
  phases: PhaseStep[];
  jalons: Array<{ code: string; phase: string; state: string; quality: number | null }>;
  gates: GateView[];
  deliverables: DeliverableView[];
}

function phaseState(states: string[]): PhaseStep["state"] {
  if (states.length === 0) return "locked";
  if (states.every((s) => s === "done" || s === "forced")) return "done";
  if (states.some((s) => ["in_progress", "awaiting_proof", "awaiting_review"].includes(s))) return "in_progress";
  if (states.some((s) => ["available", "recommended"].includes(s))) return "available";
  return "locked";
}

export async function getProject(id: string): Promise<ProjectView | null> {
  const c = getServiceClient();
  const { data: pRaw } = await c
    .from("projects")
    .select("id, name, entry_door, ambition_profile, status, owner_user_id, segment_primary_id")
    .eq("id", id)
    .maybeSingle();
  const p = pRaw as {
    id: string; name: string; entry_door: string; ambition_profile: string | null;
    status: string; owner_user_id: string; segment_primary_id: string | null;
  } | null;
  if (!p) return null;

  const { data: uRaw } = await c.from("users").select("profile").eq("id", p.owner_user_id).maybeSingle();
  const ownerName = (uRaw as { profile: { name?: string } | null } | null)?.profile?.name ?? "—";
  const segName = p.segment_primary_id ? (await idNameMap(c, "segments", "name", [p.segment_primary_id])).get(p.segment_primary_id) ?? null : null;

  // Référentiel des phases (P0→P9)
  const { data: phasesRaw } = await c.from("phases").select("code, name, order_hint, ref_version_id");
  const phases = ((phasesRaw ?? []) as Array<{ code: string; name: string; order_hint: number }>)
    .filter((ph, i, arr) => arr.findIndex((x) => x.code === ph.code) === i)
    .sort((a, b) => a.order_hint - b.order_hint);

  // Jalons du projet
  const { data: pmsRaw } = await c.from("project_milestones").select("state, milestone_id, quality_score").eq("project_id", id);
  const pms = (pmsRaw ?? []) as Array<{ state: string; milestone_id: string; quality_score: number | null }>;
  const msCode = await idNameMap(c, "milestones", "code", pms.map((m) => m.milestone_id));
  const jalons = pms
    .map((m) => ({ code: msCode.get(m.milestone_id) ?? "", phase: phaseOf(msCode.get(m.milestone_id) ?? "P0"), state: m.state, quality: m.quality_score }))
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  const steps: PhaseStep[] = phases.map((ph) => {
    const states = jalons.filter((j) => j.phase === ph.code).map((j) => j.state);
    const state = phaseState(states);
    return {
      code: ph.code,
      name: ph.name,
      state,
      reason: state === "locked" ? (states.length === 0 ? "Phase non démarrée (en attente du gate précédent)." : "Jalons verrouillés en amont.") : undefined,
    };
  });

  // Gates
  const { data: gesRaw } = await c.from("gate_evaluations").select("gate_id, verdict, computed_scores, facts, solution_paths").eq("project_id", id);
  const ges = (gesRaw ?? []) as Array<{ gate_id: string; verdict: string; computed_scores: Record<string, number> | null; facts: unknown; solution_paths: unknown }>;
  const gateCode = await idNameMap(c, "gates", "code", ges.map((g) => g.gate_id));
  const gates: GateView[] = ges
    .map((g) => ({
      code: gateCode.get(g.gate_id) ?? "",
      verdict: g.verdict,
      computedScores: (g.computed_scores ?? {}) as Record<string, number>,
      facts: Array.isArray(g.facts) ? (g.facts as Array<Record<string, unknown>>) : [],
      solutionPaths: Array.isArray(g.solution_paths) ? (g.solution_paths as GateView["solutionPaths"]) : [],
    }))
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  // Livrables
  const { data: delsRaw } = await c
    .from("deliverables")
    .select("id, type, title, version, status, created_at, structured_data")
    .eq("project_id", id)
    .order("created_at");
  const deliverables: DeliverableView[] = ((delsRaw ?? []) as Array<{
    id: string; type: string; title: string; version: number; status: string; created_at: string; structured_data: Record<string, unknown> | null;
  }>).map((d) => ({
    id: d.id, type: d.type, title: d.title, version: d.version, status: d.status, createdAt: d.created_at, data: d.structured_data ?? {},
  }));

  return {
    id: p.id, name: p.name, ownerName, segment: segName, ambition: p.ambition_profile, status: p.status, entryDoor: p.entry_door,
    phases: steps, jalons, gates, deliverables,
  };
}
