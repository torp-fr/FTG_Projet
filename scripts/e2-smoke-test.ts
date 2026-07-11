/**
 * Smoke test RÉEL de l'engine E2 « La Boussole » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e2-smoke-test.ts
 *
 * Lit un founder_profile RÉEL (réutilise le projet de test du smoke E1), exécute la
 * chaîne E2 (requirements_extraction -> match_scoring -> gap_bridging) avec de VRAIS
 * appels Anthropic, puis écrit un match_report RÉEL en base (deliverables + engine_runs
 * + project_journal). N'est PAS exécuté par `pnpm test`.
 *
 * Opus étant à 0 req/min sur le workspace, on force le tier frontier sur Sonnet 5 via
 * LLM_MODEL_FRONTIER (le défaut en code reste claude-opus-4-8).
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, FounderProfileContext } from "@ftg/engine-sdk";
import {
  runFounderProjectMatcher,
  createServiceClientFromEnv,
  readFounderProfile,
  writeMatchDeliverable,
  writeJournalEvent,
  writeEngineRun,
  type MatchStructuredData,
} from "../packages/engine-founder-project-matcher/src/index.js";
import type { Json } from "@ftg/database";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try {
      loader(path);
      return;
    } catch {
      /* fallback manuel */
    }
  }
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2] ?? "";
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = val;
    }
  } catch (e) {
    console.warn(`⚠️  Impossible de charger ${path}: ${(e as Error).message}`);
  }
}

const PROJECT_NAME = "SMOKE E1 — Le Miroir";

/** Contexte projet exigeant beaucoup d'exposition terrain (crée un écart plausible). */
const PROJECT_CONTEXT = {
  project: {
    name: "Distribution B2B en porte-à-porte",
    description:
      "Vente terrain intensive de solutions logicielles en démarchage direct auprès de commerces de proximité : prospection quotidienne en présentiel, déplacements régionaux réguliers, closing en face-à-face.",
    business_model: "vente terrain B2B, marge sur licences",
    target: "commerces de proximité",
  },
};

function baseContext(founderProfile: FounderProfileContext) {
  return {
    canonicalState: {},
    dependencyDigests: [],
    founderProfile,
    segmentProfile: { code: "generic", name: "Générique", config: {} },
    geoLenses: ["france"],
    decisionsHistory: [],
  };
}

const CONSTRAINTS = {
  quotas: {},
  llmChannel: "pooled" as const,
  researchDepthMin: 0,
  outputLanguage: "fr",
  pedagogyLevels: ["beginner", "intermediate", "advanced"],
};

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════════════════════════════════════════════════════════");
  console.log(" SMOKE TEST E2 — « La Boussole » (matching V3 réel + écritures DB)");
  console.log("════════════════════════════════════════════════════════════");
  console.log(
    ` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · ` +
      `intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"} · ` +
      `petit=${process.env.LLM_MODEL_PETIT ?? "claude-haiku-4-5"}`,
  );

  const client = createServiceClientFromEnv();

  // ── Projet de test + founder_profile réel (réutilise le smoke E1) ─────────
  const { data: project, error: projErr } = await client
    .from("projects")
    .select("id")
    .eq("name", PROJECT_NAME)
    .maybeSingle();
  if (projErr) throw new Error(`lecture projet: ${projErr.message}`);
  if (!project) throw new Error(`Projet de test "${PROJECT_NAME}" introuvable — lance d'abord le smoke E1.`);
  const projectId = project.id;

  const founderProfile = await readFounderProfile(client, projectId);
  if (!founderProfile) throw new Error(`Aucun founder_profile pour le projet ${projectId} — lance d'abord le smoke E1.`);
  console.log(`\n• Projet ${projectId} · founder_profile v${founderProfile.version} lu (mantra: ${founderProfile.mantra ?? "—"})`);

  // ── engine_version 0.1.0 de founder_project_matcher ───────────────────────
  const { data: engine } = await client.from("engines").select("id").eq("code", "founder_project_matcher").single();
  if (!engine) throw new Error("Engine founder_project_matcher introuvable.");
  const { data: version } = await client
    .from("engine_versions")
    .select("id, semver, status")
    .eq("engine_id", engine.id)
    .eq("semver", "0.1.0")
    .single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable.");
  console.log(`• engine_version : ${version.id} (semver ${version.semver}, ${version.status})`);

  const fp = founderProfile as unknown as FounderProfileContext;

  // ── Chaîne E2 : requirements -> scoring -> bridging (vrais appels LLM) ─────
  const startedAt = new Date().toISOString();

  console.log("\n• requirements_extraction (tier petit)…");
  const reqEnv = await runFounderProjectMatcher({
    runId: `smoke-e2-req-${startedAt}`,
    taskType: "requirements_extraction",
    projectContext: baseContext(fp),
    structuredInput: PROJECT_CONTEXT,
    constraints: CONSTRAINTS,
  } as EngineInputEnvelope);
  const requirements = (reqEnv.structuredData as { requirements?: unknown }).requirements ?? {};

  console.log("• match_scoring (tier intermédiaire)…");
  const scoreInput = {
    runId: `smoke-e2-score-${startedAt}`,
    taskType: "match_scoring",
    projectContext: baseContext(fp),
    structuredInput: { requirements },
    constraints: CONSTRAINTS,
  } as EngineInputEnvelope;
  const scoreEnv = await runFounderProjectMatcher(scoreInput);
  const scoreData = scoreEnv.structuredData as {
    v3_scores_by_dimension: Record<string, number>;
    gap_map: unknown[];
    composite_v3: number;
  };

  let bridgingPlans: unknown[] = [];
  const bridgeCalls: unknown[] = [];
  const bridgeSources: unknown[] = [];
  if (scoreData.gap_map.length > 0) {
    console.log(`• gap_bridging (tier frontier) — ${scoreData.gap_map.length} écart(s)…`);
    const bridgeEnv = await runFounderProjectMatcher({
      runId: `smoke-e2-bridge-${startedAt}`,
      taskType: "gap_bridging",
      projectContext: baseContext(fp),
      structuredInput: { requirements, gap_map: scoreData.gap_map },
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    bridgingPlans = (bridgeEnv.structuredData as { bridging_plans?: unknown[] }).bridging_plans ?? [];
    bridgeCalls.push(...bridgeEnv.telemetry.modelCalls);
    bridgeSources.push(...bridgeEnv.sources);
  } else {
    console.log("• pas d'écart détecté — gap_bridging non nécessaire (match aligné).");
  }
  const finishedAt = new Date().toISOString();

  // ── structured_data assemblée du match_report ─────────────────────────────
  const structuredData: MatchStructuredData = {
    v3_scores_by_dimension: scoreData.v3_scores_by_dimension,
    gap_map: scoreData.gap_map,
    bridging_plans: bridgingPlans,
    composite_v3: scoreData.composite_v3,
    contentMd: scoreEnv.deliverable.contentMd,
    requirements,
  };

  console.log("\n────────── structured_data (match_report) ──────────");
  console.log(JSON.stringify(structuredData, null, 2));

  // ── Écritures Supabase réelles ────────────────────────────────────────────
  const modelCalls = [...scoreEnv.telemetry.modelCalls, ...reqEnv.telemetry.modelCalls, ...bridgeCalls];
  const engineRun = await writeEngineRun(client, {
    projectId,
    agentId: null,
    engineVersionId: version.id,
    taskType: "match_scoring",
    inputEnvelope: scoreInput as unknown as Json,
    inputStructuredValidated: true,
    researchDepth: scoreEnv.telemetry.researchDepthReached,
    modelCalls: modelCalls as unknown as Json,
    llmChannel: "pooled",
    costEstimate: null,
    outputEnvelopeRef: null,
    status: "done",
    startedAt,
    finishedAt,
  });

  const deliverable = await writeMatchDeliverable(client, {
    projectId,
    projectMilestoneId: null,
    engineRunId: engineRun.id,
    title: "Rapport de matching V3 (E2 · La Boussole)",
    structuredData,
    sources: [...scoreEnv.sources, ...bridgeSources] as unknown as Json,
    pedagogy: scoreEnv.pedagogy as unknown as Json,
  });

  const journal = await writeJournalEvent(
    client,
    projectId,
    "deliverable",
    `E2 (La Boussole) — match_report V3 composite=${scoreData.composite_v3} (${scoreData.gap_map.length} écart(s), ${bridgingPlans.length} plan(s) de comblement)`,
    null,
    "engine:founder_project_matcher",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}, task=${engineRun.task_type}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke test E2 terminé bout en bout — V3 composite=${scoreData.composite_v3}.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke test E2 échoué:", err);
  process.exit(1);
});
