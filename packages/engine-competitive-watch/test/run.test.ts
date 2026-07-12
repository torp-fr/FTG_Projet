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
    commune: "LYON", codePostal: "69001", naf: "16.23Z", dateCreation: "2010-01-01",
    effectif: "10", source: "Annuaire des Entreprises (data.gouv)",
  };
}

function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([competitor(1), competitor(2), competitor(3), competitor(4), competitor(5), competitor(6)], "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult({ siret: "11100001", denomination: "MENUISERIE 1", naf: "16.23Z", commune: "LYON", codePostal: "69001", dateCreation: "2010-01-01", etat: "A" }, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota épuisé", 2),
    bodacc: async () => realResult([{ date: "2026-07-10", type: "Procédures collectives", commercant: "SOLS BOIS", ville: "Mauguio", departement: "34" }], "BODACC (open data)"),
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
  const callModel = seqModel({ keywords: "menuiserie agencement", naf: "16.23Z", departement: "69", code_commune: "", rationale: "…" });
  const env = await runCompetitiveWatch(input, { callModel, sources: makeSources() });

  const sd = env.structuredData as { competitors: Competitor[] };
  assert.ok(sd.competitors.length >= 5, "au moins 5 concurrents directs");
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
    { keywords: "niche rare", naf: "", departement: "", code_commune: "", rationale: "…" },
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
    { keywords: "menuiserie", naf: "", departement: "", code_commune: "", rationale: "…" },
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
