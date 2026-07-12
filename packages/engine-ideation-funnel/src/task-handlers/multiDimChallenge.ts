/**
 * Handler task_type = multi_dim_challenge (tier FRONTIER, 😈 avocat du diable).
 * Remplit le bloc `challenge` de l'enveloppe (facts/risks/conditions) et propose des
 * variantes latérales (threeWays + solutionPaths). JAMAIS de jugement de faisabilité.
 */
import type {
  DevilsAdvocateChallenge,
  SolutionPath,
  SourceCitation,
} from "@ftg/engine-sdk";
import {
  clampScore,
  guaranteeSolutionPath,
  modelCallEntry,
  normalizeThreeWays,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { MULTI_DIM_CHALLENGE_SYSTEM } from "../prompts/multi-dim-challenge.js";
import { RESEARCH_DEPTH_V1, groundingV1Source } from "../grounding.js";

interface VariantJson {
  label?: string;
  description?: string;
  risks?: unknown;
  conditions?: unknown;
}
interface ChallengeJson {
  challenge?: { facts?: unknown; risks?: unknown; conditions?: unknown };
  lateral_variants?: VariantJson[];
  summary_md?: string;
  quality_self?: number;
}

function asStrArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const multiDimChallenge: TaskHandler = async (input, deps) => {
  const userPrompt = [
    "Idée(s) à challenger (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Challenge multi-dimensions : pose faits + risques + conditions, propose des variantes latérales. Selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("frontier", MULTI_DIM_CHALLENGE_SYSTEM, userPrompt);
  const parsed = parseJsonObject<ChallengeJson>(raw);

  const challenge: DevilsAdvocateChallenge = {
    facts: asStrArray(parsed.challenge?.facts),
    risks: asStrArray(parsed.challenge?.risks),
    conditions: asStrArray(parsed.challenge?.conditions),
  };

  const variants = (parsed.lateral_variants ?? []).map((v) => ({
    label: typeof v.label === "string" ? v.label : "",
    description: typeof v.description === "string" ? v.description : "",
    risks: asStrArray(v.risks),
    conditions: asStrArray(v.conditions),
  }));

  const threeWays = normalizeThreeWays(variants);
  const flattened: SolutionPath[] = variants
    .map((v) => ({ title: v.label, description: v.description, actions: v.conditions }))
    .filter((sp) => sp.title !== "" || sp.description !== "");

  // Un challenge qui pose des risques est un obstacle → au moins une variante (D25).
  const obstacleDetected = challenge.risks.length > 0 || variants.length > 0;
  const solutionPaths = guaranteeSolutionPath(flattened, obstacleDetected);

  const sources: SourceCitation[] = [
    groundingV1Source(deps.now(), "Densité concurrentielle / saturation évoquée dans le challenge."),
  ];

  return {
    partial: {
      deliverable: {
        title: "Challenge avocat du diable (E3 · La Forge 😈)",
        contentMd: parsed.summary_md ?? "",
        type: "multi_dim_challenge",
      },
      structuredData: { lateral_variants: variants },
      challenge,
      threeWays,
      solutionPaths,
      sources,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: {} },
      telemetry: {
        researchDepthReached: RESEARCH_DEPTH_V1,
        modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)],
      },
    },
    obstacleDetected,
  };
};
