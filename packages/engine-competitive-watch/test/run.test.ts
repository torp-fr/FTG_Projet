/**
 * Tests de CONFORMITÉ D'ENVELOPPE de l'engine E5 (La Vigie) — LLM ET sources MOCKÉS.
 *
 * Exécution : `pnpm --filter @ftg/engine-competitive-watch test`
 *
 * Zéro réseau : on injecte de faux clients @ftg/data-sources + un faux callModel. On
 * vérifie la conformité structurelle (validateOutputEnvelope), le sourcing bien formé,
 * le seuil des 5 directs / l'absence challengée, et la dégradation propre.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CallModel, EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import type { Competitor, DataSources, SourceResult } from "@ftg/data-sources";
import { runCompetitiveWatch } from "../src/run.js";

function makeInput(taskType: string, structuredInput: Record<string, unknown>): EngineInputEnvelope {
  return {
    runId: "run-test-e5",
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
    constraints: {
      quotas: {},
      llmChannel: "pooled",
      // Waterfall réel V1 : min honnête = 1 (au moins un palier open data).
      researchDepthMin: 1,
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"],
    },
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

function competitor(n: number): Competitor {
  return {
    siren: `1110000${n}`, siret: `1110000${n}00001`, denomination: `MENUISERIE ${n}`,
    commune: "LYON", codePostal: "69001", naf: "16.23Z", nafLabel: null, dateCreation: "2010-01-01",
    effectif: "10", source: "Annuaire des Entreprises (data.gouv)",
  };
}

function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([competitor(1), competitor(2), competitor(3), competitor(4), competitor(5), competitor(6)], "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult({ siret: "11100001", denomination: "MENUISERIE 1", naf: "16.23Z", commune: "LYON", codePostal: "69001", dateCreation: "2010-01-01", etat: "A" }, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota épuisé", 2),
    bodacc: async () => realResult([{ date: "2026-07-10", type: "Procédures collectives", commercant: "SOLS BOIS", ville: "Mauguio", departement: "34" }], "BODACC (open data)"),
    // Clients de marché (E4) — non utilisés par E5, stubs de conformité d'interface.
    countEstablishments: async (p) => realResult({ nafCodes: p.nafCodes, zone: { departement: p.departement ?? null, codeCommune: p.codeCommune ?? null }, activeOnly: Boolean(p.activeOnly), total: 0, capped: false, perNaf: [] }, "Annuaire des Entreprises (data.gouv)"),
    bodaccTrend: async (p) => realResult({ q: p.q, zone: p.departement ?? null, windowMonths: p.windowMonths ?? 12, recent: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, previous: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, creationsDelta: 0, creationsTrend: "stable" as const }, "BODACC (open data)"),
    inseeStats: async (p) => degradedResult({ sector: p.sector, indicator: null, value: null, unit: null, period: null, available: false }, "INSEE (statistiques macro-sectorielles — BDM / comptes du commerce)", "BDM non souscrit"),
    legifrancePiste: async (p) => degradedResult({ articleId: p.articleId, title: p.label ?? null, excerpt: null, dateVersion: null, url: null, available: false }, "Légifrance (API PISTE / DILA)", "OAuth PISTE non configuré"),
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

// ─────────────────────────────────────────────────────────────────────────────
// (1) Marché local avec ≥ 5 concurrents → enveloppe conforme, sources bien formées.
// ─────────────────────────────────────────────────────────────────────────────
test("(1) ≥5 concurrents directs → enveloppe conforme, sources bien formées, ≥5 directs", async () => {
  const input = makeInput("competitor_mapping", { segment: "Artisanat", idee: "atelier de menuiserie sur-mesure", departement: "69" });
  const callModel = seqModel({
    keywords: "menuiserie agencement",
    naf_codes: [
      { code: "43.32A", label: "Travaux de menuiserie bois et PVC" },
      { code: "43.32B", label: "Travaux de menuiserie métallique" },
      { code: "16.23Z", label: "Fabrication de charpente et d'autres menuiseries" },
    ],
    departement: "69", code_commune: "", rationale: "…",
  });
  const env = await runCompetitiveWatch(input, { callModel, sources: makeSources() });

  const sd = env.structuredData as { competitors: Competitor[]; activity_derivation: { naf_filtering: boolean } };
  assert.ok(sd.competitors.length >= 5, "au moins 5 concurrents directs");
  assert.ok(sd.activity_derivation.naf_filtering, "filtrage par NAF actif");
  assert.equal(env.deliverable.type, "competitor_mapping");
  assertSourcesWellFormed(env);
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) « Aucun concurrent » (peu de résultats) → l'engine documente + challenge,
//     ne valide PAS l'absence telle quelle.
// ─────────────────────────────────────────────────────────────────────────────
test("(2) < 5 concurrents → absence CHALLENGÉE (hypothèses + reformulations), non validée", async () => {
  const input = makeInput("competitor_mapping", { segment: "Artisanat", idee: "niche très spécifique" });
  const callModel = seqModel(
    { keywords: "niche rare", naf_codes: [{ code: "16.23Z", label: "Fabrication de menuiseries" }], departement: "", code_commune: "", rationale: "…" },
    { hypotheses: ["Angle de recherche trop étroit", "Substituts non cartographiés"], reformulations: [{ title: "Élargir les mots-clés", description: "Tester des synonymes", actions: ["Relancer avec 'menuiserie'"] }], summary_md: "Peu de résultats : à challenger." },
  );
  const sources = makeSources({ rechercheEntreprises: async () => realResult([competitor(1), competitor(2)], "Annuaire des Entreprises (data.gouv)") });
  const env = await runCompetitiveWatch(input, { callModel, sources });

  const sd = env.structuredData as { competitors: Competitor[]; absence_challenge?: { hypotheses: string[] } };
  assert.ok(sd.competitors.length < 5, "peu de concurrents");
  assert.ok(sd.absence_challenge, "l'absence est documentée/challengée");
  assert.ok((sd.absence_challenge?.hypotheses.length ?? 0) >= 1, "des hypothèses factuelles");
  assert.ok(env.solutionPaths.length >= 1, "au moins une reformulation (D25)");
  assertSourcesWellFormed(env);
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) Une source en échec (dégradée, comme le fait le vrai client) → dégradation
//     isEstimate+method, PAS de crash, enveloppe toujours conforme.
// ─────────────────────────────────────────────────────────────────────────────
test("(3) source en échec → dégradation isEstimate+method, pas de crash, enveloppe conforme", async () => {
  const input = makeInput("competitor_mapping", { segment: "Artisanat", idee: "menuiserie" });
  const callModel = seqModel(
    { keywords: "menuiserie", naf_codes: [{ code: "43.32A", label: "Travaux de menuiserie bois et PVC" }], departement: "", code_commune: "", rationale: "…" },
    { hypotheses: ["Source indisponible au moment de la recherche"], reformulations: [{ title: "Réessayer plus tard", description: "La source open data était indisponible", actions: ["Relancer la cartographie"] }], summary_md: "Source dégradée." },
  );
  const sources = makeSources({
    rechercheEntreprises: async () => degradedResult([] as Competitor[], "Annuaire des Entreprises (data.gouv)", "API Recherche d'Entreprises indisponible (HTTP 503) — cartographie non enrichie (repli sans donnée inventée)."),
  });
  const env = await runCompetitiveWatch(input, { callModel, sources });

  // Pas de throw ⇒ conforme. La citation de la source dégradée est isEstimate + method.
  const degraded = env.sources.find((s) => s.source === "Annuaire des Entreprises (data.gouv)");
  assert.ok(degraded, "la source dégradée figure dans les citations");
  assert.equal(degraded?.isEstimate, true, "source en échec → isEstimate");
  assert.ok(degraded?.method && degraded.method.length > 0, "source en échec → method déclarée");
  assertSourcesWellFormed(env);
});

// ─────────────────────────────────────────────────────────────────────────────
// (4) FILTRE NAF : un mélange de bons NAF menuiserie + un intrus 68.20B (matché sur
//     le nom) → seuls les NAF sectoriels sont retenus, l'intrus est ÉCARTÉ (documenté),
//     enveloppe conforme. Reproduit le faux positif réel SIREN 479678757.
// ─────────────────────────────────────────────────────────────────────────────
test("(4) filtre NAF → intrus hors-activité (68.20B) écarté, seuls les NAF sectoriels retenus", async () => {
  const input = makeInput("competitor_mapping", { segment: "Artisanat", idee: "atelier de menuiserie", departement: "17" });
  const callModel = seqModel({
    keywords: "menuiserie",
    naf_codes: [
      { code: "43.32A", label: "Travaux de menuiserie bois et PVC" },
      { code: "16.23Z", label: "Fabrication de charpente et d'autres menuiseries" },
    ],
    departement: "17", code_commune: "", rationale: "…",
  });
  // 5 vrais menuisiers (43.32A / 16.23Z) + 1 intrus « MENUISERIE » codé 68.20B (location immobilière).
  const intruder: Competitor = {
    siren: "479678757", siret: null, denomination: "MENUISERIE", commune: "PARIS", codePostal: "75001",
    naf: "68.20B", nafLabel: null, dateCreation: "2005-01-01", effectif: null, source: "Annuaire des Entreprises (data.gouv)",
  };
  const good: Competitor[] = [1, 2, 3, 4, 5].map((n) => ({ ...competitor(n), naf: n <= 3 ? "43.32A" : "16.23Z" }));
  const sources = makeSources({ rechercheEntreprises: async () => realResult([...good, intruder], "Annuaire des Entreprises (data.gouv)") });
  const env = await runCompetitiveWatch(input, { callModel, sources });

  const sd = env.structuredData as {
    competitors: Array<Competitor & { relevant: boolean }>;
    excluded: Array<{ siren: string; naf: string | null; reason: string }>;
  };
  assert.equal(sd.competitors.length, 5, "seuls les 5 concurrents à NAF sectoriel sont retenus");
  assert.ok(!sd.competitors.some((c) => c.siren === "479678757"), "l'intrus 479678757 n'est PAS un concurrent direct");
  assert.ok(sd.competitors.every((c) => c.relevant), "tous les directs sont marqués pertinents");
  const ex = sd.excluded.find((e) => e.siren === "479678757");
  assert.ok(ex, "l'intrus est documenté dans les écartés");
  assert.ok((ex?.naf ?? "").startsWith("68"), "l'intrus écarté porte bien le NAF hors-activité 68.20B");
  assertSourcesWellFormed(env);
});
