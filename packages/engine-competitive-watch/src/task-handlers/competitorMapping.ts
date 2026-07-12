/**
 * Handler task_type = competitor_mapping (RÉEL, N1).
 * Dérive activité+zone (LLM) → Recherche d'Entreprises + Sirene → ≥5 concurrents directs
 * géolocalisés réels, OU absence CHALLENGÉE (jamais accepter « aucun concurrent » tel quel).
 */
import type { SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import { guaranteeSolutionPath, modelCallEntry, normalizeSolutionPaths, parseJsonObject } from "@ftg/engine-sdk";
import type { Competitor, EstablishmentInfo, SourceResult } from "@ftg/data-sources";
import { citationToSource, waterfallDepth, type E5Handler } from "../deps.js";
import { ACTIVITY_DERIVATION_SYSTEM } from "../prompts/activity-derivation.js";
import { ABSENCE_CHALLENGE_SYSTEM } from "../prompts/absence-challenge.js";

const MIN_DIRECTS = 5;
const ENRICH_TOP = 3;

interface DerivationJson {
  keywords?: string;
  naf?: string;
  departement?: string;
  code_commune?: string;
  rationale?: string;
}
interface AbsenceJson {
  hypotheses?: string[];
  reformulations?: unknown;
  summary_md?: string;
}

export const competitorMapping: E5Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;

  // 1) Dérivation des paramètres de recherche (LLM, intermédiaire).
  const derivPrompt = [
    "Contexte projet (JSON) :",
    JSON.stringify({ segment: si.segment, idee_retenue: si.idee ?? si.idea ?? si.selection, zone: si.zone }, null, 2),
    "",
    "Dérive les paramètres de recherche de concurrents, selon le schéma JSON.",
  ].join("\n");
  const deriv = parseJsonObject<DerivationJson>(await deps.callModel("intermediaire", ACTIVITY_DERIVATION_SYSTEM, derivPrompt));
  const keywords = (deriv.keywords || (typeof si.keywords === "string" ? si.keywords : "") || "").trim();
  const departement = ((deriv.departement || (typeof si.departement === "string" ? si.departement : "")) || "").trim() || undefined;
  const codeCommune = (deriv.code_commune || "").trim() || undefined;
  const naf = (deriv.naf || "").trim() || undefined;

  // 2) Recherche des concurrents (RÉEL, N1) — élargissement si trop peu de résultats.
  let re = await deps.sources.rechercheEntreprises({ q: keywords, naf, departement, codeCommune, perPage: 15 });
  if (!re.degraded && re.data.length < MIN_DIRECTS) {
    const broad = (keywords.split(/\s+/).find((w) => w.length >= 4) ?? keywords).trim();
    if (broad && broad.toLowerCase() !== keywords.toLowerCase()) {
      const re2 = await deps.sources.rechercheEntreprises({ q: broad, naf, departement, codeCommune, perPage: 15 });
      if (!re2.degraded) {
        const seen = new Set(re.data.map((c) => c.siren));
        re = { ...re2, data: [...re.data, ...re2.data.filter((c) => !seen.has(c.siren))] };
      }
    }
  }

  // 3) Enrichissement Sirene des premiers (RÉEL, N1).
  const enrichResults: SourceResult<EstablishmentInfo | null>[] = [];
  const enriched: Competitor[] = [];
  for (const c of re.data.slice(0, ENRICH_TOP)) {
    if (!c.siret) {
      enriched.push(c);
      continue;
    }
    const s = await deps.sources.sireneInsee(c.siret);
    enrichResults.push(s);
    enriched.push(
      !s.degraded && s.data
        ? { ...c, denomination: s.data.denomination ?? c.denomination, naf: s.data.naf ?? c.naf, commune: s.data.commune ?? c.commune }
        : c,
    );
  }
  const competitors: Competitor[] = [...enriched, ...re.data.slice(ENRICH_TOP)];

  // 4) Challenge d'absence si < 5 directs.
  const gapDetected = competitors.length < MIN_DIRECTS;
  let solutionPaths: SolutionPath[] = [];
  let absence: { hypotheses: string[]; summary: string } | undefined;
  const modelCalls = [modelCallEntry("intermediaire", input.constraints.llmChannel)];
  if (gapDetected) {
    const absPrompt = [
      `Concurrents directs trouvés : ${competitors.length} (< ${MIN_DIRECTS}). Mots-clés : « ${keywords} »${departement ? ` · dép. ${departement}` : ""}.`,
      "",
      "Challenge factuellement cette absence, selon le schéma JSON.",
    ].join("\n");
    const abs = parseJsonObject<AbsenceJson>(await deps.callModel("intermediaire", ABSENCE_CHALLENGE_SYSTEM, absPrompt));
    absence = { hypotheses: Array.isArray(abs.hypotheses) ? abs.hypotheses : [], summary: abs.summary_md ?? "" };
    solutionPaths = guaranteeSolutionPath(normalizeSolutionPaths(abs.reformulations), true);
    modelCalls.push(modelCallEntry("intermediaire", input.constraints.llmChannel));
  }

  const sources: SourceCitation[] = [
    citationToSource(re.citation, `Recherche de concurrents « ${keywords} »${departement ? ` (dép. ${departement})` : ""}.`),
    {
      claim: "Dérivation du code activité / de la zone de recherche.",
      source: "Raisonnement E5 (La Vigie)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Dérivation des mots-clés/NAF/zone par raisonnement à partir du segment et de l'idée retenue (pas une donnée mesurée).",
    },
    ...enrichResults.map((s) => citationToSource(s.citation, "Vérification d'établissement (Sirene INSEE).")),
  ];

  const coverage_note = gapDetected
    ? `${competitors.length} concurrent(s) direct(s) trouvé(s) (< ${MIN_DIRECTS}) — absence CHALLENGÉE (hypothèses + reformulations), non validée telle quelle.`
    : `${competitors.length} concurrent(s) direct(s) géolocalisés trouvés via ${re.citation.source}${re.degraded ? " (source dégradée)" : ""}.`;

  return {
    partial: {
      deliverable: { title: "Cartographie concurrentielle (E5 · La Vigie)", contentMd: coverage_note, type: "competitor_mapping" },
      structuredData: {
        competitors,
        coverage_note,
        activity_derivation: { keywords, naf: naf ?? null, departement: departement ?? null, rationale: deriv.rationale ?? "" },
        ...(absence ? { absence_challenge: absence } : {}),
      },
      sources,
      solutionPaths,
      scores: { qualitySelf: gapDetected ? 55 : 80, vectorContributions: {} },
      telemetry: { researchDepthReached: waterfallDepth([re, ...enrichResults]), modelCalls },
    },
    obstacleDetected: gapDetected,
  };
};
