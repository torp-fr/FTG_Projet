import "server-only";
import { getServiceClient, DEFAULT_PROJECT_NAME } from "./supabase";

const PHASE_ORDER = ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
const phaseOf = (code: string) => code.split("-")[0] ?? "P0";
const orderOf = (ph: string) => PHASE_ORDER.indexOf(ph);
const maxPhase = (codes: string[]) => codes.reduce((best, p) => (orderOf(p) > orderOf(best) ? p : best), "P0");

async function idMap(
  c: ReturnType<typeof getServiceClient>,
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

export async function getDefaultProjectId(): Promise<string | null> {
  const c = getServiceClient();
  const { data } = await c.from("projects").select("id").eq("name", DEFAULT_PROJECT_NAME).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// ── Types de vue ─────────────────────────────────────────────────────────────

export interface JalonNode {
  code: string;
  state: string;
  quality: number | null;
  recommended: boolean;
  reason?: string;
}
export interface PhaseNode {
  code: string;
  name: string;
  state: "done" | "in_progress" | "available" | "locked";
  reason?: string;
  jalons: JalonNode[];
}
export interface GateView {
  code: string;
  verdict: string;
  computedScores: Record<string, number>;
  solutionPaths: Array<{ title?: string; description?: string; actions?: string[] }>;
  reserves: Array<{ vector?: string; detail?: string }>;
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
export interface AgentOutput {
  label: string;
  type: string;
  deliverableId: string | null;
}
export interface AgentView {
  persona: string;
  code: string;
  latestRunStatus: string | null;
  runsCount: number;
  outputs: AgentOutput[];
}
export interface PorteurDashboard {
  project: { id: string; name: string; ownerName: string; segment: string | null; ambition: string | null; status: string; entryDoor: string };
  mantra: string | null;
  progression: { doneCount: number; seededCount: number; pct: number; currentPhase: string; currentPhaseName: string };
  phases: PhaseNode[];
  gates: GateView[];
  deliverables: DeliverableView[];
  agents: AgentView[];
}

function phaseState(states: string[]): PhaseNode["state"] {
  if (states.length === 0) return "locked";
  if (states.every((s) => s === "done" || s === "forced")) return "done";
  if (states.some((s) => ["in_progress", "awaiting_proof", "awaiting_review"].includes(s))) return "in_progress";
  if (states.some((s) => ["available", "recommended"].includes(s))) return "available";
  return "locked";
}

export async function getPorteurDashboard(projectId: string): Promise<PorteurDashboard | null> {
  const c = getServiceClient();

  const { data: pRaw } = await c
    .from("projects")
    .select("id, name, entry_door, ambition_profile, status, owner_user_id, segment_primary_id")
    .eq("id", projectId)
    .maybeSingle();
  const p = pRaw as {
    id: string; name: string; entry_door: string; ambition_profile: string | null;
    status: string; owner_user_id: string; segment_primary_id: string | null;
  } | null;
  if (!p) return null;

  const { data: uRaw } = await c.from("users").select("profile").eq("id", p.owner_user_id).maybeSingle();
  const ownerName = (uRaw as { profile: { name?: string } | null } | null)?.profile?.name ?? "—";
  const segName = p.segment_primary_id ? (await idMap(c, "segments", "name", [p.segment_primary_id])).get(p.segment_primary_id) ?? null : null;

  const { data: fpRaw } = await c.from("founder_profiles").select("mantra").eq("project_id", projectId).maybeSingle();
  const mantra = (fpRaw as { mantra: string | null } | null)?.mantra ?? null;

  // Référentiel des 10 phases
  const { data: phasesRaw } = await c.from("phases").select("code, name, order_hint");
  const phasesRef = ((phasesRaw ?? []) as Array<{ code: string; name: string; order_hint: number }>)
    .filter((ph, i, arr) => arr.findIndex((x) => x.code === ph.code) === i)
    .sort((a, b) => a.order_hint - b.order_hint);

  // Jalons du projet
  const { data: pmsRaw } = await c.from("project_milestones").select("state, milestone_id, quality_score").eq("project_id", projectId);
  const pms = (pmsRaw ?? []) as Array<{ state: string; milestone_id: string; quality_score: number | null }>;
  const msCode = await idMap(c, "milestones", "code", pms.map((m) => m.milestone_id));
  const jalons = pms
    .map((m) => ({ code: msCode.get(m.milestone_id) ?? "", state: m.state, quality: m.quality_score }))
    .filter((j) => j.code)
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  const phases: PhaseNode[] = phasesRef.map((ph) => {
    const js = jalons.filter((j) => phaseOf(j.code) === ph.code);
    const state = phaseState(js.map((j) => j.state));
    return {
      code: ph.code,
      name: ph.name,
      state,
      reason: state === "locked" ? (js.length === 0 ? "À venir — se débloque après le gate de la phase précédente." : "Jalons verrouillés en amont.") : undefined,
      jalons: js.map((j) => ({
        code: j.code,
        state: j.state,
        quality: j.quality,
        recommended: j.state === "recommended",
        reason: j.state === "locked" ? "Se débloque une fois les jalons/gate précédents validés." : undefined,
      })),
    };
  });

  const doneCount = jalons.filter((j) => j.state === "done" || j.state === "forced").length;
  const seededCount = jalons.length;
  const inProg = jalons.filter((j) => ["in_progress", "awaiting_proof", "awaiting_review"].includes(j.state));
  const currentPhase = inProg.length
    ? maxPhase(inProg.map((j) => phaseOf(j.code)))
    : jalons.some((j) => j.state === "done" || j.state === "forced")
      ? maxPhase(jalons.filter((j) => j.state === "done" || j.state === "forced").map((j) => phaseOf(j.code)))
      : "P0";
  const currentPhaseName = phasesRef.find((ph) => ph.code === currentPhase)?.name ?? "";

  // Gates
  const { data: gesRaw } = await c.from("gate_evaluations").select("gate_id, verdict, computed_scores, facts, solution_paths").eq("project_id", projectId);
  const ges = (gesRaw ?? []) as Array<{ gate_id: string; verdict: string; computed_scores: Record<string, number> | null; facts: unknown; solution_paths: unknown }>;
  const gateCode = await idMap(c, "gates", "code", ges.map((g) => g.gate_id));
  const gates: GateView[] = ges
    .map((g) => {
      const facts = Array.isArray(g.facts) ? (g.facts as Array<Record<string, unknown>>) : [];
      return {
        code: gateCode.get(g.gate_id) ?? "",
        verdict: g.verdict,
        computedScores: (g.computed_scores ?? {}) as Record<string, number>,
        solutionPaths: Array.isArray(g.solution_paths) ? (g.solution_paths as GateView["solutionPaths"]) : [],
        reserves: facts.filter((f) => f.kind === "reserve").map((f) => ({ vector: f.vector as string | undefined, detail: f.detail as string | undefined })),
      };
    })
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  // Livrables
  const { data: delsRaw } = await c
    .from("deliverables")
    .select("id, type, title, version, status, created_at, engine_run_id, structured_data")
    .eq("project_id", projectId)
    .order("created_at");
  const dels = (delsRaw ?? []) as Array<{
    id: string; type: string; title: string; version: number; status: string; created_at: string; engine_run_id: string | null; structured_data: Record<string, unknown> | null;
  }>;
  const deliverables: DeliverableView[] = dels.map((d) => ({
    id: d.id, type: d.type, title: d.title, version: d.version, status: d.status, createdAt: d.created_at, data: d.structured_data ?? {},
  }));

  // Board des agents : engines actifs → leurs runs/livrables pour ce projet
  const { data: enginesRaw } = await c.from("engines").select("id, code, name, status").eq("status", "active");
  const engines = ((enginesRaw ?? []) as Array<{ id: string; code: string; name: string }>).sort((a, b) => (a.code < b.code ? -1 : 1));
  const { data: evRaw } = await c.from("engine_versions").select("id, engine_id");
  const versionToEngine = new Map<string, string>();
  for (const v of (evRaw ?? []) as Array<{ id: string; engine_id: string }>) versionToEngine.set(v.id, v.engine_id);
  const { data: erRaw } = await c.from("engine_runs").select("id, engine_version_id, status, finished_at").eq("project_id", projectId);
  const runs = (erRaw ?? []) as Array<{ id: string; engine_version_id: string; status: string; finished_at: string | null }>;

  const agents: AgentView[] = engines.map((e) => {
    const persona = e.name.match(/\(([^)]+)\)/)?.[1] ?? e.name;
    const myRuns = runs.filter((r) => versionToEngine.get(r.engine_version_id) === e.id);
    const myRunIds = new Set(myRuns.map((r) => r.id));
    const outputs: AgentOutput[] = dels
      .filter((d) => d.engine_run_id && myRunIds.has(d.engine_run_id))
      .map((d) => ({ label: d.title, type: d.type, deliverableId: d.id }));
    if (e.code === "founder_profiler" && mantra !== null) {
      outputs.unshift({ label: "Profil d’incarnation", type: "founder_profile", deliverableId: null });
    }
    const latest = [...myRuns].sort((a, b) => ((a.finished_at ?? "") < (b.finished_at ?? "") ? 1 : -1))[0];
    return { persona, code: e.code, latestRunStatus: latest?.status ?? null, runsCount: myRuns.length, outputs };
  });

  return {
    project: { id: p.id, name: p.name, ownerName, segment: segName, ambition: p.ambition_profile, status: p.status, entryDoor: p.entry_door },
    mantra,
    progression: { doneCount, seededCount, pct: seededCount ? Math.round((100 * doneCount) / seededCount) : 0, currentPhase, currentPhaseName },
    phases,
    gates,
    deliverables,
    agents,
  };
}
