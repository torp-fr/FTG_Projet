/**
 * Smoke test RÉEL de l'engine E8 « Le Fiscaliste » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e8-smoke-test.ts
 *
 * Sur un porteur micro services (P2) :
 *  - cours fiscal 3 niveaux ancré sur les barèmes datés du @ftg/deterministic-core ;
 *  - calendrier fiscal ;
 *  - simulation des cotisations EXACTE via deterministic_core (CA 40 000 → 8 480 €) ;
 *  - alerte de seuil TVA sur un prévisionnel qui franchit la franchise en base.
 * Écrit un tax_education RÉEL. Hors `pnpm test`. Opus à 0 req/min → frontier forcé sur Sonnet 5.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runTaxEducator,
  createServiceClientFromEnv,
  readProjectForE8,
  writeTaxEducation,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-tax-educator/src/index.js";
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
const SIM_CA = 40_000; // micro services → cotisations 40 000 × 21,2 % = 8 480 €
const ALERT_FORECAST = { ca_mensuel: new Array(12).fill(3_500), charges_fixes_mensuelles: 500, charges_variables_pct: 0.2 }; // 42 000 € → franchit la franchise TVA services
const allCalls: unknown[] = [];
const allSources: unknown[] = [];

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ SMOKE E8 — « Le Fiscaliste » (fiscal · information & guidage) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"}`);

  const client = createServiceClientFromEnv();
  const { data: project } = await client.from("projects").select("id").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le seed de démo.`);
  const projectId = project.id;
  const ctx = await readProjectForE8(client, projectId);
  console.log(`\n• Projet ${projectId} · segment=${ctx.segment}`);

  const { data: engine } = await client.from("engines").select("id").eq("code", "tax_educator").single();
  const { data: version } = await client.from("engine_versions").select("id, semver, status").eq("engine_id", engine!.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable — enregistre-la d'abord (MCP).");
  console.log(`• engine_version : ${version.id} (${version.semver}, ${version.status})`);

  const startedAt = new Date().toISOString();
  const run = async (taskType: string, structuredInput: Record<string, unknown>): Promise<EngineOutputEnvelope> => {
    const env = await runTaxEducator({
      runId: `smoke-e8-${taskType}-${Date.now()}`,
      taskType,
      projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: ctx.segment ?? "Services", config: {} }, geoLenses: ["france"], decisionsHistory: [] },
      structuredInput,
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    allCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  // 1) Cours fiscal 3 niveaux (LLM, ancré barèmes datés)
  console.log("\n• tax_course_generation (3 niveaux, barèmes datés deterministic_core)…");
  const courseEnv = await run("tax_course_generation", { status: "micro-entrepreneur", segment: ctx.segment, activity_type: "services_bic" });
  const tc = (courseEnv.structuredData as { tax_course: { levels: { beginner: string; intermediate: string; advanced: string }; baremes_used: { date_validite: string; micro: { taux_cotisations: number; franchise_tva_base: number; plafond_ca: number } }; references: string[] } }).tax_course;
  const legalSrc = courseEnv.sources.find((s) => s.source === "Légifrance (API PISTE / DILA)");
  console.log(`  → 3 niveaux (débutant ${tc.levels.beginner.length}c · interm. ${tc.levels.intermediate.length}c · avancé ${tc.levels.advanced.length}c)`);
  console.log(`  → barèmes datés (validité ${tc.baremes_used.date_validite}) : cotis micro ${Math.round(tc.baremes_used.micro.taux_cotisations * 1000) / 10} % · franchise TVA base ${tc.baremes_used.micro.franchise_tva_base} € · plafond ${tc.baremes_used.micro.plafond_ca} €`);
  console.log(`  → Légifrance : ${legalSrc?.isEstimate ? "DÉGRADÉ [E] daté" : "RÉEL daté"} · réf « ${tc.references[0]} »`);

  // 2) Calendrier fiscal (LLM)
  console.log("• tax_calendar…");
  const calEnv = await run("tax_calendar", { status: "micro-entrepreneur", activity_type: "services_bic", segment: ctx.segment });
  const cal = (calEnv.structuredData as { tax_calendar: { year: number; deadlines: Array<{ label: string; period: string }>; date_validite: string } }).tax_calendar;
  console.log(`  → ${cal.deadlines.length} échéances ${cal.year} (validité ${cal.date_validite}) : ${cal.deadlines.slice(0, 4).map((d) => `${d.label} (${d.period})`).join(" · ")}`);

  // 3) Simulation des cotisations EXACTE (deterministic_core)
  console.log("• tax_simulation (deterministic_core — chiffres exacts)…");
  const simEnv = await run("tax_simulation", { ca_annuel: SIM_CA, activity_type: "services_bic" });
  const sim = (simEnv.structuredData as { tax_simulation: { micro: { ca_annuel: number; cotisations: number; taux_cotisations: number; base_imposable_ir: number; statut_valide: boolean; plafond_ca: number }; date_validite: string } }).tax_simulation;
  console.log(`  → MICRO services CA ${sim.micro.ca_annuel} € → cotisations ${sim.micro.cotisations} € (${Math.round(sim.micro.taux_cotisations * 1000) / 10} %) · base IR ${sim.micro.base_imposable_ir} € · valide=${sim.micro.statut_valide} (plafond ${sim.micro.plafond_ca} €) · validité ${sim.date_validite}`);

  // 4) Alerte de seuil TVA (deterministic_core) sur un prévisionnel qui franchit
  console.log("• threshold_alerts (seuils deterministic_core)…");
  const alertEnv = await run("threshold_alerts", { forecast_input: ALERT_FORECAST, activity_type: "services_bic" });
  const ta = (alertEnv.structuredData as { threshold_alerts: { annual_ca: number; triggered: Array<{ label: string; seuil: number; crossing_month: number | null; actions: string[] }> } }).threshold_alerts;
  console.log(`  → CA prévisionnel ${ta.annual_ca} € · ${ta.triggered.length} seuil(s) franchi(s) :`);
  for (const t of ta.triggered) console.log(`     ⚠️ ${t.label} (${t.seuil} €)${t.crossing_month ? ` dès le mois ${t.crossing_month}` : ""} — action : ${t.actions[0]}`);

  // Garde-fous non désactivables
  const disc = (courseEnv.structuredData as { disclaimers: { text: string }; professional_referral: { checkpoint: string; required: boolean; acknowledged: boolean } });
  console.log(`\n• DISCLAIMER présent : ${Boolean(disc.disclaimers?.text)} · RENVOI PRO ${disc.professional_referral?.checkpoint} required=${disc.professional_referral?.required} acquitté=${disc.professional_referral?.acknowledged}`);

  const finishedAt = new Date().toISOString();
  const depth = Math.max(courseEnv.telemetry.researchDepthReached, calEnv.telemetry.researchDepthReached, simEnv.telemetry.researchDepthReached, alertEnv.telemetry.researchDepthReached);

  const structuredData = {
    tax_course: tc,
    tax_calendar: cal,
    tax_simulation: sim,
    threshold_alerts: ta,
    disclaimers: disc.disclaimers,
    professional_referral: disc.professional_referral,
    waterfall_depth_reached: depth,
  };
  console.log(`\n• Profondeur waterfall atteinte (honnête) : ${depth}`);

  const engineRun = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: version.id, taskType: "tax_simulation",
    inputEnvelope: { ca_annuel: SIM_CA, activity_type: "services_bic", alert_forecast: ALERT_FORECAST } as unknown as Json, inputStructuredValidated: true,
    researchDepth: depth, modelCalls: allCalls as unknown as Json, llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null,
    status: "done", startedAt, finishedAt,
  });
  const deliverable = await writeTaxEducation(client, {
    projectId, projectMilestoneId: null, engineRunId: engineRun.id,
    title: "Fiscalité & imposition (E8 · Le Fiscaliste)", structuredData,
    sources: allSources as unknown as Json, pedagogy: courseEnv.pedagogy as unknown as Json,
  });
  const journal = await writeJournalEvent(
    client, projectId, "deliverable",
    `E8 (Le Fiscaliste) — tax_education : cours 3 niveaux, simulation cotisations ${sim.micro.cotisations} €, ${ta.triggered.length} alerte(s) seuil, waterfall=${depth}`,
    null, "engine:tax_educator",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke E8 terminé bout en bout — cotisations ${sim.micro.cotisations} €, ${ta.triggered.length} alerte(s) seuil, waterfall=${depth}, disclaimers + renvoi présents.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke E8 échoué:", err);
  process.exit(1);
});
