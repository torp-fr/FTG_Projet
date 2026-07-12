/**
 * Handler task_type = availability_check (données réelles, ZÉRO LLM).
 * Batch multi-bases PAR candidat, chaque vérification HORODATÉE :
 *  - domaines (RDAP, RÉEL) ; dénomination (Recherche d'Entreprises, RÉEL) ;
 *  - marques (INDICATIF [E] + URL INPI) ; handles (best-effort [E]).
 * Ne conclut JAMAIS à une disponibilité juridique.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import type { Competitor, DenominationCollision, DomainCheckResult, SocialHandlesResult, SourceResult, TrademarkIndication } from "@ftg/data-sources";
import { citationToSource, safeSource, type E9Handler } from "../deps.js";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

async function checkDenomination(
  deps: Parameters<E9Handler>[1],
  name: string,
  now: string,
): Promise<{ result: DenominationCollision; citation: SourceCitation; degraded: boolean }> {
  const re: SourceResult<Competitor[]> = await safeSource(
    () => deps.sources.rechercheEntreprises({ q: name, perPage: 10 }),
    [] as Competitor[],
    "Annuaire des Entreprises (data.gouv)",
    now,
    "Collision de dénomination non vérifiée",
  );
  const nn = norm(name);
  const matches = re.data.filter((c) => norm(c.denomination).includes(nn) || nn.includes(norm(c.denomination))).slice(0, 5).map((c) => ({ siren: c.siren, denomination: c.denomination }));
  const exactCollision = re.data.some((c) => norm(c.denomination) === nn);
  const result: DenominationCollision = { query: name, total: re.data.length, matches, exactCollision, checkedAt: now };
  return { result, citation: citationToSource(re.citation, `Collision de dénomination « ${name} » (Recherche d'Entreprises) : ${exactCollision ? "correspondance exacte trouvée" : `${matches.length} approchante(s)`}.`), degraded: re.degraded };
}

export const availabilityCheck: E9Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const rawCandidates = Array.isArray(si.candidates)
    ? (si.candidates as unknown[]).map((c) => (typeof c === "string" ? c : str((c as { name?: string }).name)))
    : typeof si.name === "string"
      ? [si.name]
      : [];
  const names = rawCandidates.map((n) => n.trim()).filter(Boolean).slice(0, 6);
  const tlds = Array.isArray(si.tlds) ? (si.tlds as unknown[]).map(String) : ["com", "fr", "io"];
  const now = deps.now();

  const availability: Array<{
    candidate: string;
    domains: DomainCheckResult;
    denomination: DenominationCollision;
    marques: TrademarkIndication;
    handles: SocialHandlesResult;
    checkedAt: string;
  }> = [];
  const sources: SourceCitation[] = [];

  for (const name of names) {
    const dom: SourceResult<DomainCheckResult> = await safeSource(
      () => deps.sources.rdapDomains({ name, tlds }),
      { name, label: name.toLowerCase(), domains: [] },
      "RDAP (registres de noms de domaine)",
      now,
      "Disponibilité de domaines non vérifiée",
    );
    const den = await checkDenomination(deps, name, now);
    const mq: SourceResult<TrademarkIndication> = await safeSource(
      () => deps.sources.inpiMarques({ query: name }),
      { query: name, source: "non vérifié (indicatif)", checked: false, potentialHits: [], inpiSearchUrl: `https://data.inpi.fr/search?type=marques&q=${encodeURIComponent(name)}`, checkedAt: now, note: "indicatif" },
      "Marques — vérification manuelle INPI requise",
      now,
      "Indication de marque non obtenue",
    );
    const hd: SourceResult<SocialHandlesResult> = await safeSource(
      () => deps.sources.socialHandles({ handle: name }),
      { handle: name, results: [] },
      "Handles réseaux sociaux (best-effort)",
      now,
      "Handles non vérifiés",
    );

    availability.push({ candidate: name, domains: dom.data, denomination: den.result, marques: mq.data, handles: hd.data, checkedAt: new Date().toISOString() });
    sources.push(
      citationToSource(dom.citation, `Disponibilité de domaines « ${name} » (RDAP, horodaté).`),
      den.citation,
      citationToSource(mq.citation, `Indication de marque « ${name} » (INDICATIVE — voir URL INPI).`),
      citationToSource(hd.citation, `Handles « ${name} » (best-effort).`),
    );
  }

  return {
    partial: {
      deliverable: { title: "Vérification de disponibilité (E9 · L'Éponyme)", contentMd: `Disponibilité vérifiée pour ${names.length} candidat(s) — domaines & dénomination réels horodatés ; marques indicatif [E] ; handles best-effort.`, type: "availability_check" },
      structuredData: { availability },
      sources,
      scores: { qualitySelf: 80, vectorContributions: {} },
      // N1 open data réel (RDAP domaines + Recherche d'Entreprises dénomination) = 1.
      telemetry: { researchDepthReached: 1, modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
