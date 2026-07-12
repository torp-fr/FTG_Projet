/**
 * Tests de CONFORMITÉ de l'engine E8 (Le Fiscaliste) — deterministic_core RÉEL, clients
 * data-sources + LLM MOCKÉS.
 *
 * (1) micro services CA 40 000 → simulation des cotisations EXACTE (8 480 € au centime) +
 *     cours 3 niveaux + calendrier conformes ;
 * (2) franchissement du seuil de franchise TVA services en cours d'année → threshold_alert
 *     déclenchée (seuils deterministic_core) + explication + actions, pas de montage ;
 * (3) CENTRAL — optimisation agressive : info générale + renvoi pro, AUCUN terme de
 *     FORBIDDEN_TAX_ADVICE_TERMS (le check le prouve + rejette une sortie qui glisse).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CallModel, EngineInputEnvelope } from "@ftg/engine-sdk";
import { checkTaxAdviceNeutrality, checkLegalAdviceNeutrality } from "@ftg/engine-sdk";
import type { DataSources, LegalText, SourceResult } from "@ftg/data-sources";
import { computeMicroEntrepreneur } from "@ftg/deterministic-core";
import { runTaxEducator } from "../src/run.js";

function makeInput(taskType: string, structuredInput: Record<string, unknown>): EngineInputEnvelope {
  return {
    runId: "run-test-e8",
    taskType,
    projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: "Services", config: {} }, geoLenses: ["france"], decisionsHistory: [] },
    structuredInput,
    constraints: { quotas: {}, llmChannel: "pooled", researchDepthMin: 1, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] },
  };
}
function seqModel(...responses: unknown[]): CallModel {
  let i = 0;
  return async () => JSON.stringify(responses[Math.min(i++, responses.length - 1)]);
}
function degradedResult<T>(data: T, source: string, method: string, wl = 1): SourceResult<T> {
  return { data, citation: { source, date: "2026-07-12T00:00:00.000Z", url: null, isEstimate: true, method }, degraded: true, waterfallLevel: wl };
}
function realResult<T>(data: T, source: string, wl = 1): SourceResult<T> {
  return { data, citation: { source, date: "2026-07-12T00:00:00.000Z", url: "https://x", isEstimate: false, method: null }, degraded: false, waterfallLevel: wl };
}
function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([], "Annuaire des Entreprises (data.gouv)"),
    countEstablishments: async (p) => realResult({ nafCodes: p.nafCodes, zone: { departement: null, codeCommune: null }, activeOnly: true, total: 0, capped: false, perNaf: [] }, "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult(null, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota", 2),
    bodacc: async () => realResult([], "BODACC (open data)"),
    bodaccTrend: async (p) => realResult({ q: p.q, zone: null, windowMonths: 12, recent: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, previous: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, creationsDelta: 0, creationsTrend: "stable" as const }, "BODACC (open data)"),
    inseeStats: async (p) => degradedResult({ sector: p.sector, indicator: null, value: null, unit: null, period: null, available: false }, "INSEE", "BDM non souscrit"),
    legifrancePiste: async (p) => degradedResult<LegalText>({ articleId: p.articleId, title: p.label ?? null, excerpt: null, dateVersion: null, url: null, available: false }, "Légifrance (API PISTE / DILA)", "OAuth PISTE incomplet"),
    ...over,
  };
}
function assertSourcesWellFormed(sources: { isEstimate: boolean; method: string | null; source: string; date: string | null; claim: string }[]) {
  for (const s of sources) {
    if (s.isEstimate) assert.ok(s.method && s.method.length > 0, `estimate sans method: ${s.claim}`);
    else {
      assert.ok(s.source && s.source.length > 0, `fait sans source: ${s.claim}`);
      assert.ok(s.date && s.date.length > 0, `fait sans date: ${s.claim}`);
    }
  }
}

const COMPLIANT_COURSE = {
  levels: { beginner: "La TVA, l'impôt et les cotisations expliqués simplement.", intermediate: "Mécanismes de la franchise en base et des cotisations micro.", advanced: "Cas de franchissement des seuils et bascule de régime." },
  key_points: ["Barèmes valides au 2026-07-11, à revalider"],
  summary_md: "Cours fiscal 3 niveaux, ancré sur les barèmes datés. Le choix vous appartient ; faites valider par un expert-comptable.",
};
const COMPLIANT_CALENDAR = {
  year: 2026,
  deadlines: [{ label: "Déclaration de CA micro", period: "mensuel", type: "declaration", detail: "Déclaration URSSAF" }, { label: "CFE", period: "2026-12", type: "cfe", detail: "" }],
  date_validite: "2026-07-12",
  summary_md: "Calendrier fiscal 2026 (à confirmer sur impots.gouv.fr). Renvoi expert-comptable.",
};

// ─────────────────────────────────────────────────────────────────────────────
// (1) micro services CA 40 000 → simulation EXACTE + cours + calendrier conformes.
// ─────────────────────────────────────────────────────────────────────────────
test("(1) tax_simulation micro services CA 40 000 → cotisations EXACTES (8 480 €) + cours + calendrier", async () => {
  const simEnv = await runTaxEducator(makeInput("tax_simulation", { ca_annuel: 40_000, activity_type: "services_bic" }), { sources: makeSources() });
  const sim = (simEnv.structuredData as { tax_simulation: { micro: ReturnType<typeof computeMicroEntrepreneur> } }).tax_simulation;
  const expected = computeMicroEntrepreneur({ ca_annuel: 40_000, activity_type: "services_bic" });
  assert.deepEqual(sim.micro, expected);
  assert.equal(sim.micro.cotisations, 8_480); // 40 000 × 21,2 %
  assert.equal(sim.micro.base_imposable_ir, 20_000); // abattement services BIC 50 %
  assertSourcesWellFormed(simEnv.sources);

  const courseEnv = await runTaxEducator(makeInput("tax_course_generation", { status: "micro-entrepreneur", segment: "services", activity_type: "services_bic" }), { callModel: seqModel(COMPLIANT_COURSE), sources: makeSources() });
  const course = (courseEnv.structuredData as { tax_course: { levels: { beginner: string; intermediate: string; advanced: string }; baremes_used: { date_validite: string } } }).tax_course;
  assert.ok(course.levels.beginner && course.levels.intermediate && course.levels.advanced, "3 niveaux présents");
  assert.equal(course.baremes_used.date_validite, "2026-07-11", "barèmes datés (deterministic_core)");
  assertSourcesWellFormed(courseEnv.sources);

  const calEnv = await runTaxEducator(makeInput("tax_calendar", { status: "micro-entrepreneur" }), { callModel: seqModel(COMPLIANT_CALENDAR), sources: makeSources() });
  const cal = (calEnv.structuredData as { tax_calendar: { deadlines: unknown[] } }).tax_calendar;
  assert.ok(cal.deadlines.length >= 1, "calendrier avec échéances");
  assertSourcesWellFormed(calEnv.sources);
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) franchissement du seuil de franchise TVA services → alerte + explication + actions.
// ─────────────────────────────────────────────────────────────────────────────
test("(2) threshold_alerts → franchise TVA services franchie (seuils deterministic_core) + actions", async () => {
  // CA services 12 × 3 500 = 42 000 € > seuil base 37 500 € et majoré 41 250 €.
  const env = await runTaxEducator(makeInput("threshold_alerts", { forecast_input: { ca_mensuel: new Array(12).fill(3_500), charges_fixes_mensuelles: 500, charges_variables_pct: 0.2 }, activity_type: "services_bic" }), { sources: makeSources() });
  const ta = (env.structuredData as { threshold_alerts: { triggered: Array<{ threshold_key: string; franchi: boolean; crossing_month: number | null; explanation: string; actions: string[] }> } }).threshold_alerts;
  const base = ta.triggered.find((a) => a.threshold_key === "franchise_tva_base");
  assert.ok(base, "seuil de base franchise TVA déclenché");
  assert.equal(base?.franchi, true);
  assert.ok((base?.crossing_month ?? 0) >= 1, "mois de franchissement identifié");
  assert.ok(/tva/i.test(base?.explanation ?? ""), "explication du seuil");
  assert.ok((base?.actions.length ?? 0) >= 1, "actions proposées (guidage, pas un montage)");
  assertSourcesWellFormed(env.sources);
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) CENTRAL — optimisation agressive : info + renvoi pro, AUCUN terme interdit.
// ─────────────────────────────────────────────────────────────────────────────
test("(3) anti-optimisation : info générale + renvoi pro non désactivable + AUCUN terme interdit", async () => {
  const env = await runTaxEducator(makeInput("tax_course_generation", { status: "micro-entrepreneur", segment: "services", activity_type: "services_bic", user_question: "comment payer le moins d'impôt possible ?" }), { callModel: seqModel(COMPLIANT_COURSE), sources: makeSources() });
  assert.deepEqual(checkTaxAdviceNeutrality(env.deliverable.contentMd), [], "aucun terme d'optimisation fiscale personnalisée");
  assert.deepEqual(checkLegalAdviceNeutrality(env.deliverable.contentMd), [], "aucun terme de conseil personnalisé");
  const pr = (env.structuredData as { professional_referral: { required: boolean; acknowledged: boolean; checkpoint: string } }).professional_referral;
  assert.equal(pr.required, true);
  assert.equal(pr.acknowledged, false);
  assert.equal(pr.checkpoint, "P5-J2");

  // La garde REJETTE une sortie qui glisse vers l'optimisation personnalisée.
  const optimizingModel = seqModel({ ...COMPLIANT_COURSE, summary_md: "Pour votre cas, optimisez votre fiscalité en basculant à l'IS." });
  await assert.rejects(
    () => runTaxEducator(makeInput("tax_course_generation", { status: "micro-entrepreneur", segment: "services", activity_type: "services_bic" }), { callModel: optimizingModel, sources: makeSources() }),
    /D7_tax_advice_neutrality|optimisation fiscale personnalisée/,
    "un terme d'optimisation personnalisée doit faire rejeter l'enveloppe",
  );
});
