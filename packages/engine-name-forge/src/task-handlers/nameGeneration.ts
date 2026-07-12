/**
 * Handler task_type = name_generation (tier intermédiaire).
 * Candidats alignés positionnement/segment/ton/géo. Signale tout candidat à risque.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E9Handler } from "../deps.js";
import { NAME_GENERATION_SYSTEM } from "../prompts/name-generation.js";

interface CandidateJson {
  name?: string;
  style?: string;
  rationale?: string;
  caveat?: string;
}
interface GenJson {
  candidates?: CandidateJson[];
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export const nameGeneration: E9Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const geoLenses = input.projectContext?.geoLenses ?? [];
  const userPrompt = [
    "Contexte projet (JSON) :",
    JSON.stringify({ positionnement: si.positioning ?? si.positionnement, segment: si.segment, ton: si.tone ?? si.ton, idee: si.idee ?? si.idea, geo_lenses: geoLenses }, null, 2),
    "",
    "Génère des candidats de noms, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<GenJson>(await deps.callModel("intermediaire", NAME_GENERATION_SYSTEM, userPrompt));

  const candidates = (parsed.candidates ?? [])
    .map((c) => ({ name: str(c.name).trim(), style: str(c.style), rationale: str(c.rationale), caveat: str(c.caveat) }))
    .filter((c) => c.name);

  const sources: SourceCitation[] = [
    {
      claim: "Génération de candidats de noms.",
      source: "Raisonnement E9 (L'Éponyme)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Candidats générés par raisonnement à partir du positionnement/segment/ton/géo — la disponibilité est vérifiée séparément (aucune promesse ici).",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Candidats de noms (E9 · L'Éponyme)", contentMd: `${candidates.length} candidats générés — disponibilité vérifiée séparément.`, type: "name_generation" },
      structuredData: { candidates },
      sources,
      scores: { qualitySelf: 74, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
