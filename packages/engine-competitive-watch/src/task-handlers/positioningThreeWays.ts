/**
 * Handler task_type = positioning_three_ways (tier FRONTIER, 🔀 règle des 3 + 😈).
 * 3 voies de positionnement réellement divergentes, raisonnées sur les DONNÉES RÉELLES
 * collectées, + un challenge factuel. Aucun dénigrement.
 */
import type { DevilsAdvocateChallenge, SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import { clampScore, guaranteeSolutionPath, modelCallEntry, normalizeThreeWays, parseJsonObject } from "@ftg/engine-sdk";
import { type E5Handler } from "../deps.js";
import { POSITIONING_THREE_WAYS_SYSTEM } from "../prompts/positioning-three-ways.js";

interface VoieJson {
  label?: string;
  description?: string;
  risks?: unknown;
  conditions?: unknown;
}
interface PositioningJson {
  positioning_three_ways?: VoieJson[];
  challenge?: { facts?: unknown; risks?: unknown; conditions?: unknown };
  summary_md?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const positioningThreeWays: E5Handler = async (input, deps) => {
  const userPrompt = [
    "Données concurrentielles réelles collectées (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Propose 3 voies de positionnement divergentes + un challenge factuel, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<PositioningJson>(await deps.callModel("frontier", POSITIONING_THREE_WAYS_SYSTEM, userPrompt));

  const voies = (parsed.positioning_three_ways ?? []).map((v) => ({
    label: str(v.label),
    description: str(v.description),
    risks: arr(v.risks),
    conditions: arr(v.conditions),
  }));
  const threeWays = normalizeThreeWays(voies);
  const challenge: DevilsAdvocateChallenge = {
    facts: arr(parsed.challenge?.facts),
    risks: arr(parsed.challenge?.risks),
    conditions: arr(parsed.challenge?.conditions),
  };

  // Le positionnement implique toujours des choix → au moins un chemin (D25).
  const flattened: SolutionPath[] = voies
    .map((v) => ({ title: v.label, description: v.description, actions: v.conditions }))
    .filter((sp) => sp.title !== "" || sp.description !== "");
  const solutionPaths = guaranteeSolutionPath(flattened, true);

  const sources: SourceCitation[] = [
    {
      claim: "Lecture de positionnement concurrentiel.",
      source: "Raisonnement E5 (La Vigie)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Raisonnement stratégique sur les données concurrentielles réelles collectées (N1 open data) — lecture, pas une donnée mesurée.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Positionnement — 3 voies (E5 · La Vigie 🔀😈)", contentMd: parsed.summary_md ?? "", type: "positioning_three_ways" },
      structuredData: { positioning_three_ways: voies },
      challenge,
      threeWays,
      solutionPaths,
      sources,
      scores: { qualitySelf: clampScore(80), vectorContributions: {} },
      // Synthèse/contradiction sur les données N1 réelles — palier de raisonnement (2).
      telemetry: { researchDepthReached: 2, modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)] },
    },
    obstacleDetected: true,
  };
};
