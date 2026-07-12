/**
 * Handler task_type = review_mining (DIFFÉRÉ).
 * Dépend de DataForSEO (payant, non activé) → stub honnête. Aucun faux verbatim.
 */
import type { E5Handler } from "../deps.js";

export const reviewMining: E5Handler = async () => {
  const note =
    "Mining des douleurs clients (verbatims / avis) — activé au branchement DataForSEO (V2). Aucun verbatim n'est fabriqué en V1.";
  return {
    partial: {
      deliverable: { title: "Mining des avis (E5 · La Vigie — différé V2)", contentMd: note, type: "review_mining" },
      structuredData: { review_mining: { status: "deferred", note } },
      sources: [],
      scores: { qualitySelf: 0, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
