/**
 * Handler task_type = threshold_alerts (déterministe, ZÉRO LLM).
 * Alertes de seuils (franchise TVA base/majoré, plafond micro) calculées à partir des
 * SEUILS du deterministic_core et du CA prévisionnel. Signale un franchissement (et le mois
 * de bascule) + explication + actions — jamais un montage.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  calculateForecast,
  computeMicroEntrepreneur,
  type ActivityType,
  type ForecastInput,
  type ForecastResult,
} from "@ftg/deterministic-core";
import { BAREMES_VERIF_DATE, type E8Handler } from "../deps.js";

interface Alert {
  threshold_key: string;
  label: string;
  seuil: number;
  franchi: boolean;
  crossing_month: number | null;
  explanation: string;
  actions: string[];
}

export const thresholdAlerts: E8Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const activity_type = (typeof si.activity_type === "string" ? si.activity_type : "services_bic") as ActivityType;

  const forecast: ForecastResult | null = si.forecast
    ? (si.forecast as ForecastResult)
    : si.forecast_input
      ? calculateForecast(si.forecast_input as ForecastInput)
      : null;
  const annual_ca = typeof si.ca_annuel === "number" ? si.ca_annuel : forecast ? forecast.pnl_annuel[0].ca : 0;

  const micro = computeMicroEntrepreneur({ ca_annuel: annual_ca, activity_type });
  const base = micro.franchise_tva.seuil_base;
  const majore = micro.franchise_tva.seuil_majore;
  const plafond = micro.plafond_ca;

  // CA cumulé mois par mois (année 1) → 1er mois de franchissement.
  const monthly = forecast ? forecast.pnl_mensuel.filter((m) => m.annee === 1).map((m) => m.ca) : [];
  const crossingMonth = (seuil: number): number | null => {
    let cumul = 0;
    for (let i = 0; i < monthly.length; i++) {
      cumul += monthly[i]!;
      if (cumul > seuil) return i + 1;
    }
    return null;
  };

  const alerts: Alert[] = [
    {
      threshold_key: "franchise_tva_base",
      label: "Franchise en base de TVA — seuil de base",
      seuil: base,
      franchi: annual_ca > base,
      crossing_month: crossingMonth(base),
      explanation: `Seuil de base de la franchise en base de TVA : ${base} €. Il s'apprécie sur DEUX années civiles consécutives ; son dépassement fait perdre la franchise et rend la TVA applicable.`,
      actions: [
        "Surveiller le CA sur deux années civiles consécutives",
        "Anticiper la facturation avec TVA et la tenue des mentions obligatoires",
        "Faire le point avec un expert-comptable sur le passage à la TVA",
      ],
    },
    {
      threshold_key: "franchise_tva_majore",
      label: "Franchise en base de TVA — seuil majoré",
      seuil: majore,
      franchi: annual_ca > majore,
      crossing_month: crossingMonth(majore),
      explanation: `Seuil majoré de la franchise en base de TVA : ${majore} €. Son dépassement fait basculer à la TVA dès le 1er jour du mois de dépassement (application immédiate).`,
      actions: [
        "Basculer à la facturation avec TVA dès le mois de dépassement",
        "S'assurer de l'immatriculation à la TVA et mettre à jour les factures",
        "Se rapprocher d'un expert-comptable pour les déclarations de TVA",
      ],
    },
    {
      threshold_key: "plafond_micro",
      label: "Plafond du régime micro",
      seuil: plafond,
      franchi: annual_ca > plafond,
      crossing_month: crossingMonth(plafond),
      explanation: `Plafond de chiffre d'affaires du régime micro : ${plafond} €. Au-delà (dans les conditions de durée prévues), le régime micro n'est plus applicable et un changement de régime intervient.`,
      actions: [
        "Anticiper le changement de régime d'imposition",
        "Documenter le CA réel mois par mois",
        "Consulter un expert-comptable sur les conséquences du dépassement",
      ],
    },
  ];

  const triggered = alerts.filter((a) => a.franchi);
  const threshold_alerts = { activity_type, annual_ca, date_validite: BAREMES_VERIF_DATE, alerts, triggered };

  const summary = triggered.length
    ? `⚠️ ${triggered.length} seuil(s) franchi(s) sur le prévisionnel (CA annuel ${annual_ca} €) : ${triggered.map((t) => `${t.label} (${t.seuil} €${t.crossing_month ? `, dès le mois ${t.crossing_month}` : ""})`).join(" ; ")}. Explications et actions ci-dessous — information, pas un montage.`
    : `Aucun seuil franchi sur le prévisionnel (CA annuel ${annual_ca} €). Seuils surveillés : franchise TVA base ${base} €, majoré ${majore} €, plafond micro ${plafond} €.`;

  const sources: SourceCitation[] = [
    {
      claim: "Seuils de franchise TVA et plafond micro (chiffres déterministes, datés).",
      source: "@ftg/deterministic-core — barèmes FR 2026",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: false,
      method: null,
    },
  ];

  return {
    partial: {
      deliverable: { title: "Alertes de seuils fiscaux (E8 · Le Fiscaliste)", contentMd: summary, type: "threshold_alerts" },
      structuredData: { threshold_alerts },
      sources,
      scores: { qualitySelf: triggered.length ? 82 : 76, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
