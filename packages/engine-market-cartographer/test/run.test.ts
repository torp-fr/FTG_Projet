/**
 * Tests de CONFORMITÉ D'ENVELOPPE de l'engine E4 (Le Cartographe) — LLM ET sources MOCKÉS.
 *
 * Exécution : `pnpm --filter @ftg/engine-market-cartographer test`
 *
 * Zéro réseau : on injecte de faux clients @ftg/data-sources + un faux callModel. On
 * vérifie la conformité (validateOutputEnvelope), le sourcing bien formé, la discipline
 * [E] du sizing (jamais un chiffre nu présenté comme fait), le verdict à double face,
 * et la dégradation propre quand une source échoue.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CallModel, EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import type { DataSources, MarketDensity, SourceResult } from "@ftg/data-sources";
import { runMarketCartographer } from "../src/run.js";

function makeInput(taskType: string, structuredInput: Record<string, unknown>): EngineInputEnvelope {
  return {
    runId: "run-test-e4",
    taskType,
    projectContext: {
      canonicalState: {},
      dependencyDigests: [],
      founderProfile: {},
      segmentProfile: { code: "S4", name: "Artisanat", config: {} },
      geoLenses: ["france"],
      decisionsHistory: [],
    },
    structuredInput,
    constraints: { quotas: {}, llmChannel: "pooled", researchDepthMin: 1, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] },
  };
}

/** Faux callModel séquentiel (renvoie les réponses canées dans l'ordre des appels). */
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

function density(total: number, capped = false): MarketDensity {
  return {
    nafCodes: ["43.32A", "16.23Z"],
    zone: { departement: "17", codeCommune: null },
    activeOnly: true,
    total,
    capped,
    perNaf: [
      { naf: "43.32A", total: Math.round(total * 0.7), capped },
      { naf: "16.23Z", total: Math.round(total * 0.3), capped: false },
    ],
  };
}

/** DataSources mocké complet ; seules countEstablishments/inseeStats/bodaccTrend servent à E4. */
function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([], "Annuaire des Entreprises (data.gouv)"),
    countEstablishments: async () => realResult(density(1611), "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult(null, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota", 2),
    bodacc: async () => realResult([], "BODACC (open data)"),
    bodaccTrend: async (p) => realResult({ q: p.q, zone: p.departement ?? null, windowMonths: 12, recent: { from: "2025-07-12", to: "2026-07-12", creations: 25, proceduresCollectives: 71 }, previous: { from: "2024-07-12", to: "2025-07-12", creations: 38, proceduresCollectives: 60 }, creationsDelta: -13, creationsTrend: "baisse" as const }, "BODACC (open data)"),
    inseeStats: async (p) => degradedResult({ sector: p.sector, indicator: null, value: null, unit: null, period: null, available: false }, "INSEE (statistiques macro-sectorielles — BDM / comptes du commerce)", "BDM non souscrit — sizing macro en [E]"),
    legifrancePiste: async (p) => degradedResult({ articleId: p.articleId, title: p.label ?? null, excerpt: null, dateVersion: null, url: null, available: false }, "Légifrance (API PISTE / DILA)", "OAuth PISTE non configuré"),
    rdapDomains: async (p) => realResult({ name: p.name, label: p.name.toLowerCase(), domains: [] }, "RDAP (registres de noms de domaine)"),
    inpiMarques: async (p) => realResult({ query: p.query, source: "indicatif", checked: false, potentialHits: [], inpiSearchUrl: "https://data.inpi.fr", checkedAt: "2026-07-12T00:00:00.000Z", note: "indicatif" }, "Marques — vérification manuelle INPI requise"),
    socialHandles: async (p) => realResult({ handle: p.handle, results: [] }, "Handles réseaux sociaux (best-effort)"),
    ...over,
  };
}

/** Contrat A5.4 : chaque source est sourcée (source+date) ou marquée is_estimate + method. */
function assertSourcesWellFormed(env: EngineOutputEnvelope) {
  for (const s of env.sources) {
    if (s.isEstimate) assert.ok(s.method && s.method.length > 0, `estimate sans method: ${s.claim}`);
    else {
      assert.ok(s.source && s.source.length > 0, `fait sans source: ${s.claim}`);
      assert.ok(s.date && s.date.length > 0, `fait sans date: ${s.claim}`);
    }
  }
}

const SCOPE = { keywords: "menuiserie", naf_codes: [{ code: "43.32A", label: "Menuiserie bois/PVC" }, { code: "16.23Z", label: "Fabrication menuiseries" }], departement: "17", code_commune: null };

const SIZING_RESPONSE = {
  tam: { value: 1611, unit: "établissements", method: "Densité réelle Sirene du secteur sur la zone." },
  sam: { value: 400, unit: "établissements", method: "Sous-ensemble adressable (hypothèse déclarée : 25%)." },
  som: { value: 40, unit: "établissements", method: "Part atteignable court terme (hypothèse déclarée : 10% du SAM)." },
  assumptions: ["Panier moyen non mesuré — hypothèse à valider", "Taux de captation 10% déclaré"],
  sizing_md: "Densité réelle : 1611 établissements actifs (Sirene, dép. 17). TAM 1611 [E], SAM ~400 [E], SOM ~40 [E] selon hypothèses déclarées. som <= sam <= tam.",
};
const VERDICT_RESPONSE = {
  study_md: "Étude assemblée : densité réelle 1611 (Sirene, dép.17), créations en repli (25 vs 38, BODACC daté), sizing [E].",
  attractiveness_verdict: {
    facts_for: ["Densité réelle établie de 1611 établissements actifs (Sirene, dép. 17)", "Tissu d'acteurs dense et implanté"],
    facts_against: ["Créations en repli sur 12 mois (25 vs 38, BODACC daté)", "71 annonces de procédures collectives sur la période récente"],
    arbitrage_method: "Pondérer densité vs dynamique des créations ; une donnée de demande (différée) trancherait.",
    synthese_md: "Marché dense mais dont le flux de créations recule sur la période — lecture équilibrée, sans jugement.",
  },
  challenge: { facts: ["Le repli des créations est daté et réel"], risks: ["Saturation locale possible"], conditions: ["Vérifier la demande adressable (V2)"] },
  next_investigations: [{ title: "Mesurer la demande", description: "Collecter des volumes de recherche (V2)", actions: ["Activer DataForSEO", "Croiser avec la zone de chalandise"] }],
};

// ─────────────────────────────────────────────────────────────────────────────
// (1) Marché local avec densité réelle → sizing [E], verdict double-face, conforme.
// ─────────────────────────────────────────────────────────────────────────────
test("(1) densité réelle → sizing avec [E], verdict d'attractivité à double face, enveloppe conforme", async () => {
  // 1a) market_sizing : densité réelle préservée, TAM/SAM/SOM marqués estimation.
  const sizingEnv = await runMarketCartographer(makeInput("market_sizing", { scope: SCOPE, segment: "Artisanat" }), {
    callModel: seqModel(SIZING_RESPONSE),
    sources: makeSources(),
  });
  const sd = sizingEnv.structuredData as { sizing: { density: MarketDensity; macro: { available: boolean }; tam: { value: number; isEstimate: boolean }; sam: { isEstimate: boolean }; som: { isEstimate: boolean } } };
  // Type d'ÉTAPE (le type final 'market_study' est appliqué à l'écriture DB, cf. writeMarketStudy).
  assert.equal(sizingEnv.deliverable.type, "market_sizing");
  assert.equal(sd.sizing.density.total, 1611, "la densité réelle est préservée telle quelle");
  assert.equal(sd.sizing.macro.available, false, "macro INSEE non connectée → [E]");
  assert.equal(sd.sizing.tam.isEstimate, true, "TAM marqué estimation");
  assert.equal(sd.sizing.sam.isEstimate, true, "SAM marqué estimation");
  assert.equal(sd.sizing.som.isEstimate, true, "SOM marqué estimation");
  assertSourcesWellFormed(sizingEnv);

  // 1b) full_report_assembly : verdict à DOUBLE FACE + challenge + chemin (D25).
  const reportEnv = await runMarketCartographer(makeInput("full_report_assembly", { scope: SCOPE, sizing: sd.sizing }), {
    callModel: seqModel(VERDICT_RESPONSE),
    sources: makeSources(),
  });
  const rsd = reportEnv.structuredData as { attractiveness_verdict: { facts_for: string[]; facts_against: string[] } };
  assert.ok(rsd.attractiveness_verdict.facts_for.length >= 1, "au moins un fait FAVORABLE");
  assert.ok(rsd.attractiveness_verdict.facts_against.length >= 1, "au moins un fait DÉFAVORABLE (double face)");
  assert.ok(reportEnv.challenge && reportEnv.challenge.facts.length >= 1, "challenge 😈 présent");
  assert.ok(reportEnv.solutionPaths.length >= 1, "au moins une investigation (D25)");
  assertSourcesWellFormed(reportEnv);
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) Niche B2B étroite → sizing honnête petit avec [E], PAS de gonflage.
// ─────────────────────────────────────────────────────────────────────────────
test("(2) niche B2B étroite → sizing honnête petit, tout en [E], ordre som<=sam<=tam", async () => {
  const NICHE_SIZING = {
    tam: { value: 12, unit: "établissements", method: "Densité réelle Sirene de la niche (comptage exact)." },
    sam: { value: 6, unit: "établissements", method: "Sous-ensemble adressable (hypothèse déclarée)." },
    som: { value: 2, unit: "établissements", method: "Part atteignable court terme (hypothèse déclarée)." },
    assumptions: ["Marché de niche : densité réelle faible assumée"],
    sizing_md: "Densité réelle : 12 établissements (Sirene). TAM 12 [E], SAM ~6 [E], SOM ~2 [E]. Petit marché assumé, sans gonflage.",
  };
  const env = await runMarketCartographer(makeInput("market_sizing", { scope: SCOPE, segment: "B2B niche" }), {
    callModel: seqModel(NICHE_SIZING),
    sources: makeSources({ countEstablishments: async () => realResult(density(12), "Annuaire des Entreprises (data.gouv)") }),
  });
  const sd = env.structuredData as { sizing: { density: MarketDensity; tam: { value: number; isEstimate: boolean }; sam: { value: number; isEstimate: boolean }; som: { value: number; isEstimate: boolean } } };
  assert.equal(sd.sizing.density.total, 12, "densité réelle faible préservée (pas de gonflage)");
  assert.ok(sd.sizing.tam.isEstimate && sd.sizing.sam.isEstimate && sd.sizing.som.isEstimate, "TAM/SAM/SOM tous en [E]");
  assert.ok((sd.sizing.som.value ?? 0) <= (sd.sizing.sam.value ?? 0) && (sd.sizing.sam.value ?? 0) <= (sd.sizing.tam.value ?? 0), "ordre som<=sam<=tam");
  assertSourcesWellFormed(env);
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) Une source en échec (mock THROW) → dégradation isEstimate+method, pas de crash.
// ─────────────────────────────────────────────────────────────────────────────
test("(3) source en échec (throw) → dégradation isEstimate+method, pas de crash, enveloppe conforme", async () => {
  const env = await runMarketCartographer(makeInput("market_sizing", { scope: SCOPE, segment: "Artisanat" }), {
    callModel: seqModel(SIZING_RESPONSE),
    sources: makeSources({
      countEstablishments: async () => {
        throw new Error("réseau indisponible (HTTP 503)");
      },
    }),
  });
  // Pas de throw ⇒ conforme. La densité est dégradée en [E], le sizing reste produit.
  const sd = env.structuredData as { sizing: { density_degraded: boolean } };
  assert.equal(sd.sizing.density_degraded, true, "la densité en échec est marquée dégradée");
  const densitySource = env.sources.find((s) => s.source === "Annuaire des Entreprises (data.gouv)");
  assert.ok(densitySource, "la citation de densité figure");
  assert.equal(densitySource?.isEstimate, true, "source en échec → isEstimate");
  assert.ok(densitySource?.method && densitySource.method.length > 0, "source en échec → method déclarée");
  assertSourcesWellFormed(env);
});
