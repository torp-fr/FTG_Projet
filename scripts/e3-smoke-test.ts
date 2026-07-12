/**
 * Smoke test RÉEL de l'engine E3 « La Forge » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e3-smoke-test.ts
 *
 * Exécute l'entonnoir complet (idea_generation Porte B -> hard_filter ->
 * multi_dim_challenge -> pre_feasibility_scoring -> selection_brief) avec de VRAIS
 * appels Anthropic, sur le founder_profile RÉEL du projet de test, puis écrit un
 * selection_brief RÉEL (deliverables + engine_runs + project_journal). Hors `pnpm test`.
 *
 * Opus étant à 0 req/min sur le workspace, tier frontier forcé sur Sonnet 5 via
 * LLM_MODEL_FRONTIER (défaut en code = claude-opus-4-8).
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, FounderProfileContext, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runIdeationFunnel,
  createServiceClientFromEnv,
  readFounderProfile,
  writeIdeationDeliverable,
  writeJournalEvent,
  writeEngineRun,
  type IdeationStructuredData,
} from "../packages/engine-ideation-funnel/src/index.js";
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = val;
    }
  } catch (e) {
    console.warn(`⚠️  Impossible de charger ${path}: ${(e as Error).message}`);
  }
}

const PROJECT_NAME = "SMOKE E1 — Le Miroir";
const allModelCalls: unknown[] = [];
const allSources: unknown[] = [];

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════════════════════════════════════════════════════════");
  console.log(" SMOKE TEST E3 — « La Forge » (entonnoir complet réel + écritures DB)");
  console.log("════════════════════════════════════════════════════════════");
  console.log(
    ` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · ` +
      `intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"} · ` +
      `petit=${process.env.LLM_MODEL_PETIT ?? "claude-haiku-4-5"}`,
  );

  const client = createServiceClientFromEnv();

  const { data: project } = await client.from("projects").select("id, ambition_profile").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le smoke E1.`);
  const projectId = project.id;

  const founderProfileRow = await readFounderProfile(client, projectId);
  if (!founderProfileRow) throw new Error(`Aucun founder_profile pour ${projectId} — lance d'abord le smoke E1.`);
  const ambition = (project.ambition_profile as string | null) ?? "independance";
  const fp = { ...founderProfileRow, ambitionProfile: ambition } as unknown as FounderProfileContext;
  console.log(`\n• Projet ${projectId} · founder_profile v${founderProfileRow.version} · ambition=${ambition}`);

  const { data: engine } = await client.from("engines").select("id").eq("code", "ideation_funnel").single();
  if (!engine) throw new Error("Engine ideation_funnel introuvable.");
  const { data: version } = await client
    .from("engine_versions").select("id, semver, status").eq("engine_id", engine.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable.");
  console.log(`• engine_version : ${version.id} (semver ${version.semver}, ${version.status})`);

  const constraints = {
    quotas: {},
    llmChannel: "pooled" as const,
    researchDepthMin: 1, // E3 V1 honnête
    outputLanguage: "fr",
    pedagogyLevels: ["beginner", "intermediate", "advanced"],
  };
  const baseContext = () => ({
    canonicalState: {},
    dependencyDigests: [],
    founderProfile: fp,
    segmentProfile: { code: "generic", name: "Générique", config: {} },
    geoLenses: ["france"],
    decisionsHistory: [],
  });
  const run = async (taskType: string, structuredInput: Record<string, unknown>): Promise<EngineOutputEnvelope> => {
    const env = await runIdeationFunnel({
      runId: `smoke-e3-${taskType}-${Date.now()}`,
      taskType,
      projectContext: baseContext(),
      structuredInput,
      constraints,
    } as EngineInputEnvelope);
    allModelCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  const startedAt = new Date().toISOString();

  console.log("\n• idea_generation (Porte B, tier intermédiaire)…");
  const genEnv = await run("idea_generation", { opportunities: "services numériques et artisanaux pour TPE locales", geo: "France" });
  const idea_cards = (genEnv.structuredData as { idea_cards?: unknown[] }).idea_cards ?? [];
  console.log(`  → ${idea_cards.length} idées générées.`);

  console.log("• hard_filter (tier petit)…");
  const filterEnv = await run("hard_filter", {
    idea_cards,
    hard_criteria: ["légalité / accès réglementaire sans chemin", "capital de départ hors de portée sans option", "incompatibilité totale avec le temps déclaré"],
  });
  const filterJournal = (filterEnv.structuredData as { funnel_journal?: unknown[]; kept?: Array<{ idea: string }> });
  const kept = filterJournal.kept ?? [];
  console.log(`  → ${kept.length} idées conservées.`);

  console.log("• multi_dim_challenge (tier frontier 😈) sur la 1re idée conservée…");
  const challengeEnv = await run("multi_dim_challenge", { idea: kept[0] ?? idea_cards[0] ?? {} });

  console.log("• pre_feasibility_scoring (tier intermédiaire)…");
  const scoreEnv = await run("pre_feasibility_scoring", { ideas: kept.length ? kept : idea_cards, ambition_profile: ambition });
  const scoring_matrix = (scoreEnv.structuredData as { scoring_matrix?: unknown[] }).scoring_matrix ?? [];

  console.log("• selection_brief (tier frontier 🔀)…");
  const selInput = { scored_ideas: scoring_matrix, funnel_journal: filterJournal.funnel_journal ?? [] };
  const selEnv = await run("selection_brief", selInput);
  const selData = selEnv.structuredData as { selection?: unknown; funnel_journal?: unknown[]; three_ways?: unknown[] };
  const finishedAt = new Date().toISOString();

  // funnel_journal complet = étage hard_filter + étage sélection
  const fullFunnelJournal = [
    ...((filterJournal.funnel_journal as unknown[]) ?? []),
    ...((selData.funnel_journal as unknown[]) ?? []),
  ];

  const structuredData: IdeationStructuredData = {
    idea_cards,
    funnel_journal: fullFunnelJournal,
    scoring_matrix,
    selection: selData.selection,
    three_ways: selData.three_ways,
    challenge: challengeEnv.challenge,
    contentMd: selEnv.deliverable.contentMd,
  };

  console.log("\n────────── structured_data (selection_brief) ──────────");
  console.log(JSON.stringify(structuredData, null, 2));

  const engineRun = await writeEngineRun(client, {
    projectId,
    agentId: null,
    engineVersionId: version.id,
    taskType: "selection_brief",
    inputEnvelope: selInput as unknown as Json,
    inputStructuredValidated: true,
    researchDepth: selEnv.telemetry.researchDepthReached,
    modelCalls: allModelCalls as unknown as Json,
    llmChannel: "pooled",
    costEstimate: null,
    outputEnvelopeRef: null,
    status: "done",
    startedAt,
    finishedAt,
  });

  const deliverable = await writeIdeationDeliverable(client, {
    projectId,
    projectMilestoneId: null,
    engineRunId: engineRun.id,
    type: "selection_brief",
    title: "Lettre de décision — sélection d'idées (E3 · La Forge)",
    structuredData,
    sources: allSources as unknown as Json,
    pedagogy: selEnv.pedagogy as unknown as Json,
  });

  const journal = await writeJournalEvent(
    client,
    projectId,
    "deliverable",
    `E3 (La Forge) — selection_brief : ${idea_cards.length} idées → ${kept.length} conservées → sélection (funnel tracé: ${fullFunnelJournal.length} décisions)`,
    null,
    "engine:ideation_funnel",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}, task=${engineRun.task_type}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke test E3 terminé bout en bout — ${idea_cards.length} idées, ${kept.length} conservées, ${fullFunnelJournal.length} décisions tracées.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke test E3 échoué:", err);
  process.exit(1);
});
