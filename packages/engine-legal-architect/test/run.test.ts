/**
 * Tests de CONFORMITÉ de l'engine E7 (L'Architecte) — deterministic_core RÉEL, clients
 * data-sources + LLM MOCKÉS.
 *
 * Exécution : `pnpm --filter @ftg/engine-legal-architect test`
 *
 * (1) les 3 simulations = sortie EXACTE du deterministic_core (golden values, au centime) ;
 * (2) segment artisanat → checklist inclut qualification + assurances en dépendances dures ;
 * (3) CENTRAL — demande « quel statut me conseilles-tu ? » : comparatif factuel + « le choix
 *     vous appartient » + renvoi pro acquitté, et AUCUN terme de conseil personnalisé (le
 *     check le prouve, et rejette une sortie fautive).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CallModel, EngineInputEnvelope } from "@ftg/engine-sdk";
import { checkLegalAdviceNeutrality } from "@ftg/engine-sdk";
import type { DataSources, EstablishmentInfo, LegalText, SourceResult } from "@ftg/data-sources";
import { calculateForecast, compareStatuses } from "@ftg/deterministic-core";
import { runLegalArchitect } from "../src/run.js";

function makeInput(taskType: string, structuredInput: Record<string, unknown>): EngineInputEnvelope {
  return {
    runId: "run-test-e7",
    taskType,
    projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: "Artisanat", config: {} }, geoLenses: ["france"], decisionsHistory: [] },
    structuredInput,
    constraints: { quotas: {}, llmChannel: "pooled", researchDepthMin: 1, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] },
  };
}

function seqModel(...responses: unknown[]): CallModel {
  let i = 0;
  return async () => JSON.stringify(responses[Math.min(i++, responses.length - 1)]);
}
function realResult<T>(data: T, source: string, wl = 1): SourceResult<T> {
  return { data, citation: { source, date: "2026-07-12T00:00:00.000Z", url: "https://x", isEstimate: false, method: null }, degraded: false, waterfallLevel: wl };
}
function degradedResult<T>(data: T, source: string, method: string, wl = 1): SourceResult<T> {
  return { data, citation: { source, date: "2026-07-12T00:00:00.000Z", url: null, isEstimate: true, method }, degraded: true, waterfallLevel: wl };
}

const ESTAB: EstablishmentInfo = { siret: "13002526500013", denomination: "TEST", naf: "43.32A", commune: "PARIS", codePostal: "75001", dateCreation: "2010-01-01", etat: "A" };

function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([], "Annuaire des Entreprises (data.gouv)"),
    countEstablishments: async (p) => realResult({ nafCodes: p.nafCodes, zone: { departement: null, codeCommune: null }, activeOnly: true, total: 0, capped: false, perNaf: [] }, "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult(ESTAB, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota", 2),
    bodacc: async () => realResult([], "BODACC (open data)"),
    bodaccTrend: async (p) => realResult({ q: p.q, zone: null, windowMonths: 12, recent: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, previous: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, creationsDelta: 0, creationsTrend: "stable" as const }, "BODACC (open data)"),
    inseeStats: async (p) => degradedResult({ sector: p.sector, indicator: null, value: null, unit: null, period: null, available: false }, "INSEE", "BDM non souscrit"),
    legifrancePiste: async (p) => degradedResult<LegalText>({ articleId: p.articleId, title: p.label ?? null, excerpt: null, dateVersion: null, url: null, available: false }, "Légifrance (API PISTE / DILA)", "OAuth PISTE incomplet"),
    rdapDomains: async (p) => realResult({ name: p.name, label: p.name.toLowerCase(), domains: [] }, "RDAP (registres de noms de domaine)"),
    inpiMarques: async (p) => realResult({ query: p.query, source: "indicatif", checked: false, potentialHits: [], inpiSearchUrl: "https://data.inpi.fr", checkedAt: "2026-07-12T00:00:00.000Z", note: "indicatif" }, "Marques — vérification manuelle INPI requise"),
    socialHandles: async (p) => realResult({ handle: p.handle, results: [] }, "Handles réseaux sociaux (best-effort)"),
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

const FORECAST_INPUT = { ca_mensuel: new Array(12).fill(5_000), charges_fixes_mensuelles: 1_000, charges_variables_pct: 0.3 };
const COMPLIANT_PEDAGOGY = {
  pedagogy_md: "Voici un comparatif factuel des trois statuts sur votre prévisionnel. Chacun a ses critères (protection sociale, coût, TVA). Le choix vous appartient ; faites valider par un professionnel.",
  criteria_md: "Protection sociale, coût de structure, TVA, transmission.",
  imprecision_notes: ["rémunération du dirigeant non modélisée (société IS)", "EI au réel : approximatif — ordre de grandeur"],
};

// ─────────────────────────────────────────────────────────────────────────────
// (1) prévisionnel donné → les 3 simulations = sortie EXACTE du deterministic_core.
// ─────────────────────────────────────────────────────────────────────────────
test("(1) status_comparator → comparaison = sortie EXACTE du deterministic_core (au centime)", async () => {
  const env = await runLegalArchitect(makeInput("status_comparator", { forecast_input: FORECAST_INPUT, activity_type: "services_bic" }), {
    callModel: seqModel(COMPLIANT_PEDAGOGY),
    sources: makeSources(),
  });
  const expected = compareStatuses(calculateForecast(FORECAST_INPUT), "services_bic", { distribution_dividendes: true });
  const sd = env.structuredData as { status_comparison: { comparison: typeof expected } };
  // Réutilise les golden values du deterministic_core, au centime.
  assert.deepEqual(sd.status_comparison.comparison, expected);
  assert.equal(sd.status_comparison.comparison.micro_entrepreneur.cotisations, 12_720); // 60 000 × 21,2 %
  assert.equal(sd.status_comparison.comparison.societe_is.is_total, 4_500); // 30 000 × 15 %
  assert.equal(sd.status_comparison.comparison.societe_is.pfu_dividendes, 8_007); // 25 500 × 31,4 %
  assert.equal(sd.status_comparison.comparison.societe_is.net_porteur, 17_493);
  assertSourcesWellFormed(env.sources);
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) segment artisanat → checklist inclut qualification + assurances en dép. dures.
// ─────────────────────────────────────────────────────────────────────────────
test("(2) regulatory_checklist artisanat → qualification + assurances en dépendances dures", async () => {
  const checklistResponse = { items: [{ obligation: "Déclaration d'activité", type: "declaration", hard_dependency: false }], hard_dependencies: [], summary_md: "Checklist factuelle, renvoi professionnel." };
  const env = await runLegalArchitect(makeInput("regulatory_checklist", { segment: "Artisanat / menuiserie", activity: "atelier de menuiserie", is_artisanat: true }), {
    callModel: seqModel(checklistResponse),
    sources: makeSources(),
  });
  const sd = env.structuredData as { regulatory_checklist: { hard_dependencies: string[]; items: Array<{ obligation: string; hard_dependency: boolean }> } };
  const hd = sd.regulatory_checklist.hard_dependencies.join(" | ").toLowerCase();
  assert.ok(/qualification/.test(hd), "qualification en dépendance dure");
  assert.ok(/assurance/.test(hd), "assurances en dépendance dure");
  assert.ok(sd.regulatory_checklist.items.some((i) => /qualification/i.test(i.obligation) && i.hard_dependency), "item qualification marqué hard");
  assert.ok(sd.regulatory_checklist.items.some((i) => /assurance/i.test(i.obligation) && i.hard_dependency), "item assurance marqué hard");
  assertSourcesWellFormed(env.sources);
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) CENTRAL — « quel statut me conseilles-tu ? » : comparatif factuel + « le choix vous
//     appartient » + renvoi pro acquitté, AUCUN terme de conseil personnalisé ; et la
//     garde REJETTE une sortie fautive.
// ─────────────────────────────────────────────────────────────────────────────
test("(3) anti-conseil : livrable factuel + renvoi pro non désactivable + AUCUN terme interdit", async () => {
  const env = await runLegalArchitect(makeInput("status_comparator", { forecast_input: FORECAST_INPUT, activity_type: "services_bic", user_question: "quel statut me conseilles-tu ?" }), {
    callModel: seqModel(COMPLIANT_PEDAGOGY),
    sources: makeSources(),
  });
  // Le livrable ne contient AUCUN terme de conseil personnalisé (le check le prouve).
  assert.deepEqual(checkLegalAdviceNeutrality(env.deliverable.contentMd), []);
  assert.ok(/le choix vous appartient/i.test(env.deliverable.contentMd), "« le choix vous appartient » présent");
  const pr = (env.structuredData as { professional_referral: { required: boolean; acknowledged: boolean; checkpoint: string } }).professional_referral;
  assert.equal(pr.required, true, "renvoi professionnel non désactivable");
  assert.equal(pr.acknowledged, false, "à acquitter (a consulté / choisit de ne pas consulter)");
  assert.equal(pr.checkpoint, "P5-J2");

  // La garde REJETTE une sortie qui glisserait vers le conseil personnalisé.
  const advisingModel = seqModel({ ...COMPLIANT_PEDAGOGY, pedagogy_md: "Pour votre cas, je vous conseille le statut micro-entrepreneur." });
  await assert.rejects(
    () => runLegalArchitect(makeInput("status_comparator", { forecast_input: FORECAST_INPUT, activity_type: "services_bic" }), { callModel: advisingModel, sources: makeSources() }),
    /D7_legal_advice_neutrality|conseil juridique personnalisé/,
    "un terme de conseil personnalisé doit faire rejeter l'enveloppe",
  );
});
