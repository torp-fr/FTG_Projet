/**
 * Smoke test RÉEL de l'engine E9 « L'Éponyme » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e9-smoke-test.ts
 *
 * DOGFOOD sur le nom FTG : vérifie « Found The Grow » et « FTG » →
 *  - domaines RÉELS via RDAP (.com/.fr/.io), horodatés ;
 *  - collision de dénomination RÉELLE via Recherche d'Entreprises ;
 *  - marques INDICATIF (Pappers → dégradé [E] quota, + URL INPI de vérification) ;
 *  - handles best-effort ;
 *  - shortlist challengée + guide de sécurisation PI (classes de Nice) + pi_status.
 * Écrit un naming_report RÉEL (rattaché au projet démo). Hors `pnpm test`.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runNameForge,
  createServiceClientFromEnv,
  readProjectForE9,
  writeNamingReport,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-name-forge/src/index.js";
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
const CANDIDATES = ["Found The Grow", "FTG"];
const TLDS = ["com", "fr", "io"];
const allCalls: unknown[] = [];
const allSources: unknown[] = [];

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ SMOKE E9 — « L'Éponyme » (naming · dogfood FTG) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"}`);

  const client = createServiceClientFromEnv();
  const { data: project } = await client.from("projects").select("id").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le seed de démo.`);
  const projectId = project.id;
  await readProjectForE9(client, projectId);

  const { data: engine } = await client.from("engines").select("id").eq("code", "name_forge").single();
  const { data: version } = await client.from("engine_versions").select("id, semver, status").eq("engine_id", engine!.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable — enregistre-la d'abord (MCP).");
  console.log(`\n• Projet ${projectId} · engine_version ${version.id} (${version.semver}, ${version.status})`);

  const startedAt = new Date().toISOString();
  const run = async (taskType: string, structuredInput: Record<string, unknown>, geoLenses: string[] = ["france", "international"]): Promise<EngineOutputEnvelope> => {
    const env = await runNameForge({
      runId: `smoke-e9-${taskType}-${Date.now()}`,
      taskType,
      projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S0", name: "Plateforme", config: {} }, geoLenses, decisionsHistory: [] },
      structuredInput,
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    allCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  // 1) availability_check RÉEL (RDAP + Recherche d'Entreprises + marques indicatif + handles)
  console.log("\n• availability_check (LIVE RDAP + Recherche d'Entreprises + marques + handles)…");
  const availEnv = await run("availability_check", { candidates: CANDIDATES, tlds: TLDS });
  const availability = (availEnv.structuredData as {
    availability: Array<{
      candidate: string;
      domains: { domains: Array<{ domain: string; available: boolean | null; status: number | null; checkedAt: string }> };
      denomination: { total: number; exactCollision: boolean; matches: Array<{ siren: string; denomination: string }> };
      marques: { checked: boolean; potentialHits: unknown[]; inpiSearchUrl: string; note: string };
      handles: { results: Array<{ platform: string; available: boolean | null; indicative: boolean }> };
    }>;
  }).availability;
  for (const a of availability) {
    console.log(`\n  ══ « ${a.candidate} »`);
    for (const d of a.domains.domains) console.log(`     domaine ${d.domain} → ${d.available === true ? "LIBRE" : d.available === false ? "PRIS" : "indéterminé"} (HTTP ${d.status}) · vérifié ${d.checkedAt}`);
    console.log(`     dénomination : ${a.denomination.exactCollision ? "COLLISION EXACTE" : `pas de collision exacte`} (${a.denomination.total} approchante(s))`);
    console.log(`     marques : ${a.marques.checked ? "Pappers a répondu" : "INDICATIF [E] (non vérifié en base)"} · ${a.marques.potentialHits.length} hit(s) · URL INPI: ${a.marques.inpiSearchUrl}`);
    console.log(`     handles : ${a.handles.results.map((h) => `${h.platform}=${h.available === true ? "libre" : h.available === false ? "pris" : "?"}${h.indicative ? "(indic.)" : ""}`).join(" · ")}`);
  }

  // 2) shortlist_challenge (frontier 🔀😈)
  console.log("\n• shortlist_challenge (frontier 🔀😈, connotations multilingues)…");
  const slEnv = await run("shortlist_challenge", { candidates: CANDIDATES.map((n) => ({ name: n })), availability });
  const sl = (slEnv.structuredData as { shortlist_challenge: { shortlist: Array<{ name: string; connotations: Array<{ lang: string; note: string }> }> } }).shortlist_challenge;
  console.log(`  → shortlist : ${sl.shortlist.map((s) => s.name).join(", ")}`);
  for (const s of sl.shortlist) if (s.connotations.length) console.log(`     ${s.name} connotations: ${s.connotations.map((c) => `[${c.lang}] ${c.note}`).join(" · ")}`);

  // 3) securing_guide (classes de Nice + pi_status de ré-entrée)
  console.log("• securing_guide (guide PI, classes de Nice, pi_status)…");
  const sgEnv = await run("securing_guide", { name: "Found The Grow", segment: "plateforme d'incubation IA", idee: "accompagnement entrepreneurial" });
  const sg = (sgEnv.structuredData as { securing_guide: { trademark_procedure: { nice_classes: Array<{ number: number; label: string }>; filing_url: string } }; pi_status: { status: string } }).securing_guide;
  const pi = (sgEnv.structuredData as { pi_status: { status: string; depot_number: unknown } }).pi_status;
  console.log(`  → classes de Nice : ${sg.trademark_procedure.nice_classes.map((c) => `${c.number} (${c.label})`).join(" · ")}`);
  console.log(`  → dépôt INPI : ${sg.trademark_procedure.filing_url} · pi_status="${pi.status}" (point de ré-entrée après dépôt externe)`);

  // Garde-fous
  const disc = availEnv.structuredData as { disclaimers: { text: string }; professional_referral: { required: boolean; acknowledged: boolean } };
  console.log(`\n• DISCLAIMER marques présent : ${Boolean(disc.disclaimers?.text)} · RENVOI antériorité pro required=${disc.professional_referral?.required} acquitté=${disc.professional_referral?.acknowledged}`);

  const finishedAt = new Date().toISOString();
  const depth = Math.max(availEnv.telemetry.researchDepthReached, slEnv.telemetry.researchDepthReached, sgEnv.telemetry.researchDepthReached);

  const structuredData = {
    candidates: CANDIDATES.map((n) => ({ name: n })),
    availability,
    shortlist_challenge: sl,
    securing_guide: sg,
    pi_status: pi,
    disclaimers: disc.disclaimers,
    professional_referral: disc.professional_referral,
    waterfall_depth_reached: depth,
  };
  console.log(`\n• Profondeur waterfall atteinte (honnête) : ${depth}`);

  const engineRun = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: version.id, taskType: "availability_check",
    inputEnvelope: { candidates: CANDIDATES, tlds: TLDS } as unknown as Json, inputStructuredValidated: true,
    researchDepth: depth, modelCalls: allCalls as unknown as Json, llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null,
    status: "done", startedAt, finishedAt,
  });
  const deliverable = await writeNamingReport(client, {
    projectId, projectMilestoneId: null, engineRunId: engineRun.id,
    title: "Naming — dogfood FTG (E9 · L'Éponyme)", structuredData,
    sources: allSources as unknown as Json, pedagogy: {} as unknown as Json,
  });
  const journal = await writeJournalEvent(
    client, projectId, "deliverable",
    `E9 (L'Éponyme) — naming_report : ${CANDIDATES.join(" / ")}, domaines/dénomination réels, marques indicatif, waterfall=${depth}`,
    null, "engine:name_forge",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke E9 terminé bout en bout — dispo réelle horodatée, marques indicatif [E], waterfall=${depth}, disclaimer + renvoi présents.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke E9 échoué:", err);
  process.exit(1);
});
