/**
 * Tests de CONFORMITÉ de l'engine E9 (L'Éponyme) — clients data-sources + LLM MOCKÉS.
 *
 * (1) candidat identique à une marque enregistrée dans la classe visée (mock marques=hit)
 *     → détection (indicatif) ; et la garde REJETTE toute sur-affirmation « juridiquement sûr » ;
 * (2) connotation négative dans une langue d'une lentille active → signalée dans le challenge ;
 * (3) tout dispo → domaines réels HORODATÉS + dénomination + marques INDICATIF avec URL +
 *     handles ; disclaimer marques + renvoi présents ; aucun « sûr ».
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { CallModel, EngineInputEnvelope } from "@ftg/engine-sdk";
import type { DataSources, DomainCheckResult, SocialHandlesResult, SourceResult, TrademarkIndication } from "@ftg/data-sources";
import { runNameForge } from "../src/run.js";

function makeInput(taskType: string, structuredInput: Record<string, unknown>, geoLenses: string[] = ["france"]): EngineInputEnvelope {
  return {
    runId: "run-test-e9",
    taskType,
    projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: "Tech", config: {} }, geoLenses, decisionsHistory: [] },
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
function marqueResult(data: TrademarkIndication, checked: boolean): SourceResult<TrademarkIndication> {
  return { data, citation: { source: checked ? "Pappers (marques) — indicatif" : "Marques — vérification manuelle INPI requise", date: "2026-07-12T00:00:00.000Z", url: data.inpiSearchUrl, isEstimate: true, method: data.note }, degraded: !checked, waterfallLevel: 2 };
}
function handlesResult(data: SocialHandlesResult): SourceResult<SocialHandlesResult> {
  return { data, citation: { source: "Handles réseaux sociaux (best-effort)", date: "2026-07-12T00:00:00.000Z", url: null, isEstimate: true, method: "best-effort" }, degraded: false, waterfallLevel: 1 };
}

function makeSources(over: Partial<DataSources> = {}): DataSources {
  return {
    rechercheEntreprises: async () => realResult([], "Annuaire des Entreprises (data.gouv)"),
    countEstablishments: async (p) => realResult({ nafCodes: p.nafCodes, zone: { departement: null, codeCommune: null }, activeOnly: true, total: 0, capped: false, perNaf: [] }, "Annuaire des Entreprises (data.gouv)"),
    sireneInsee: async () => realResult(null, "API Sirene (INSEE)"),
    pappers: async (siren) => degradedResult({ siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false }, "API Pappers", "quota", 2),
    bodacc: async () => realResult([], "BODACC (open data)"),
    bodaccTrend: async (p) => realResult({ q: p.q, zone: null, windowMonths: 12, recent: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, previous: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, creationsDelta: 0, creationsTrend: "stable" as const }, "BODACC (open data)"),
    inseeStats: async (p) => degradedResult({ sector: p.sector, indicator: null, value: null, unit: null, period: null, available: false }, "INSEE", "BDM"),
    legifrancePiste: async (p) => degradedResult({ articleId: p.articleId, title: p.label ?? null, excerpt: null, dateVersion: null, url: null, available: false }, "Légifrance (API PISTE / DILA)", "OAuth"),
    rdapDomains: async (p) => realResult<DomainCheckResult>({ name: p.name, label: p.name.toLowerCase(), domains: (p.tlds ?? ["com", "fr"]).map((tld) => ({ domain: `${p.name.toLowerCase()}.${tld}`, tld, available: true, status: 404, checkedAt: "2026-07-12T00:00:00.000Z" })) }, "RDAP (registres de noms de domaine)"),
    inpiMarques: async (p) => marqueResult({ query: p.query, source: "non vérifié (indicatif)", checked: false, potentialHits: [], inpiSearchUrl: `https://data.inpi.fr/search?type=marques&q=${p.query}`, checkedAt: "2026-07-12T00:00:00.000Z", note: "indicatif — vérif manuelle INPI + antériorité pro" }, false),
    socialHandles: async (p) => handlesResult({ handle: p.handle, results: [{ platform: "github", url: `https://github.com/${p.handle}`, status: 404, available: true, indicative: false, checkedAt: "2026-07-12T00:00:00.000Z" }] }),
    ...over,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// (1) marque enregistrée dans la classe visée → détection ; jamais « juridiquement sûr ».
// ─────────────────────────────────────────────────────────────────────────────
test("(1) marque hit détecté (indicatif) + la garde REJETTE « juridiquement sûr »", async () => {
  const env = await runNameForge(makeInput("availability_check", { candidates: ["FTG"], tlds: ["com", "fr"] }), {
    sources: makeSources({
      inpiMarques: async (p) => marqueResult({ query: p.query, source: "Pappers (marques)", checked: true, potentialHits: [{ denomination: "FTG", classes: ["42"] }], inpiSearchUrl: `https://data.inpi.fr/search?type=marques&q=${p.query}`, checkedAt: "2026-07-12T00:00:00.000Z", note: "indicatif — pas une antériorité officielle" }, true),
    }),
  });
  const av = (env.structuredData as { availability: Array<{ marques: TrademarkIndication }> }).availability;
  assert.ok(av[0]?.marques.potentialHits.some((h) => /ftg/i.test(h.denomination) && h.classes.includes("42")), "hit marque détecté dans la classe 42");
  const marqueSrc = env.sources.find((s) => /marques/i.test(s.source));
  assert.equal(marqueSrc?.isEstimate, true, "dimension marques TOUJOURS indicative [E]");

  // La garde REJETTE une sur-affirmation de sécurité juridique.
  await assert.rejects(
    () => runNameForge(makeInput("shortlist_challenge", { candidates: ["FTG"] }), { callModel: seqModel({ shortlist: [{ name: "FTG" }], challenge: {}, summary_md: "Ce nom est juridiquement sûr et garanti disponible." }), sources: makeSources() }),
    /E9_no_legal_certainty|sécurité juridique/,
    "« juridiquement sûr » doit faire rejeter l'enveloppe",
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// (2) connotation négative dans une langue d'une lentille active → signalée.
// ─────────────────────────────────────────────────────────────────────────────
test("(2) connotation négative multilingue (lentille active) → signalée dans le challenge", async () => {
  const env = await runNameForge(
    makeInput("shortlist_challenge", { candidates: ["Bimbo", "Aria", "Kilo"], availability: {} }, ["france", "international"]),
    {
      callModel: seqModel({
        shortlist: [
          { name: "Bimbo", memorability: "forte", pronounceability: "facile", extensibility: "ok", connotations: [{ lang: "en", note: "argot péjoratif en anglais — à éviter à l'international" }], risks: ["connotation négative EN"] },
          { name: "Aria", memorability: "bonne", pronounceability: "facile", extensibility: "large", connotations: [{ lang: "fr", note: "neutre" }], risks: [] },
          { name: "Kilo", memorability: "moyenne", pronounceability: "facile", extensibility: "ok", connotations: [], risks: [] },
        ],
        challenge: { facts: ["'Bimbo' porte une connotation négative en anglais"], risks: ["image à l'international"], conditions: ["tester la perception sur les marchés visés"] },
        summary_md: "Shortlist challengée : attention à la connotation anglophone de « Bimbo ».",
      }),
      sources: makeSources(),
    },
  );
  const sc = (env.structuredData as { shortlist_challenge: { shortlist: Array<{ name: string; connotations: Array<{ lang: string; note: string }> }> } }).shortlist_challenge;
  const flagged = sc.shortlist.find((s) => s.connotations.some((c) => c.lang === "en" && /péjoratif|négati|éviter/i.test(c.note)));
  assert.ok(flagged, "une connotation négative dans une langue active (en) est signalée");
});

// ─────────────────────────────────────────────────────────────────────────────
// (3) tout dispo → dossier réel horodaté + marques indicatif+URL + disclaimer + renvoi.
// ─────────────────────────────────────────────────────────────────────────────
test("(3) tout dispo → domaines réels horodatés + dénomination + marques indicatif+URL + handles + disclaimer", async () => {
  const env = await runNameForge(makeInput("availability_check", { candidates: ["Foundthegrow"], tlds: ["com", "fr", "io"] }), { sources: makeSources() });
  const av = (env.structuredData as { availability: Array<{ domains: DomainCheckResult; denomination: { exactCollision: boolean }; marques: TrademarkIndication; handles: SocialHandlesResult }> }).availability;
  const a = av[0]!;
  assert.ok(a.domains.domains.length >= 2 && a.domains.domains.every((d) => d.available === true && d.checkedAt), "domaines libres, RÉELS et HORODATÉS");
  assert.equal(a.denomination.exactCollision, false, "aucune collision de dénomination");
  assert.ok(a.marques.inpiSearchUrl.includes("data.inpi.fr"), "URL de recherche INPI jointe (vérif manuelle)");
  const marqueSrc = env.sources.find((s) => /marques/i.test(s.source));
  assert.equal(marqueSrc?.isEstimate, true, "marques indicatif [E], jamais certain");
  assert.ok(a.handles.results.length >= 1, "handles vérifiés (best-effort)");

  const sd = env.structuredData as { disclaimers?: { text: string }; professional_referral?: { required: boolean } };
  assert.ok(sd.disclaimers?.text && /INDICATIVE/.test(sd.disclaimers.text), "disclaimer marques présent");
  assert.equal(sd.professional_referral?.required, true, "renvoi antériorité pro non désactivable");
});
