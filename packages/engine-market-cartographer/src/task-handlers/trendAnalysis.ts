/**
 * Handler task_type = trend_analysis (tier intermédiaire).
 * Tendance de vitalité RÉELLE via BODACC (créations vs procédures collectives, datées).
 * Demande par mots-clés (DataForSEO/Trends) DIFFÉRÉE (V2) → stub honnête, aucun faux volume.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { BodaccTrend, SourceResult } from "@ftg/data-sources";
import { citationToSource, researchDepth, safeSource, type E4Handler } from "../deps.js";
import { TREND_ANALYSIS_SYSTEM } from "../prompts/trend-analysis.js";

interface ScopeShape {
  keywords?: string;
  departement?: string | null;
}
interface TrendJson {
  interpretation_md?: string;
  signals?: unknown;
}

const SEARCH_DEMAND_DEFERRED = {
  deferred: true,
  isEstimate: true,
  method:
    "Demande par mots-clés (volumes de recherche DataForSEO / Google Trends) DIFFÉRÉE — service payant prévu en V2. Aucun volume estimé ici (pas de faux chiffre).",
};

/**
 * Terme sectoriel PROPRE pour la recherche plein-texte BODACC : un seul mot cœur du
 * métier (leçon E5). BODACC n'est pas indexé NAF ; un terme multi-mots avec qualificatif
 * de format (« menuiserie, atelier découverte ») sur-restreint la recherche et effondre
 * le comptage. On retient le 1er mot ≥4 caractères du 1er segment.
 */
function sectorTerm(raw: string): string {
  const firstSeg = (raw.split(",")[0] ?? raw).trim();
  return (firstSeg.split(/\s+/).find((w) => w.length >= 4) ?? firstSeg).trim();
}

export const trendAnalysis: E4Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const scope = (si.scope ?? {}) as ScopeShape;
  const rawKeywords = (scope.keywords || (typeof si.keywords === "string" ? si.keywords : "") || (typeof si.segment === "string" ? si.segment : "") || "").trim();
  const q = sectorTerm(rawKeywords);
  const departement = (scope.departement ?? undefined) || undefined;
  const now = deps.now();

  // Tendance RÉELLE datée (BODACC), défensive contre un client qui throw.
  const trend: SourceResult<BodaccTrend> = await safeSource(
    () => deps.sources.bodaccTrend({ q, departement, now, windowMonths: 12 }),
    { q, zone: departement ?? null, windowMonths: 12, recent: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, previous: { from: "", to: "", creations: 0, proceduresCollectives: 0 }, creationsDelta: 0, creationsTrend: "stable" },
    "BODACC (open data)",
    now,
    "Tendance BODACC indisponible — repli sans donnée inventée",
  );

  const userPrompt = [
    "Tendance BODACC RÉELLE et DATÉE (comptages d'annonces) :",
    JSON.stringify(trend.data, null, 2),
    `Tendance dégradée : ${trend.degraded}.`,
    "",
    "Interprète factuellement cette tendance datée (la demande par mots-clés est différée, ne l'estime pas), selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<TrendJson>(await deps.callModel("intermediaire", TREND_ANALYSIS_SYSTEM, userPrompt));

  const trendData = {
    bodacc: trend.data,
    bodacc_degraded: trend.degraded,
    search_demand: SEARCH_DEMAND_DEFERRED,
    interpretation_md: parsed.interpretation_md ?? "",
    signals: Array.isArray(parsed.signals) ? parsed.signals.filter((s): s is string => typeof s === "string") : [],
  };

  const w = trend.data;
  const trendClaim = trend.degraded
    ? "Tendance de vitalité sectorielle (BODACC) — source indisponible au moment de la collecte."
    : `Tendance de vitalité (BODACC) : créations ${w.recent.creations} (${w.recent.from}→${w.recent.to}) vs ${w.previous.creations} (${w.previous.from}→${w.previous.to}) ; procédures collectives ${w.recent.proceduresCollectives} sur la période récente.`;

  const sources: SourceCitation[] = [
    citationToSource(trend.citation, trendClaim),
    {
      claim: "Demande par mots-clés (volumes de recherche).",
      source: "DataForSEO / Google Trends",
      date: now,
      url: null,
      isEstimate: true,
      method: SEARCH_DEMAND_DEFERRED.method,
    },
    {
      claim: "Interprétation de la tendance de vitalité.",
      source: "Raisonnement E4 (Le Cartographe)",
      date: now,
      url: null,
      isEstimate: true,
      method: "Lecture des comptages BODACC datés réels (annonces, non indexées NAF) — interprétation, pas une donnée mesurée supplémentaire.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Tendance de marché (E4 · Le Cartographe)", contentMd: parsed.interpretation_md ?? "", type: "trend_analysis" },
      structuredData: { trend: trendData },
      sources,
      scores: { qualitySelf: trend.degraded ? 55 : 76, vectorContributions: {} },
      telemetry: { researchDepthReached: researchDepth([trend]), modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
