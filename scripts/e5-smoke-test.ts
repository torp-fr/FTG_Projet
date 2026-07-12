/**
 * Smoke test RÉEL de l'engine E5 « La Vigie » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e5-smoke-test.ts
 *
 * Lance E5 sur le porteur « Atelier menuiserie » (P2) avec de VRAIS appels aux sources
 * (Recherche d'Entreprises + Sirene + BODACC + Pappers) et de VRAIS appels LLM, puis
 * écrit un competitive_map RÉEL en base (deliverables + engine_runs + project_journal).
 * Hors `pnpm test`. Opus étant à 0 req/min, tier frontier forcé sur Sonnet 5.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runCompetitiveWatch,
  createServiceClientFromEnv,
  readProjectForE5,
  writeCompetitiveMap,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-competitive-watch/src/index.js";
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
  console.log("════════ SMOKE E5 — « La Vigie » (concurrence sur données réelles) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"}`);

  const client = createServiceClientFromEnv();
  const { data: project } = await client.from("projects").select("id").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le seed de démo.`);
  const projectId = project.id;
  const ctx = await readProjectForE5(client, projectId);
  console.log(`\n• Projet ${projectId} · segment=${ctx.segment} · idée retenue=${(ctx.idea ?? "—").slice(0, 60)}`);

  const { data: engine } = await client.from("engines").select("id").eq("code", "competitive_watch").single();
  const { data: version } = await client.from("engine_versions").select("id, semver, status").eq("engine_id", engine!.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable.");
  console.log(`• engine_version : ${version.id} (${version.semver}, ${version.status})`);

  const startedAt = new Date().toISOString();
  const run = async (taskType: string, structuredInput: Record<string, unknown>): Promise<EngineOutputEnvelope> => {
    const env = await runCompetitiveWatch({
      runId: `smoke-e5-${taskType}-${Date.now()}`,
      taskType,
      projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: ctx.segment ?? "Artisanat", config: {} }, geoLenses: ["france"], decisionsHistory: [] },
      structuredInput,
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    allCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  // 1) Cartographie (RÉEL : Recherche d'Entreprises + Sirene)
  console.log("\n• competitor_mapping (LIVE Recherche d'Entreprises + Sirene)…");
  const mapEnv = await run("competitor_mapping", { segment: ctx.segment, idee: ctx.idea ?? "atelier de menuiserie sur-mesure" });
  const mapSd = mapEnv.structuredData as {
    competitors: Array<{ siren: string; denomination: string; commune: string | null; naf: string | null; nafLabel: string | null; dateCreation: string | null }>;
    excluded: Array<{ siren: string; denomination: string; naf: string | null }>;
    activity_derivation: { keywords: string; naf_codes: Array<{ code?: string; label?: string }>; naf_filtering: boolean; departement: string | null };
    coverage_note: string;
  };
  const competitors = mapSd.competitors;
  const keywords = mapSd.activity_derivation.keywords;
  const nafCodes = (mapSd.activity_derivation.naf_codes ?? []).map((n) => n.code).filter(Boolean).join(", ");
  const departement = mapSd.activity_derivation.departement ?? undefined;
  console.log(`  → ${competitors.length} concurrents QUALIFIÉS PAR ACTIVITÉ · NAF sectoriels [${nafCodes}]${departement ? ` · dép. ${departement}` : ""} (appoint mots-clés « ${keywords} »)`);
  for (const c of competitors.slice(0, 8)) console.log(`     • ${c.siren} | ${c.denomination} | ${c.commune} | NAF ${c.naf ?? "?"}${c.nafLabel ? ` (${c.nafLabel})` : ""} | créé ${c.dateCreation}`);
  if (mapSd.excluded?.length) {
    console.log(`  ⊘ ${mapSd.excluded.length} écarté(s) HORS ACTIVITÉ (matchés sur le nom, pas l'activité) :`);
    for (const e of mapSd.excluded.slice(0, 6)) console.log(`     ✗ ${e.siren} | ${e.denomination} | NAF ${e.naf ?? "?"}`);
  } else {
    console.log("  ⊘ 0 écarté (le filtre NAF a produit une liste déjà propre).");
  }

  // 2) Vitalité (RÉEL : BODACC)
  console.log("• vitality_signals (LIVE BODACC)…");
  const vitEnv = await run("vitality_signals", { keywords, departement });
  const vitSd = vitEnv.structuredData as { vitality: unknown[]; creations: number; defaillances: number };
  console.log(`  → ${vitSd.vitality.length} annonces BODACC (${vitSd.creations} créations, ${vitSd.defaillances} procédures)`);

  // 3) Santé financière (RÉEL : Pappers, borné — dégrade si quota)
  console.log("• financial_health (LIVE Pappers, borné)…");
  const finEnv = await run("financial_health", { competitors: competitors.slice(0, 5) });
  const finSd = finEnv.structuredData as { financial_health: unknown[]; pappers_calls: number; pappers_real: number };
  console.log(`  → Pappers : ${finSd.pappers_calls} appels, ${finSd.pappers_real} réelle(s), ${finSd.pappers_calls - finSd.pappers_real} dégradée(s)`);

  // 4) Positionnement 3 voies (frontier, raisonné sur les données réelles)
  console.log("• positioning_three_ways (frontier)…");
  const posEnv = await run("positioning_three_ways", { competitors: competitors.slice(0, 8), vitality: vitSd.vitality, financial_health: finSd.financial_health });
  const posSd = posEnv.structuredData as { positioning_three_ways: Array<{ label: string }> };
  console.log(`  → ${posSd.positioning_three_ways.length} voies : ${posSd.positioning_three_ways.map((v) => v.label).join(" | ")}`);

  const finishedAt = new Date().toISOString();
  const depth = Math.max(mapEnv.telemetry.researchDepthReached, vitEnv.telemetry.researchDepthReached, finEnv.telemetry.researchDepthReached, posEnv.telemetry.researchDepthReached);

  const structuredData = {
    competitors,
    financial_health: finSd.financial_health,
    vitality: vitSd.vitality,
    positioning_three_ways: posSd.positioning_three_ways,
    coverage_note: mapSd.coverage_note,
    challenge: posEnv.challenge ?? null,
    waterfall_depth_reached: depth,
  };

  console.log(`\n• Profondeur waterfall atteinte (honnête) : ${depth}`);
  console.log("\n────────── competitive_map structured_data (extrait) ──────────");
  console.log(JSON.stringify({ n_competitors: competitors.length, n_vitality: vitSd.vitality.length, positioning: structuredData.positioning_three_ways, waterfall_depth_reached: depth }, null, 2));

  const engineRun = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: version.id, taskType: "competitor_mapping",
    inputEnvelope: { segment: ctx.segment, idee: ctx.idea } as unknown as Json, inputStructuredValidated: true,
    researchDepth: depth, modelCalls: allCalls as unknown as Json, llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null,
    status: "done", startedAt, finishedAt,
  });
  const deliverable = await writeCompetitiveMap(client, {
    projectId, projectMilestoneId: null, engineRunId: engineRun.id,
    title: "Cartographie concurrentielle (E5 · La Vigie)", structuredData,
    sources: allSources as unknown as Json, pedagogy: {} as unknown as Json,
  });
  const journal = await writeJournalEvent(
    client, projectId, "deliverable",
    `E5 (La Vigie) — competitive_map : ${competitors.length} concurrents, ${vitSd.vitality.length} signaux BODACC, waterfall=${depth}`,
    null, "engine:competitive_watch",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke E5 terminé bout en bout — ${competitors.length} concurrents réels, waterfall=${depth}.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke E5 échoué:", err);
  process.exit(1);
});
