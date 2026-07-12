/**
 * Handler task_type = tax_simulation (déterministe, ZÉRO LLM).
 * RÉUTILISE @ftg/deterministic-core (cotisations, IR/IS, PFU, franchise TVA) → chiffres
 * EXACTS. Zones d'imprécision assumées affichées (rému dirigeant non modélisée, EI réel
 * approximatif_v1). Aucun chiffre LLM, aucun montage.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  calculateForecast,
  compareStatuses,
  computeMicroEntrepreneur,
  type ActivityType,
  type ForecastInput,
  type ForecastResult,
  type MicroEntrepreneurResult,
  type StatusComparison,
} from "@ftg/deterministic-core";
import { BAREMES_VERIF_DATE, type E8Handler } from "../deps.js";

export const taxSimulation: E8Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const activity_type = (typeof si.activity_type === "string" ? si.activity_type : "services_bic") as ActivityType;
  const distribution_dividendes = si.distribution_dividendes === undefined ? true : Boolean(si.distribution_dividendes);

  const forecast: ForecastResult | null = si.forecast
    ? (si.forecast as ForecastResult)
    : si.forecast_input
      ? calculateForecast(si.forecast_input as ForecastInput)
      : null;
  const ca_annuel = typeof si.ca_annuel === "number" ? si.ca_annuel : forecast ? forecast.pnl_annuel[0].ca : 0;

  const comparison: StatusComparison | null = forecast ? compareStatuses(forecast, activity_type, { distribution_dividendes }) : null;
  const micro: MicroEntrepreneurResult = comparison ? comparison.micro_entrepreneur : computeMicroEntrepreneur({ ca_annuel, activity_type });

  const imprecision_notes = comparison
    ? ["société IS : rémunération du dirigeant non modélisée (V1)", "EI au réel : approximatif — ordre de grandeur"]
    : [];

  const tax_simulation = {
    activity_type,
    ca_annuel,
    date_validite: BAREMES_VERIF_DATE,
    micro,
    comparison,
    imprecision_notes,
  };

  const summary =
    `Simulation fiscale (barèmes FTG, validité ${BAREMES_VERIF_DATE}). ` +
    `Micro-entrepreneur : cotisations ${micro.cotisations} € (${Math.round(micro.taux_cotisations * 1000) / 10} % du CA ${micro.ca_annuel} €), ` +
    `base imposable IR ${micro.base_imposable_ir} € (abattement ${Math.round(micro.taux_abattement * 100)} %), ` +
    `statut ${micro.statut_valide ? "dans le plafond" : "au-dessus du plafond"} (${micro.plafond_ca} €).` +
    (comparison
      ? ` Société IS : IS ${comparison.societe_is.is_total} €, net porteur ${comparison.societe_is.net_porteur} € (rému dirigeant non modélisée). ` +
        `EI au réel : net porteur ${comparison.entreprise_individuelle_reel.net_porteur} € (⚠️ approximatif).`
      : "");

  const sources: SourceCitation[] = [
    {
      claim: "Simulation des cotisations / IR-IS / PFU / franchise TVA (chiffres déterministes).",
      source: "@ftg/deterministic-core — barèmes FR 2026",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: false,
      method: null,
    },
  ];
  if (comparison) {
    sources.push({
      claim: "Statut EI au réel — ordre de grandeur.",
      source: "@ftg/deterministic-core (EI réel, approximatif_v1)",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: true,
      method: "Barème IR indicatif + taux TNS forfaitaire non sourcés au centime (approximatif_v1) — ordre de grandeur, jamais présenté comme précis.",
    });
  }

  return {
    partial: {
      deliverable: { title: "Simulation fiscale (E8 · Le Fiscaliste)", contentMd: summary, type: "tax_simulation" },
      structuredData: { tax_simulation },
      sources,
      scores: { qualitySelf: 84, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
