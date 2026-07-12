/**
 * Seed d'une cohorte de DÉMONSTRATION pour le Cockpit B2B (Chantier 6 §C2).
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/seed-demo-cohort.ts
 *
 * ⚠️ DONNÉE DE DÉMO honnête, PAS de l'activité utilisateur réelle :
 *  - Les livrables (founder_profile, match_report, selection_brief) sont produits
 *    GÉNUINEMENT par les engines réels E1/E2/E3 (mêmes runners que les smoke scripts)
 *    et atterrissent dans deliverables/engine_runs comme en production.
 *  - Les project_milestones sont un ÉTAT DE PROGRESSION seedé à la main (le branchement
 *    orchestrateur→écriture réelle des jalons viendra plus tard).
 *  - Les gate_evaluations sont calculées par le VRAI Gatekeeper (@ftg/orchestrator
 *    evaluateGate) à partir de vecteurs de démonstration seedés — aucun verdict arbitraire.
 *
 * Idempotent : org/porteurs créés par NOM (réutilisés s'ils existent, pas de doublon ni
 * de re-consommation LLM) ; milestones + gate_evaluations nettoyés puis re-seedés.
 *
 * Opus étant à 0 req/min sur le workspace, tier frontier forcé sur Sonnet 5 via
 * LLM_MODEL_FRONTIER (défaut en code = claude-opus-4-8).
 */
import { readFileSync } from "node:fs";
import {
  createServiceClientFromEnv,
  runFounderProfiler,
  writeFounderProfile,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-founder-profiler/src/index.js";
import {
  runFounderProjectMatcher,
  writeMatchDeliverable,
  readFounderProfile,
} from "../packages/engine-founder-project-matcher/src/index.js";
import {
  runIdeationFunnel,
  writeIdeationDeliverable,
} from "../packages/engine-ideation-funnel/src/index.js";
import { evaluateGate } from "../packages/orchestrator/src/index.js";
import type { EngineInputEnvelope, FounderProfileContext } from "../packages/engine-sdk/src/index.js";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try {
      loader(path);
      return;
    } catch {
      /* fallback */
    }
  }
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2] ?? "";
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
    }
  } catch (e) {
    console.warn(`⚠️  .env.local: ${(e as Error).message}`);
  }
}

const ORG_NAME = "Incubateur Démo — CCI Test";
const EXISTING_PROJECT = "SMOKE E1 — Le Miroir";
const SEG_SAAS = "192bc00f-43fc-4231-9f95-ce047c8003fc"; // S2 SaaS / digital
const SEG_ARTISAN = "af57c926-3d95-4c9c-b33d-673596818df5"; // S4 Artisanat / services techniques

const CONSTRAINTS = (min: number) => ({
  quotas: {},
  llmChannel: "pooled" as const,
  researchDepthMin: min,
  outputLanguage: "fr",
  pedagogyLevels: ["beginner", "intermediate", "advanced"],
});
const context = (founderProfile: FounderProfileContext, segCode = "generic") => ({
  canonicalState: {},
  dependencyDigests: [],
  founderProfile,
  segmentProfile: { code: segCode, name: segCode, config: {} },
  geoLenses: ["france"],
  decisionsHistory: [],
});

type Client = ReturnType<typeof createServiceClientFromEnv>;

interface PorteurDef {
  marker: string;
  userProfile: Record<string, unknown>;
  entryDoor: "A" | "B";
  ambition: string;
  segmentId: string;
  segCode: string;
  e1Input: Record<string, unknown>;
  e2Project: Record<string, unknown>;
  opportunities: string;
}

const PORTEURS: PorteurDef[] = [
  {
    marker: "DÉMO Cockpit — Atelier menuiserie (P2)",
    userProfile: { name: "Karim B.", email: "karim.demo@ftg.test", note: "porteur démo cockpit" },
    entryDoor: "A",
    ambition: "independance",
    segmentId: SEG_ARTISAN,
    segCode: "S4",
    e1Input: {
      employment_status: "salarié en reconversion",
      objective_declared: "devenir artisan menuisier indépendant",
      engagement: { hours_week: 20, capital: 15000, horizon_months: 12 },
      competencies: { metier: "menuiserie (formation en cours)", experience_years: 2 },
      resources: { atelier: "accès partagé" },
      constraints: { famille: "2 enfants à charge" },
      risk_appetite: "prudent",
      motivation_declared: "transmettre un savoir-faire artisanal",
    },
    e2Project: {
      name: "Atelier de menuiserie sur-mesure",
      description: "Fabrication et pose d'agencements bois sur-mesure pour commerces de proximité.",
      business_model: "prestation + marge matière",
      target: "commerces locaux",
    },
    opportunities: "demande locale d'agencement bois pour commerces et TPE",
  },
  {
    marker: "DÉMO Cockpit — SaaS TPE (P3)",
    userProfile: { name: "Sofia M.", email: "sofia.demo@ftg.test", note: "porteur démo cockpit" },
    entryDoor: "B",
    ambition: "croissance",
    segmentId: SEG_SAAS,
    segCode: "S2",
    e1Input: {
      employment_status: "salariée tech",
      objective_declared: "créer une startup SaaS B2B",
      engagement: { hours_week: 25, capital: 30000, horizon_months: 18 },
      competencies: { metier: "ingénieure logiciel", experience_years: 8 },
      resources: { reseau: "communauté tech" },
      constraints: {},
      risk_appetite: "offensif",
      motivation_declared: "passer à l'échelle avec un produit numérique",
    },
    e2Project: {
      name: "Plateforme SaaS de gestion pour TPE artisanales",
      description: "Outil de gestion (devis, facturation, planning) pour artisans et TPE.",
      business_model: "abonnement mensuel",
      target: "artisans et TPE",
    },
    opportunities: "outils numériques de gestion pour TPE et artisans",
  },
];

/** Produit les 3 livrables réels (E1 → E2 → E3) pour un projet. */
async function generateDeliverables(
  client: Client,
  projectId: string,
  p: PorteurDef,
  versions: { e1: string; e2: string; e3: string },
): Promise<void> {
  // ── E1 profil ────────────────────────────────────────────────────────────
  const t1 = new Date().toISOString();
  const e1 = await runFounderProfiler({
    runId: `seed-e1-${projectId}`,
    taskType: "incarnation_report",
    projectContext: context({}, p.segCode),
    structuredInput: p.e1Input,
    constraints: CONSTRAINTS(0),
  } as EngineInputEnvelope);
  const sd1 = e1.structuredData as Record<string, unknown>;
  await writeFounderProfile(client, projectId, {
    competencies: sd1.competencies,
    resources: sd1.resources,
    constraints: sd1.constraints,
    risk_appetite: (sd1.risk_appetite as string | null) ?? null,
    intrinsic_nature: sd1.intrinsic_nature,
    mantra: (sd1.mantra as string | null) ?? null,
    internal_objectives: sd1.internal_objectives,
    builder_vs_opportunist_reading: (sd1.builder_vs_opportunist_reading as string | null) ?? null,
    engagement: sd1.engagement,
    validated_at: null,
  });
  await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: versions.e1, taskType: "incarnation_report",
    inputEnvelope: p.e1Input as never, inputStructuredValidated: true,
    researchDepth: e1.telemetry.researchDepthReached, modelCalls: e1.telemetry.modelCalls as never,
    llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null, status: "done", startedAt: t1, finishedAt: new Date().toISOString(),
  });
  await writeJournalEvent(client, projectId, "deliverable", `E1 — profil d'incarnation (mantra: ${String(sd1.mantra ?? "—")})`, null, "engine:founder_profiler");

  // ── E2 matching V3 ─────────────────────────────────────────────────────────
  const fp = (await readFounderProfile(client, projectId)) as unknown as FounderProfileContext;
  const t2 = new Date().toISOString();
  const reqEnv = await runFounderProjectMatcher({
    runId: `seed-e2-req-${projectId}`, taskType: "requirements_extraction",
    projectContext: context(fp, p.segCode), structuredInput: { project: p.e2Project }, constraints: CONSTRAINTS(0),
  } as EngineInputEnvelope);
  const requirements = (reqEnv.structuredData as { requirements?: unknown }).requirements ?? {};
  const scoreEnv = await runFounderProjectMatcher({
    runId: `seed-e2-score-${projectId}`, taskType: "match_scoring",
    projectContext: context(fp, p.segCode), structuredInput: { requirements }, constraints: CONSTRAINTS(0),
  } as EngineInputEnvelope);
  const sc = scoreEnv.structuredData as { v3_scores_by_dimension: Record<string, number>; gap_map: unknown[]; composite_v3: number };
  const e2Run = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: versions.e2, taskType: "match_scoring",
    inputEnvelope: { requirements } as never, inputStructuredValidated: true, researchDepth: 0,
    modelCalls: [...scoreEnv.telemetry.modelCalls, ...reqEnv.telemetry.modelCalls] as never,
    llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null, status: "done", startedAt: t2, finishedAt: new Date().toISOString(),
  });
  await writeMatchDeliverable(client, {
    projectId, projectMilestoneId: null, engineRunId: e2Run.id,
    title: "Rapport de matching V3 (E2 · La Boussole)",
    structuredData: {
      v3_scores_by_dimension: sc.v3_scores_by_dimension, gap_map: sc.gap_map, bridging_plans: [],
      composite_v3: sc.composite_v3, contentMd: scoreEnv.deliverable.contentMd, requirements,
    },
    sources: scoreEnv.sources as never, pedagogy: {} as never,
  });
  await writeJournalEvent(client, projectId, "deliverable", `E2 — matching V3 composite=${sc.composite_v3}`, null, "engine:founder_project_matcher");

  // ── E3 idéation → sélection ─────────────────────────────────────────────────
  const t3 = new Date().toISOString();
  const genEnv = await runIdeationFunnel({
    runId: `seed-e3-gen-${projectId}`, taskType: "idea_generation",
    projectContext: context(fp, p.segCode), structuredInput: { opportunities: p.opportunities, geo: "France" }, constraints: CONSTRAINTS(1),
  } as EngineInputEnvelope);
  const ideaCards = (genEnv.structuredData as { idea_cards?: unknown[] }).idea_cards ?? [];
  const scoreE3 = await runIdeationFunnel({
    runId: `seed-e3-score-${projectId}`, taskType: "pre_feasibility_scoring",
    projectContext: context({ ...fp, ambitionProfile: p.ambition } as FounderProfileContext, p.segCode),
    structuredInput: { ideas: ideaCards, ambition_profile: p.ambition }, constraints: CONSTRAINTS(1),
  } as EngineInputEnvelope);
  const scoringMatrix = (scoreE3.structuredData as { scoring_matrix?: unknown[] }).scoring_matrix ?? [];
  const selEnv = await runIdeationFunnel({
    runId: `seed-e3-sel-${projectId}`, taskType: "selection_brief",
    projectContext: context(fp, p.segCode), structuredInput: { scored_ideas: scoringMatrix, funnel_journal: [] }, constraints: CONSTRAINTS(1),
  } as EngineInputEnvelope);
  const selData = selEnv.structuredData as { selection?: unknown; funnel_journal?: unknown[]; three_ways?: unknown[] };
  const e3Run = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: versions.e3, taskType: "selection_brief",
    inputEnvelope: { scored_ideas: scoringMatrix } as never, inputStructuredValidated: true, researchDepth: 1,
    modelCalls: [...genEnv.telemetry.modelCalls, ...scoreE3.telemetry.modelCalls, ...selEnv.telemetry.modelCalls] as never,
    llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null, status: "done", startedAt: t3, finishedAt: new Date().toISOString(),
  });
  await writeIdeationDeliverable(client, {
    projectId, projectMilestoneId: null, engineRunId: e3Run.id, type: "selection_brief",
    title: "Lettre de décision — sélection d'idées (E3 · La Forge)",
    structuredData: {
      idea_cards: ideaCards, scoring_matrix: scoringMatrix, selection: selData.selection,
      funnel_journal: selData.funnel_journal ?? [], three_ways: selData.three_ways ?? [], contentMd: selEnv.deliverable.contentMd,
    },
    sources: [...genEnv.sources, ...selEnv.sources] as never, pedagogy: {} as never,
  });
  await writeJournalEvent(client, projectId, "deliverable", `E3 — sélection d'idées (${ideaCards.length} générées)`, null, "engine:ideation_funnel");
}

/** Supprime proprement un porteur démo et toutes ses données dépendantes (re-seed complet). */
async function cleanupPorteur(client: Client, projectId: string, ownerUserId: string | null): Promise<void> {
  await client.from("gate_evaluations").delete().eq("project_id", projectId);
  await client.from("project_milestones").delete().eq("project_id", projectId);
  await client.from("deliverables").delete().eq("project_id", projectId);
  await client.from("engine_runs").delete().eq("project_id", projectId);
  await client.from("project_journal").delete().eq("project_id", projectId);
  await client.from("founder_profiles").delete().eq("project_id", projectId);
  await client.from("projects").delete().eq("id", projectId);
  if (ownerUserId) await client.from("users").delete().eq("id", ownerUserId);
}

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ SEED COHORTE DÉMO — Cockpit B2B ════════");
  const client = createServiceClientFromEnv();

  // engine_versions 0.1.0 (deux requêtes, robuste)
  const versionOf = async (code: string) => {
    const { data: eng } = await client.from("engines").select("id").eq("code", code).single();
    if (!eng) throw new Error(`engine ${code} introuvable`);
    const { data: ver } = await client.from("engine_versions").select("id").eq("engine_id", eng.id).eq("semver", "0.1.0").single();
    if (!ver) throw new Error(`engine_version 0.1.0 introuvable pour ${code}`);
    return ver.id as string;
  };
  const versions = { e1: await versionOf("founder_profiler"), e2: await versionOf("founder_project_matcher"), e3: await versionOf("ideation_funnel") };

  // 1. Organisation (idempotent par nom)
  let { data: org } = await client.from("organizations").select("id").eq("name", ORG_NAME).maybeSingle();
  if (!org) {
    const ins = await client.from("organizations").insert({ name: ORG_NAME, type: "incubateur", plan: "paid", llm_channel: "pooled_quota" }).select("id").single();
    if (ins.error) throw new Error(`org: ${ins.error.message}`);
    org = ins.data;
  }
  const orgId = org.id;
  console.log(`• Org: ${orgId} (${ORG_NAME})`);

  // 2. Rattache le projet existant + enrichit ambition/segment (démo)
  const { data: p1 } = await client.from("projects").select("id").eq("name", EXISTING_PROJECT).single();
  if (!p1) throw new Error(`Projet "${EXISTING_PROJECT}" introuvable — lance d'abord les smoke E1/E2/E3.`);
  await client.from("projects").update({ org_id: orgId, ambition_profile: "independance", segment_primary_id: SEG_SAAS }).eq("id", p1.id);
  console.log(`• P1 (existant) rattaché à l'org: ${p1.id}`);

  // 3. Porteurs supplémentaires (créés + livrables réels si absents)
  const projectIds: Record<string, string> = { P1: p1.id };
  for (const [i, p] of PORTEURS.entries()) {
    const label = `P${i + 2}`;
    const { data: prev } = await client.from("projects").select("id, owner_user_id").eq("name", p.marker).maybeSingle();
    if (prev) {
      await cleanupPorteur(client, prev.id, (prev.owner_user_id as string | null) ?? null);
      console.log(`• ${label} antérieur nettoyé (${prev.id}).`);
    }
    const u = await client.from("users").insert({ profile: p.userProfile }).select("id").single();
    if (u.error || !u.data) throw new Error(`user ${label}: ${u.error?.message}`);
    const pr = await client.from("projects").insert({
      owner_user_id: u.data.id, org_id: orgId, entry_door: p.entryDoor, name: p.marker,
      status: "active", ambition_profile: p.ambition, segment_primary_id: p.segmentId,
      ref_version_id: "9b4b44b6-e386-48e6-abe9-2c284a7c81e3",
    }).select("id").single();
    if (pr.error || !pr.data) throw new Error(`project ${label}: ${pr.error?.message}`);
    console.log(`• ${label} créé (${pr.data.id}) — engines E1→E2→E3…`);
    await generateDeliverables(client, pr.data.id, p, versions);
    console.log(`  ✓ ${label} livrables produits.`);
    projectIds[label] = pr.data.id;
  }

  // 4a. project_milestones (état de démo seedé) — nettoie puis ré-insère
  const { data: ms } = await client
    .from("milestones").select("id, code, phases!inner(code, ref_version_id)")
    .in("code", ["P0-J0", "P0-J1", "P0-J2", "P0-J3", "P0-J4", "P0-J5", "P1-J1", "P1-J2", "P1-J3", "P1-J4", "P1-J5", "P1-J6", "P1-J7"]);
  const mid: Record<string, string> = {};
  for (const m of ms ?? []) mid[(m as { code: string }).code] = (m as { id: string }).id;

  const now = new Date().toISOString();
  const done = (q: number) => ({ state: "done", quality_score: q, done_at: now, opened_at: now });
  const prog = { state: "in_progress", quality_score: null, opened_at: now, done_at: null };
  const avail = { state: "available", quality_score: null, opened_at: null, done_at: null };
  const reco = { state: "recommended", quality_score: null, opened_at: null, done_at: null };
  const lock = { state: "locked", quality_score: null, opened_at: null, done_at: null };

  const milestonePlan: Record<string, Record<string, { state: string; quality_score: number | null; opened_at: string | null; done_at: string | null }>> = {
    P1: { "P0-J0": done(95), "P0-J1": done(88), "P0-J2": done(82), "P0-J3": done(79), "P0-J4": done(85), "P0-J5": prog, "P1-J1": reco, "P1-J2": lock, "P1-J3": lock, "P1-J4": lock, "P1-J5": lock, "P1-J6": lock, "P1-J7": lock },
    P2: { "P0-J0": done(90), "P0-J1": done(84), "P0-J2": done(80), "P0-J3": done(88), "P0-J4": done(92), "P0-J5": done(86), "P1-J1": prog, "P1-J2": avail, "P1-J3": lock, "P1-J4": lock, "P1-J5": lock, "P1-J6": lock, "P1-J7": lock },
    P3: { "P0-J0": done(96), "P0-J1": done(90), "P0-J2": done(87), "P0-J3": done(91), "P0-J4": done(89), "P0-J5": done(93), "P1-J1": done(84), "P1-J2": done(80), "P1-J3": done(78), "P1-J4": prog, "P1-J5": avail, "P1-J6": lock, "P1-J7": lock },
  };

  let msCount = 0;
  for (const [label, plan] of Object.entries(milestonePlan)) {
    const pid = projectIds[label]!;
    await client.from("project_milestones").delete().eq("project_id", pid);
    const rows = Object.entries(plan).map(([code, st]) => ({ project_id: pid, milestone_id: mid[code]!, ...st }));
    const ins = await client.from("project_milestones").insert(rows).select("id");
    if (ins.error) throw new Error(`project_milestones ${label}: ${ins.error.message}`);
    msCount += rows.length;
  }
  console.log(`• project_milestones seedés: ${msCount}`);

  // 4b. gate_evaluations — verdicts calculés par le VRAI Gatekeeper
  const { data: gateRows } = await client.from("gates").select("id, code, weights, threshold, critical_floors, verdict_policy");
  const gateById: Record<string, { id: string; def: unknown }> = {};
  for (const g of gateRows ?? []) {
    const row = g as { id: string; code: string; weights: Record<string, number>; threshold: string | number; critical_floors: Record<string, number>; verdict_policy: Record<string, unknown> };
    gateById[row.code] = {
      id: row.id,
      def: { code: row.code, phaseCode: row.code.replace("G", "P"), weights: row.weights, threshold: Number(row.threshold), criticalFloors: row.critical_floors, verdictPolicy: row.verdict_policy },
    };
  }

  const seedFact = { kind: "seed_note", detail: "Vecteurs de démonstration (cockpit v1). Verdict calculé par le vrai Gatekeeper (@ftg/orchestrator evaluateGate)." };
  const gateSeeds: Array<{ project: string; gate: string; vectorScores: Record<string, number>; solutionPathsAvailable: boolean; solutionPaths: unknown[] }> = [
    { project: "P1", gate: "G0", vectorScores: { V2: 82, V3: 55 }, solutionPathsAvailable: true, solutionPaths: [{ title: "Lever la réserve de clarté (V3) avant G1", description: "Préciser l'ancrage projet ↔ profil sur la dimension en réserve.", actions: ["Reformuler l'objectif", "Documenter les moyens"] }] },
    { project: "P2", gate: "G0", vectorScores: { V2: 80, V3: 74 }, solutionPathsAvailable: true, solutionPaths: [] },
    { project: "P3", gate: "G0", vectorScores: { V2: 88, V3: 80 }, solutionPathsAvailable: true, solutionPaths: [] },
    { project: "P3", gate: "G2", vectorScores: { V1: 62, V2: 60, V3: 58, V4: 42 }, solutionPathsAvailable: true, solutionPaths: [{ title: "Reconfigurer le périmètre marché", description: "Explorer une niche adjacente moins exposée.", actions: ["Cadrer 1 niche", "Tester la demande"] }, { title: "Partenariat de distribution", description: "S'appuyer sur un canal existant.", actions: ["Identifier 2 partenaires"] }, { title: "Séquencer le lancement", description: "Démarrer par un segment restreint.", actions: ["Choisir un segment pilote"] }] },
  ];

  let gateCount = 0;
  const verdictSummary: string[] = [];
  for (const pid of Object.values(projectIds)) {
    await client.from("gate_evaluations").delete().eq("project_id", pid);
  }
  for (const s of gateSeeds) {
    const g = gateById[s.gate];
    if (!g) throw new Error(`gate ${s.gate} introuvable`);
    const result = evaluateGate({ gate: g.def as never, vectorScores: s.vectorScores as never, projectMilestonesInScope: [], solutionPathsAvailable: s.solutionPathsAvailable });
    const facts = [seedFact, ...result.reserves.map((r) => ({ kind: "reserve", vector: r.vector, detail: r.description }))];
    const ins = await client.from("gate_evaluations").insert({
      gate_id: g.id, project_id: projectIds[s.project]!, verdict: result.verdict,
      computed_scores: result.computedScores as never, facts: facts as never, solution_paths: s.solutionPaths as never,
    }).select("id").single();
    if (ins.error) throw new Error(`gate_evaluations ${s.project}/${s.gate}: ${ins.error.message}`);
    gateCount += 1;
    verdictSummary.push(`${s.project}/${s.gate}=${result.verdict}`);
  }
  console.log(`• gate_evaluations (Gatekeeper réel): ${gateCount} → ${verdictSummary.join(", ")}`);

  // Récap
  const { count: deliverableCount } = await client.from("deliverables").select("*", { count: "exact", head: true }).in("project_id", Object.values(projectIds));
  console.log("\n──────── RÉCAP ────────");
  console.log(`Porteurs (org ${ORG_NAME}): ${Object.keys(projectIds).length}`);
  console.log(`Livrables (deliverables) sur la cohorte: ${deliverableCount}`);
  console.log(`project_milestones: ${msCount} · gate_evaluations: ${gateCount}`);
  console.log("✅ Seed terminé.");
}

main().catch((err) => {
  console.error("\n❌ Seed échoué:", err);
  process.exit(1);
});
