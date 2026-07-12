/**
 * Run ORCHESTRÉ RÉEL P0→P6 (JC-05) — SÉPARÉ des seeds/smokes.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/orchestrated-run.ts
 *
 * Crée un PROJET TEST distinct de la cohorte seedée et le fait progresser PAR
 * L'ORCHESTRATEUR : Router (sélection depuis le plan/état live) → Diffuser (invoque
 * l'engine réel via engine-sdk + ÉCRIT deliverables/engine_runs/project_milestones/
 * project_journal/events) → Gatekeeper runtime (verdicts live → gate_evaluations).
 * Les project_milestones et gate_evaluations sont PRODUITS PAR LES RUNS (pas seedés),
 * traçables via engine_runs/project_journal/events.
 *
 * Coût maîtrisé : task-set MINIMAL par engine (un livrable + états par phase) ; frontier
 * forcé sur Sonnet 5. E6 (proof_witness) non construit → jalons P3 marqués « différés »,
 * DAG non bloqué. Idempotent : le projet test est nettoyé puis reconstruit à chaque run.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope, FounderProfileContext } from "@ftg/engine-sdk";
import {
  P0_P6_PLAN,
  selectTier,
  selectNextStep,
  writeDeliverableRow,
  upsertMilestoneState,
  writeJournal,
  emitEvent,
  writeEngineRunRow,
  computeAndWriteGate,
  gateDefFromRow,
  type PhaseRunStep,
  type Vector,
} from "@ftg/orchestrator";
import { createServiceClientFromEnv, runFounderProfiler, writeFounderProfile } from "../packages/engine-founder-profiler/src/index.js";
import { runFounderProjectMatcher, readFounderProfile } from "../packages/engine-founder-project-matcher/src/index.js";
import { runIdeationFunnel } from "../packages/engine-ideation-funnel/src/index.js";
import { runMarketCartographer } from "../packages/engine-market-cartographer/src/index.js";
import { runCompetitiveWatch } from "../packages/engine-competitive-watch/src/index.js";
import { runLegalArchitect } from "../packages/engine-legal-architect/src/index.js";
import { runTaxEducator } from "../packages/engine-tax-educator/src/index.js";
import { runNameForge } from "../packages/engine-name-forge/src/index.js";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try { loader(path); return; } catch { /* fallback */ }
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2] ?? "";
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
  }
}

type Client = ReturnType<typeof createServiceClientFromEnv>;
const REF_VERSION = "9b4b44b6-e386-48e6-abe9-2c284a7c81e3";
const PROJECT_NAME = "ORCHESTRATION TEST — Café-atelier (JC-05)";
const SEG_ARTISAN = "af57c926-3d95-4c9c-b33d-673596818df5"; // S4 Artisanat / services techniques
const SEG_CODE = "S4";

const constraints = (min: number) => ({ quotas: {}, llmChannel: "pooled" as const, researchDepthMin: min, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] });
const ctx = (fp: FounderProfileContext) => ({ canonicalState: {}, dependencyDigests: [], founderProfile: fp, segmentProfile: { code: SEG_CODE, name: "Artisanat", config: {} }, geoLenses: ["france"], decisionsHistory: [] });

/** Résultat normalisé d'un engine pour la couche d'écriture. */
interface Produced { structuredData: Record<string, unknown>; sources: unknown; title: string; qualitySelf: number; researchDepth: number; modelCalls: unknown[]; taskType: string; }

const FORECAST = { ca_mensuel: new Array(12).fill(4000), charges_fixes_mensuelles: 800, charges_variables_pct: 0.3 };
const q = (e: EngineOutputEnvelope) => e.scores?.qualitySelf ?? 70;

/** Fabrique de « produce » par engine (task-set minimal réel). */
function makeProducers(client: Client, projectId: string) {
  return {
    founder_profiler: async (): Promise<Produced> => {
      const e = await runFounderProfiler({ runId: `orch-e1-${projectId}`, taskType: "incarnation_report", projectContext: ctx({}), structuredInput: { employment_status: "salarié en reconversion", objective_declared: "ouvrir un café-atelier de réparation vélo", engagement: { hours_week: 30, capital: 20000, horizon_months: 12 }, competencies: { metier: "mécanique vélo", experience_years: 5 }, resources: {}, constraints: {}, risk_appetite: "prudent", motivation_declared: "créer un lieu de proximité" }, constraints: constraints(0) } as EngineInputEnvelope);
      const sd = e.structuredData as Record<string, unknown>;
      await writeFounderProfile(client, projectId, { competencies: sd.competencies, resources: sd.resources, constraints: sd.constraints, risk_appetite: (sd.risk_appetite as string | null) ?? null, intrinsic_nature: sd.intrinsic_nature, mantra: (sd.mantra as string | null) ?? null, internal_objectives: sd.internal_objectives, builder_vs_opportunist_reading: (sd.builder_vs_opportunist_reading as string | null) ?? null, engagement: sd.engagement, validated_at: null });
      return { structuredData: sd, sources: e.sources, title: "Profil d'incarnation (E1 · Le Miroir)", qualitySelf: q(e), researchDepth: e.telemetry.researchDepthReached, modelCalls: e.telemetry.modelCalls, taskType: "incarnation_report" };
    },
    founder_project_matcher: async (): Promise<Produced> => {
      const fp = (await readFounderProfile(client, projectId)) as unknown as FounderProfileContext;
      const req = await runFounderProjectMatcher({ runId: `orch-e2-req-${projectId}`, taskType: "requirements_extraction", projectContext: ctx(fp), structuredInput: { project: { name: "Café-atelier vélo", description: "Café de quartier + atelier de réparation vélo participatif.", business_model: "restauration + prestation réparation", target: "habitants et cyclistes urbains" } }, constraints: constraints(0) } as EngineInputEnvelope);
      const requirements = (req.structuredData as { requirements?: unknown }).requirements ?? {};
      const sc = await runFounderProjectMatcher({ runId: `orch-e2-score-${projectId}`, taskType: "match_scoring", projectContext: ctx(fp), structuredInput: { requirements }, constraints: constraints(0) } as EngineInputEnvelope);
      const s = sc.structuredData as Record<string, unknown>;
      return { structuredData: { ...s, requirements, contentMd: sc.deliverable.contentMd }, sources: [...sc.sources, ...req.sources], title: "Rapport de matching V3 (E2 · La Boussole)", qualitySelf: q(sc), researchDepth: 0, modelCalls: [...sc.telemetry.modelCalls, ...req.telemetry.modelCalls], taskType: "match_scoring" };
    },
    ideation_funnel: async (): Promise<Produced> => {
      const fp = (await readFounderProfile(client, projectId)) as unknown as FounderProfileContext;
      const gen = await runIdeationFunnel({ runId: `orch-e3-gen-${projectId}`, taskType: "idea_generation", projectContext: ctx(fp), structuredInput: { opportunities: "mobilité douce et lieux de proximité en ville", geo: "France" }, constraints: constraints(1) } as EngineInputEnvelope);
      const ideaCards = (gen.structuredData as { idea_cards?: unknown[] }).idea_cards ?? [];
      const sel = await runIdeationFunnel({ runId: `orch-e3-sel-${projectId}`, taskType: "selection_brief", projectContext: ctx(fp), structuredInput: { scored_ideas: ideaCards, funnel_journal: [] }, constraints: constraints(1) } as EngineInputEnvelope);
      const sd = sel.structuredData as Record<string, unknown>;
      return { structuredData: { idea_cards: ideaCards, ...sd, contentMd: sel.deliverable.contentMd }, sources: [...gen.sources, ...sel.sources], title: "Lettre de décision — sélection (E3 · La Forge)", qualitySelf: q(sel), researchDepth: 1, modelCalls: [...gen.telemetry.modelCalls, ...sel.telemetry.modelCalls], taskType: "selection_brief" };
    },
    market_cartographer: async (): Promise<Produced> => {
      const scopeEnv = await runMarketCartographer({ runId: `orch-e4-scope-${projectId}`, taskType: "scope_definition", projectContext: ctx({}), structuredInput: { segment: "Artisanat / services techniques", idee: "café-atelier de réparation vélo" }, constraints: constraints(1) } as EngineInputEnvelope);
      const scope = (scopeEnv.structuredData as { scope: unknown }).scope;
      const sizeEnv = await runMarketCartographer({ runId: `orch-e4-size-${projectId}`, taskType: "market_sizing", projectContext: ctx({}), structuredInput: { scope, segment: "Artisanat" }, constraints: constraints(1) } as EngineInputEnvelope);
      const sizing = (sizeEnv.structuredData as { sizing: unknown }).sizing;
      const repEnv = await runMarketCartographer({ runId: `orch-e4-rep-${projectId}`, taskType: "full_report_assembly", projectContext: ctx({}), structuredInput: { scope, sizing }, constraints: constraints(1) } as EngineInputEnvelope);
      return { structuredData: { scope, sizing, attractiveness_verdict: (repEnv.structuredData as { attractiveness_verdict: unknown }).attractiveness_verdict, challenge: repEnv.challenge ?? null }, sources: [...scopeEnv.sources, ...sizeEnv.sources, ...repEnv.sources], title: "Étude de marché (E4 · Le Cartographe)", qualitySelf: q(repEnv), researchDepth: Math.max(sizeEnv.telemetry.researchDepthReached, repEnv.telemetry.researchDepthReached), modelCalls: [...scopeEnv.telemetry.modelCalls, ...sizeEnv.telemetry.modelCalls, ...repEnv.telemetry.modelCalls], taskType: "full_report_assembly" };
    },
    competitive_watch: async (): Promise<Produced> => {
      const e = await runCompetitiveWatch({ runId: `orch-e5-map-${projectId}`, taskType: "competitor_mapping", projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: "Artisanat", config: {} }, geoLenses: ["france"], decisionsHistory: [] }, structuredInput: { segment: "Artisanat / services techniques", idee: "atelier de réparation vélo" }, constraints: constraints(1) } as EngineInputEnvelope);
      return { structuredData: e.structuredData as Record<string, unknown>, sources: e.sources, title: "Cartographie concurrentielle (E5 · La Vigie)", qualitySelf: q(e), researchDepth: e.telemetry.researchDepthReached, modelCalls: e.telemetry.modelCalls, taskType: "competitor_mapping" };
    },
    legal_architect: async (): Promise<Produced> => {
      const e = await runLegalArchitect({ runId: `orch-e7-cmp-${projectId}`, taskType: "status_comparator", projectContext: ctx({}), structuredInput: { forecast_input: FORECAST, activity_type: "services_bic" }, constraints: constraints(1) } as EngineInputEnvelope);
      return { structuredData: e.structuredData as Record<string, unknown>, sources: e.sources, title: "Structure juridique (E7 · L'Architecte)", qualitySelf: q(e), researchDepth: e.telemetry.researchDepthReached, modelCalls: e.telemetry.modelCalls, taskType: "status_comparator" };
    },
    tax_educator: async (): Promise<Produced> => {
      const e = await runTaxEducator({ runId: `orch-e8-sim-${projectId}`, taskType: "tax_simulation", projectContext: ctx({}), structuredInput: { ca_annuel: 48000, activity_type: "services_bic" }, constraints: constraints(1) } as EngineInputEnvelope);
      return { structuredData: e.structuredData as Record<string, unknown>, sources: e.sources, title: "Fiscalité & imposition (E8 · Le Fiscaliste)", qualitySelf: q(e), researchDepth: e.telemetry.researchDepthReached, modelCalls: e.telemetry.modelCalls, taskType: "tax_simulation" };
    },
    name_forge: async (): Promise<Produced> => {
      const e = await runNameForge({ runId: `orch-e9-avail-${projectId}`, taskType: "availability_check", projectContext: ctx({}), structuredInput: { candidates: ["Le Rayon", "Vélocafé"], tlds: ["com", "fr"] }, constraints: constraints(1) } as EngineInputEnvelope);
      return { structuredData: e.structuredData as Record<string, unknown>, sources: e.sources, title: "Naming — disponibilité (E9 · L'Éponyme)", qualitySelf: q(e), researchDepth: e.telemetry.researchDepthReached, modelCalls: e.telemetry.modelCalls, taskType: "availability_check" };
    },
  } as Record<string, () => Promise<Produced>>;
}

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ RUN ORCHESTRÉ P0→P6 (JC-05) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"}`);
  const client = createServiceClientFromEnv();

  // Référentiel : jalons par phase, gates, engines (version + model_routing).
  const { data: msRows } = await client.from("milestones").select("id, code, phases!inner(code)");
  const milestonesByPhase: Record<string, Array<{ id: string; code: string }>> = {};
  for (const m of (msRows ?? []) as Array<{ id: string; code: string; phases: { code: string } }>) {
    (milestonesByPhase[m.phases.code] ??= []).push({ id: m.id, code: m.code });
  }
  const { data: gateRows } = await client.from("gates").select("id, code, weights, threshold, critical_floors, verdict_policy");
  const gateByCode: Record<string, { id: string; row: Parameters<typeof gateDefFromRow>[0] }> = {};
  for (const g of (gateRows ?? []) as Array<{ id: string; code: string; weights: never; threshold: never; critical_floors: never; verdict_policy: never }>) gateByCode[g.code] = { id: g.id, row: g };
  const { data: engRows } = await client.from("engines").select("code, current_version_id, model_routing");
  const engineMeta: Record<string, { versionId: string | null; modelRouting: Record<string, unknown> | null }> = {};
  for (const e of (engRows ?? []) as Array<{ code: string; current_version_id: string | null; model_routing: never }>) engineMeta[e.code] = { versionId: e.current_version_id, modelRouting: e.model_routing };

  // Projet test (idempotent : nettoyage complet puis recréation).
  const { data: prev } = await client.from("projects").select("id, owner_user_id").eq("name", PROJECT_NAME).maybeSingle();
  if (prev) {
    for (const t of ["events", "gate_evaluations", "project_milestones", "deliverables", "engine_runs", "project_journal", "founder_profiles"]) await client.from(t as never).delete().eq("project_id", prev.id);
    await client.from("projects").delete().eq("id", prev.id);
    if (prev.owner_user_id) await client.from("users").delete().eq("id", prev.owner_user_id as string);
    console.log("• projet test antérieur nettoyé (rejeu idempotent).");
  }
  const u = await client.from("users").insert({ profile: { name: "Test JC-05", email: "jc05@ftg.test" } }).select("id").single();
  if (u.error || !u.data) throw new Error(`user: ${u.error?.message}`);
  const proj = await client.from("projects").insert({ owner_user_id: u.data.id, entry_door: "A", name: PROJECT_NAME, status: "active", ambition_profile: "independance", segment_primary_id: SEG_ARTISAN, ref_version_id: REF_VERSION }).select("id").single();
  if (proj.error || !proj.data) throw new Error(`project: ${proj.error?.message}`);
  const projectId = proj.data.id as string;
  console.log(`• projet test créé : ${projectId}\n`);

  const producers = makeProducers(client, projectId);
  const completed = new Set<number>();
  const phaseQualities: Record<string, number[]> = {};
  const trace: string[] = [];

  let step: PhaseRunStep | null;
  while ((step = selectNextStep(P0_P6_PLAN, completed)) !== null) {
    const meta = engineMeta[step.engineCode];
    const tier = selectTier(meta?.modelRouting, "dominant");

    if (step.deferred || !meta?.versionId) {
      // E6 non construit → jalons de la phase marqués « différés », DAG non bloqué.
      for (const m of milestonesByPhase[step.phaseCode] ?? []) {
        await upsertMilestoneState(client, { projectId, milestoneId: m.id, state: "available", forcedReason: "engine E6 (proof_witness) non construit — jalon différé" });
      }
      await writeJournal(client, projectId, "alert", `${step.phaseCode} — engine ${step.engineCode} DIFFÉRÉ (non construit). Jalons en attente, DAG non bloqué.`, "orchestrator:router");
      await emitEvent(client, { projectId, type: "phase.deferred", payload: { phase: step.phaseCode, engine: step.engineCode }, actor: "orchestrator:router" });
      trace.push(`${step.phaseCode}:${step.engineCode}=DIFFÉRÉ`);
      completed.add(step.order);
      console.log(`⏭️  ${step.phaseCode} · ${step.engineCode} DIFFÉRÉ (E6 non construit) — jalons en attente.`);
      continue;
    }

    // Router → Diffuser : invoque l'engine réel + écrit.
    console.log(`▶️  ${step.phaseCode} · ${step.engineCode} (tier=${tier})…`);
    const startedAt = new Date().toISOString();
    const out = await producers[step.engineCode]!();
    const run = await writeEngineRunRow(client, { projectId, engineVersionId: meta.versionId, taskType: out.taskType, inputEnvelope: { phase: step.phaseCode, engine: step.engineCode } as unknown, inputStructuredValidated: true, researchDepth: out.researchDepth, modelCalls: out.modelCalls, llmChannel: "pooled", status: "done", startedAt, finishedAt: new Date().toISOString() });
    const deliverable = await writeDeliverableRow(client, { projectId, engineRunId: run.id, type: step.deliverableType, title: out.title, structuredData: out.structuredData, sources: out.sources });
    await writeJournal(client, projectId, "deliverable", `${step.engineCode} — ${out.title} (v${(deliverable as { version: number }).version}, qualité ${out.qualitySelf})`, `engine:${step.engineCode}`);
    await emitEvent(client, { projectId, type: "engine_run.done", payload: { phase: step.phaseCode, engine: step.engineCode, deliverable_id: deliverable.id, engine_run_id: run.id, quality_self: out.qualitySelf, model_calls: out.modelCalls.length }, actor: "orchestrator:diffuser" });
    (phaseQualities[step.phaseCode] ??= []).push(out.qualitySelf);
    console.log(`   ✓ livrable ${step.deliverableType} v${(deliverable as { version: number }).version} · engine_run ${run.id} · qualité ${out.qualitySelf}`);
    trace.push(`${step.phaseCode}:${step.engineCode}=${step.deliverableType}v${(deliverable as { version: number }).version}`);

    // Frontière de phase → clôture des jalons + Gatekeeper runtime.
    if (step.gateCode) {
      const phaseQ = phaseQualities[step.phaseCode] ?? [out.qualitySelf];
      const avgQ = Math.round(phaseQ.reduce((a, b) => a + b, 0) / phaseQ.length);
      for (const m of milestonesByPhase[step.phaseCode] ?? []) {
        await upsertMilestoneState(client, { projectId, milestoneId: m.id, state: "done", qualityScore: avgQ });
        await emitEvent(client, { projectId, type: "milestone.state_changed", payload: { milestone: m.code, state: "done", quality: avgQ }, actor: "orchestrator:diffuser" });
      }
      const g = gateByCode[step.gateCode];
      if (g) {
        const gate = gateDefFromRow(g.row);
        // Vecteurs dérivés des quality_self RÉELS des runs de la phase (V1 : moyenne de phase
        // reportée sur les vecteurs pondérés/planchers du gate). Pas de vecteur seedé arbitraire.
        const vectorScores: Partial<Record<Vector, number>> = {};
        for (const v of Object.keys(gate.weights) as Vector[]) vectorScores[v] = avgQ;
        for (const v of Object.keys(gate.criticalFloors) as Vector[]) vectorScores[v] = avgQ;
        const gr = await computeAndWriteGate(client, { gate, gateId: g.id, projectId, vectorScores, projectMilestonesInScope: [], solutionPathsAvailable: true, solutionPaths: [], engineVersionRefs: [meta.versionId], fact: { kind: "runtime_note", detail: `Vecteurs dérivés des quality_self réels de la phase ${step.phaseCode} (moyenne ${avgQ}). Verdict par le Gatekeeper pur.` } });
        await writeJournal(client, projectId, "gate", `${step.gateCode} — verdict ${(gr as { verdict: string }).verdict} (composite dérivé de la phase ${step.phaseCode})`, "orchestrator:gatekeeper");
        await emitEvent(client, { projectId, type: "gate.evaluated", payload: { gate: step.gateCode, verdict: (gr as { verdict: string }).verdict }, actor: "orchestrator:gatekeeper" });
        console.log(`   🚦 ${step.gateCode} → ${(gr as { verdict: string }).verdict}`);
        trace.push(`${step.gateCode}=${(gr as { verdict: string }).verdict}`);
      }
    }
    completed.add(step.order);
  }

  // Récap live
  const { count: msCount } = await client.from("project_milestones").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const { count: geCount } = await client.from("gate_evaluations").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const { count: dlCount } = await client.from("deliverables").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const { count: runCount } = await client.from("engine_runs").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  const { count: evCount } = await client.from("events").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  console.log("\n──────── RÉCAP LIVE (produit par les runs) ────────");
  console.log(`projet ${projectId}`);
  console.log(`deliverables=${dlCount} · engine_runs=${runCount} · project_milestones=${msCount} · gate_evaluations=${geCount} · events=${evCount}`);
  console.log(`trace: ${trace.join("  ›  ")}`);
  console.log("\n✅ Run orchestré P0→P6 terminé (E6 différé).");
}

main().catch((err) => { console.error("\n❌ Run orchestré échoué:", err); process.exit(1); });
