/**
 * Smoke test RÉEL de l'engine E4 « Le Cartographe » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e4-smoke-test.ts
 *
 * Lance E4 sur le porteur « Atelier menuiserie » (P2) avec de VRAIS appels aux sources
 * (comptage Sirene par NAF+zone = densité réelle, BODACC daté = tendance réelle) et de
 * VRAIS appels LLM, puis écrit un market_study RÉEL en base (deliverables + engine_runs +
 * project_journal). Hors `pnpm test`. Opus étant à 0 req/min, tier frontier forcé sur Sonnet 5.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runMarketCartographer,
  createServiceClientFromEnv,
  readProjectForE4,
  writeMarketStudy,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-market-cartographer/src/index.js";
import type { Json } from "@ftg/database";

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
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

const PROJECT_NAME = "DÉMO Cockpit — Atelier menuiserie (P2)";
const CONSTRAINTS = { quotas: {}, llmChannel: "pooled" as const, researchDepthMin: 1, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] };
const allCalls: unknown[] = [];
const allSources: unknown[] = [];

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ SMOKE E4 — « Le Cartographe » (étude de marché sur données réelles) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"}`);

  const client = createServiceClientFromEnv();
  const { data: project } = await client.from("projects").select("id").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le seed de démo.`);
  const projectId = project.id;
  const ctx = await readProjectForE4(client, projectId);
  console.log(`\n• Projet ${projectId} · segment=${ctx.segment} · idée=${(ctx.idea ?? "—").slice(0, 60)} · geo=${JSON.stringify(ctx.geoLenses)}`);

  const { data: engine } = await client.from("engines").select("id").eq("code", "market_cartographer").single();
  const { data: version } = await client.from("engine_versions").select("id, semver, status").eq("engine_id", engine!.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable — enregistre-la d'abord (MCP).");
  console.log(`• engine_version : ${version.id} (${version.semver}, ${version.status})`);

  const startedAt = new Date().toISOString();
  const run = async (taskType: string, structuredInput: Record<string, unknown>): Promise<EngineOutputEnvelope> => {
    const env = await runMarketCartographer({
      runId: `smoke-e4-${taskType}-${Date.now()}`,
      taskType,
      projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: ctx.segment ?? "Artisanat", config: {} }, geoLenses: ctx.geoLenses, decisionsHistory: [] },
      structuredInput,
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    allCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  // 1) Périmètre (NAF cœur + zone + lentille géo)
  console.log("\n• scope_definition (petit)…");
  const scopeEnv = await run("scope_definition", { segment: ctx.segment, idee: ctx.idea ?? "atelier de menuiserie" });
  const scope = (scopeEnv.structuredData as { scope: { keywords: string; naf_codes: Array<{ code?: string }>; departement: string | null; geo_scope: string } }).scope;
  const nafCodes = (scope.naf_codes ?? []).map((n) => n.code).filter(Boolean);
  console.log(`  → NAF [${nafCodes.join(", ")}] · mots-clés « ${scope.keywords} » · géo ${scope.geo_scope}${scope.departement ? ` (dép. ${scope.departement})` : " (national)"}`);

  // 2) Dimensionnement (densité RÉELLE Sirene + macro [E])
  console.log("• market_sizing (LIVE comptage Sirene par NAF+zone)…");
  const sizingEnv = await run("market_sizing", { scope, segment: ctx.segment });
  const sizing = (sizingEnv.structuredData as { sizing: { density: { total: number; capped: boolean; activeOnly: boolean; perNaf: Array<{ naf: string; total: number; capped: boolean }> }; macro: { available: boolean }; tam: { value: number | null; unit: string | null }; sam: { value: number | null }; som: { value: number | null } } }).sizing;
  const d = sizing.density;
  console.log(`  → DENSITÉ RÉELLE (Sirene, actifs=${d.activeOnly}) : total ${d.capped ? `≥ ${d.total} (plafond API)` : d.total}`);
  for (const p of d.perNaf) console.log(`       • ${p.naf} : ${p.capped ? `≥ ${p.total} (plafond)` : p.total} établissements`);
  console.log(`  → SIZING [E] : TAM ${sizing.tam.value ?? "?"} ${sizing.tam.unit ?? ""} · SAM ${sizing.sam.value ?? "?"} · SOM ${sizing.som.value ?? "?"} (macro INSEE dispo=${sizing.macro.available})`);

  // 3) Tendance (BODACC daté RÉEL)
  console.log("• trend_analysis (LIVE BODACC daté)…");
  const trendEnv = await run("trend_analysis", { scope });
  const trend = (trendEnv.structuredData as { trend: { bodacc: { recent: { creations: number; proceduresCollectives: number; from: string; to: string }; previous: { creations: number; from: string; to: string }; creationsTrend: string }; bodacc_degraded: boolean; search_demand: { deferred: boolean } } }).trend;
  const b = trend.bodacc;
  console.log(`  → TENDANCE RÉELLE (BODACC) : créations ${b.recent.creations} (${b.recent.from}→${b.recent.to}) vs ${b.previous.creations} (précédent) → ${b.creationsTrend} · procédures collectives ${b.recent.proceduresCollectives}`);
  console.log(`  → demande mots-clés : ${trend.search_demand.deferred ? "DIFFÉRÉE [E] (DataForSEO V2, aucun volume inventé)" : "collectée"}`);

  // 4) Segments & personas
  console.log("• segmentation_personas (intermédiaire)…");
  const segEnv = await run("segmentation_personas", { scope, sizing, trend });
  const segments_personas = (segEnv.structuredData as { segments_personas: { segments: Array<{ name: string }>; personas: Array<{ name: string }> } }).segments_personas;
  console.log(`  → ${segments_personas.segments.length} segments · ${segments_personas.personas.length} personas`);

  // 5) Assemblage + verdict d'attractivité (frontier 😈)
  console.log("• full_report_assembly (frontier 😈)…");
  const reportEnv = await run("full_report_assembly", { scope, sizing, trend, segments_personas });
  const verdict = (reportEnv.structuredData as { attractiveness_verdict: { facts_for: string[]; facts_against: string[] } }).attractiveness_verdict;
  console.log(`  → VERDICT double-face : ${verdict.facts_for.length} faits POUR / ${verdict.facts_against.length} faits CONTRE`);
  console.log(`     POUR : ${verdict.facts_for.slice(0, 2).join(" | ")}`);
  console.log(`     CONTRE : ${verdict.facts_against.slice(0, 2).join(" | ")}`);

  const finishedAt = new Date().toISOString();
  const depth = Math.max(scopeEnv.telemetry.researchDepthReached, sizingEnv.telemetry.researchDepthReached, trendEnv.telemetry.researchDepthReached, segEnv.telemetry.researchDepthReached, reportEnv.telemetry.researchDepthReached);

  const structuredData = {
    scope,
    density: sizing.density,
    sizing,
    trend,
    segments_personas,
    attractiveness_verdict: verdict,
    challenge: reportEnv.challenge ?? null,
    waterfall_depth_reached: depth,
  };

  console.log(`\n• Profondeur waterfall atteinte (honnête) : ${depth}`);

  const engineRun = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: version.id, taskType: "full_report_assembly",
    inputEnvelope: { segment: ctx.segment, idee: ctx.idea, naf: nafCodes } as unknown as Json, inputStructuredValidated: true,
    researchDepth: depth, modelCalls: allCalls as unknown as Json, llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null,
    status: "done", startedAt, finishedAt,
  });
  const deliverable = await writeMarketStudy(client, {
    projectId, projectMilestoneId: null, engineRunId: engineRun.id,
    title: "Étude de marché (E4 · Le Cartographe)", structuredData,
    sources: allSources as unknown as Json, pedagogy: {} as unknown as Json,
  });
  const journal = await writeJournalEvent(
    client, projectId, "deliverable",
    `E4 (Le Cartographe) — market_study : densité ${d.capped ? `≥${d.total}` : d.total} établissements, tendance créations ${b.creationsTrend}, waterfall=${depth}`,
    null, "engine:market_cartographer",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke E4 terminé bout en bout — densité réelle ${d.capped ? `≥${d.total}` : d.total}, tendance ${b.creationsTrend}, waterfall=${depth}.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke E4 échoué:", err);
  process.exit(1);
});
