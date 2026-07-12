/**
 * Handler task_type = market_sizing (tier intermédiaire).
 * Densité RÉELLE (comptage Sirene par NAF+zone) + sizing macro (INSEE si dispo, sinon [E]).
 * GARDE-FOU : la densité est sourcée ; TAM/SAM/SOM sont TOUJOURS marqués estimation + method.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { MacroSizing, MarketDensity, SourceResult } from "@ftg/data-sources";
import { citationToSource, researchDepth, safeSource, type E4Handler } from "../deps.js";
import { MARKET_SIZING_SYSTEM } from "../prompts/market-sizing.js";

interface ScopeShape {
  keywords?: string;
  naf_codes?: Array<{ code?: string; label?: string } | string>;
  departement?: string | null;
  code_commune?: string | null;
}
interface SizingEstimateJson {
  value?: number;
  unit?: string;
  method?: string;
}
interface SizingJson {
  tam?: SizingEstimateJson;
  sam?: SizingEstimateJson;
  som?: SizingEstimateJson;
  assumptions?: unknown;
  sizing_md?: string;
}

function nafCodesFromScope(scope: ScopeShape): string[] {
  return (scope.naf_codes ?? [])
    .map((n) => (typeof n === "string" ? n : (n.code ?? "")))
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Une estimation est TOUJOURS marquée isEstimate + method (jamais un chiffre nu présenté comme fait). */
function estimate(e: SizingEstimateJson | undefined, fallbackMethod: string) {
  return {
    value: typeof e?.value === "number" ? e.value : null,
    unit: typeof e?.unit === "string" ? e.unit : null,
    isEstimate: true as const,
    method: e?.method && e.method.trim() ? e.method : fallbackMethod,
  };
}

export const marketSizing: E4Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const scope = (si.scope ?? {}) as ScopeShape;
  const sector = (scope.keywords || (typeof si.segment === "string" ? si.segment : "") || "secteur").trim();
  const nafCodes = nafCodesFromScope(scope);
  const departement = (scope.departement ?? undefined) || undefined;
  const codeCommune = (scope.code_commune ?? undefined) || undefined;
  const now = deps.now();

  // 1) Densité RÉELLE (comptage Sirene actifs par NAF+zone) — défensif contre un client qui throw.
  const density: SourceResult<MarketDensity> = await safeSource(
    () => deps.sources.countEstablishments({ nafCodes, departement, codeCommune, activeOnly: true }),
    { nafCodes, zone: { departement: departement ?? null, codeCommune: codeCommune ?? null }, activeOnly: true, total: 0, capped: false, perNaf: [] },
    "Annuaire des Entreprises (data.gouv)",
    now,
    "Comptage de densité indisponible — repli sans donnée inventée",
  );

  // 2) Cadrage macro (INSEE BDM si souscrit, sinon dégradé → sizing macro en [E]).
  const macro: SourceResult<MacroSizing> = await safeSource(
    () => deps.sources.inseeStats({ sector }),
    { sector, indicator: null, value: null, unit: null, period: null, available: false },
    "INSEE (statistiques macro-sectorielles — BDM / comptes du commerce)",
    now,
    "Statistiques macro indisponibles — sizing macro en estimation méthodique",
  );

  // 3) TAM/SAM/SOM = estimations méthodiques ancrées sur la densité réelle.
  const userPrompt = [
    "Densité RÉELLE d'établissements (comptage Sirene, données sourcées) :",
    JSON.stringify(density.data, null, 2),
    `Densité dégradée : ${density.degraded}. Plafond API atteint (plancher) : ${density.data.capped}.`,
    "",
    "Cadrage macro INSEE :",
    JSON.stringify({ available: macro.data.available, indicator: macro.data.indicator, value: macro.data.value, unit: macro.data.unit, period: macro.data.period }, null, 2),
    "",
    "Produis TAM/SAM/SOM (estimations méthodiques [E]) ancrés sur la densité réelle, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<SizingJson>(await deps.callModel("intermediaire", MARKET_SIZING_SYSTEM, userPrompt));

  const sizing = {
    density: density.data,
    density_degraded: density.degraded,
    macro: { available: macro.data.available, indicator: macro.data.indicator, value: macro.data.value, unit: macro.data.unit, period: macro.data.period },
    tam: estimate(parsed.tam, "Estimation méthodique ancrée sur la densité réelle (hypothèses déclarées)."),
    sam: estimate(parsed.sam, "Estimation méthodique (sous-ensemble adressable de la densité réelle)."),
    som: estimate(parsed.som, "Estimation méthodique (part atteignable à court terme)."),
    assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.filter((a): a is string => typeof a === "string") : [],
  };

  const densityClaim = density.data.capped
    ? `Densité d'établissements actifs (comptage Sirene par NAF ${nafCodes.join(", ")}) — au moins ${density.data.total} (plafond API).`
    : `Densité d'établissements actifs (comptage Sirene par NAF ${nafCodes.join(", ")}) : ${density.data.total}${departement ? ` (dép. ${departement})` : " (national)"}.`;

  const sources: SourceCitation[] = [
    citationToSource(density.citation, densityClaim),
    citationToSource(macro.citation, "Cadrage macro-sectoriel (INSEE BDM / comptes du commerce)."),
    {
      claim: "Dimensionnement TAM/SAM/SOM.",
      source: "Raisonnement E4 (Le Cartographe)",
      date: now,
      url: null,
      isEstimate: true,
      method: "TAM/SAM/SOM estimés par raisonnement à partir de la densité réelle + hypothèses déclarées (panier/CA moyen, taux de captation) — estimations, pas des faits mesurés.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Dimensionnement du marché (E4 · Le Cartographe)", contentMd: parsed.sizing_md ?? "", type: "market_sizing" },
      structuredData: { sizing },
      sources,
      scores: { qualitySelf: density.degraded ? 55 : 78, vectorContributions: {} },
      telemetry: { researchDepthReached: researchDepth([density, macro]), modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
