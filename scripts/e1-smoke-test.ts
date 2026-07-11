/**
 * Smoke test RÉEL de l'engine E1 « Le Miroir » — SÉPARÉ des tests automatisés.
 *
 *   npx tsx scripts/e1-smoke-test.ts
 *
 * Fait un VRAI appel à l'API Anthropic (ANTHROPIC_API_KEY) et écrit RÉELLEMENT dans
 * Supabase (founder_profiles, project_journal, engine_runs) sur un projet de test.
 * N'est PAS exécuté par `pnpm test` (aucun coût/réseau dans la CI).
 *
 * Prérequis : .env.local à la racine (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * ANTHROPIC_API_KEY) + engine_version 0.1.0 de founder_profiler enregistrée.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope } from "@ftg/engine-sdk";
import {
  runFounderProfiler,
  createServiceClientFromEnv,
  writeFounderProfile,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-founder-profiler/src/index.js";
import type { Json } from "@ftg/database";

// ── Chargement .env.local ────────────────────────────────────────────────────
function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try {
      loader(path);
      return;
    } catch {
      /* fallback manuel ci-dessous */
    }
  }
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2] ?? "";
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = val;
    }
  } catch (e) {
    console.warn(`⚠️  Impossible de charger ${path}: ${(e as Error).message}`);
  }
}

const PROJECT_NAME = "SMOKE E1 — Le Miroir";

async function main(): Promise<void> {
  loadEnvLocal();

  console.log("════════════════════════════════════════════════════════════");
  console.log(" SMOKE TEST E1 — « Le Miroir » (appel LLM réel + écritures DB)");
  console.log("════════════════════════════════════════════════════════════");
  console.log(
    ` Modèles : petit=${process.env.LLM_MODEL_PETIT ?? "claude-haiku-4-5"} · ` +
      `intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"} · ` +
      `frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"}`,
  );

  const client = createServiceClientFromEnv();

  // ── Projet de test (créé si absent, réutilisé sinon) ──────────────────────
  const { data: existing } = await client
    .from("projects")
    .select("id")
    .eq("name", PROJECT_NAME)
    .maybeSingle();

  let projectId: string;
  if (existing) {
    projectId = existing.id;
    console.log(`\n• Projet de test réutilisé : ${projectId}`);
  } else {
    const { data: refv, error: refErr } = await client
      .from("referential_versions")
      .select("id")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (refErr || !refv) throw new Error(`Référentiel actif introuvable: ${refErr?.message}`);

    const { data: user, error: userErr } = await client
      .from("users")
      .insert({
        profile: {
          name: "Smoke Test E1",
          email: "smoke-e1@ftg.test",
          note: "créé par scripts/e1-smoke-test.ts",
        },
      })
      .select("id")
      .single();
    if (userErr || !user) throw new Error(`Création user échouée: ${userErr?.message}`);

    const { data: proj, error: projErr } = await client
      .from("projects")
      .insert({
        owner_user_id: user.id,
        entry_door: "A",
        name: PROJECT_NAME,
        status: "active",
        ref_version_id: refv.id,
      })
      .select("id")
      .single();
    if (projErr || !proj) throw new Error(`Création projet échouée: ${projErr?.message}`);
    projectId = proj.id;
    console.log(`\n• Projet de test créé : ${projectId} (user ${user.id})`);
  }

  // ── engine_version candidate 0.1.0 de founder_profiler ────────────────────
  const { data: engine, error: engErr } = await client
    .from("engines")
    .select("id")
    .eq("code", "founder_profiler")
    .single();
  if (engErr || !engine) throw new Error(`Engine founder_profiler introuvable: ${engErr?.message}`);

  const { data: version, error: verErr } = await client
    .from("engine_versions")
    .select("id, semver, status")
    .eq("engine_id", engine.id)
    .eq("semver", "0.1.0")
    .single();
  if (verErr || !version) throw new Error(`engine_version 0.1.0 introuvable: ${verErr?.message}`);
  console.log(`• engine_version : ${version.id} (semver ${version.semver}, ${version.status})`);

  // ── Fixture d'input réaliste (golden scénario E1) ─────────────────────────
  const structuredInput = {
    employment_status: "salarié",
    objective_declared: "remplacer mon salaire en 3 mois",
    engagement: { hours_week: 10, capital: 5000, horizon_months: 3 },
    competencies: { metier: "développeur web", experience_years: 6 },
    resources: { reseau: "limité", outils: ["ordinateur portable"] },
    constraints: { emploi: "plein temps", mobilite: "faible" },
    risk_appetite: "modéré",
    motivation_declared: "gagner en autonomie",
  };

  const input: EngineInputEnvelope = {
    runId: `smoke-e1-${new Date().toISOString()}`,
    taskType: "incarnation_report",
    projectContext: {
      canonicalState: {},
      dependencyDigests: [],
      founderProfile: {},
      segmentProfile: { code: "generic", name: "Générique", config: {} },
      geoLenses: ["france"],
      decisionsHistory: [],
    },
    structuredInput,
    constraints: {
      quotas: {},
      llmChannel: "pooled",
      researchDepthMin: 0, // E1 réflexif, aucune recherche waterfall
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"],
    },
  };

  // ── Appel LLM réel ────────────────────────────────────────────────────────
  console.log("\n• Appel LLM réel (incarnation_report, tier frontier)…");
  const startedAt = new Date().toISOString();
  const envelope = await runFounderProfiler(input); // callModel réel (ANTHROPIC_API_KEY)
  const finishedAt = new Date().toISOString();

  console.log("\n────────── ENVELOPPE DE SORTIE (conforme au contrat) ──────────");
  console.log(JSON.stringify(envelope, null, 2));

  // ── Écritures Supabase réelles ────────────────────────────────────────────
  const sd = envelope.structuredData as Record<string, unknown>;
  const savedProfile = await writeFounderProfile(client, projectId, {
    competencies: sd.competencies,
    resources: sd.resources,
    constraints: sd.constraints,
    risk_appetite: (sd.risk_appetite as string | null) ?? null,
    intrinsic_nature: sd.intrinsic_nature,
    mantra: (sd.mantra as string | null) ?? null,
    internal_objectives: sd.internal_objectives,
    builder_vs_opportunist_reading: (sd.builder_vs_opportunist_reading as string | null) ?? null,
    engagement: sd.engagement,
    validated_at: null,
  });

  // event_type contraint par project_journal_event_type_check :
  // deliverable | gate | decision | message | alert | override.
  const journal = await writeJournalEvent(
    client,
    projectId,
    "deliverable",
    `E1 (Le Miroir) — rapport d'incarnation (incarnation_report) généré · mantra: ${String(sd.mantra ?? "—")}`,
    null,
    "engine:founder_profiler",
  );

  const engineRun = await writeEngineRun(client, {
    projectId,
    agentId: null,
    engineVersionId: version.id,
    taskType: input.taskType,
    inputEnvelope: input as unknown as Json,
    inputStructuredValidated: true,
    researchDepth: envelope.telemetry.researchDepthReached,
    modelCalls: envelope.telemetry.modelCalls as unknown as Json,
    llmChannel: input.constraints.llmChannel,
    costEstimate: null,
    outputEnvelopeRef: null,
    // status contraint par engine_runs_status_check : queued|running|awaiting_user|done|failed.
    status: "done",
    startedAt,
    finishedAt,
  });

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ founder_profiles  → project_id=${savedProfile.project_id}, version=${savedProfile.version}`);
  console.log(`✓ project_journal   → id=${journal.id}, event=${journal.event_type}`);
  console.log(`✓ engine_runs       → id=${engineRun.id}, status=${engineRun.status}, task=${engineRun.task_type}`);
  console.log("\n✅ Smoke test E1 terminé bout en bout.");
}

main().catch((err) => {
  console.error("\n❌ Smoke test E1 échoué:", err);
  process.exit(1);
});
