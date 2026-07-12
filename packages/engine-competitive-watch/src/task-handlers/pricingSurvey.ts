/**
 * Handler task_type = pricing_survey (DÉGRADÉ V1).
 * Les relevés de prix ne sont pas automatisables proprement sans visite de sites en V1.
 * On renvoie donc un résultat explicitement marqué isEstimate + method — aucun prix inventé.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import type { E5Handler } from "../deps.js";

export const pricingSurvey: E5Handler = async (input, deps) => {
  const method =
    "Relevés de prix non automatisables proprement sans visite de sites en V1 — enrichissement manuel / DataForSEO au Lot suivant (V2). Aucun prix inventé.";
  const sources: SourceCitation[] = [
    {
      claim: "Positionnement tarifaire des concurrents.",
      source: "Relevé de prix (non connecté en V1)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method,
    },
  ];

  return {
    partial: {
      deliverable: {
        title: "Relevé de prix (E5 · La Vigie — V1 dégradé)",
        contentMd: "Relevé de prix concurrentiel non automatisé en V1. Enrichissement manuel / DataForSEO au Lot suivant (V2).",
        type: "pricing_survey",
      },
      structuredData: { pricing: { available: false, isEstimate: true, note: "Relevés manuels / enrichissement V2 (DataForSEO).", method } },
      sources,
      scores: { qualitySelf: 30, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
