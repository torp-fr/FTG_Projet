/**
 * Handler task_type = idea_intake_structuring (tier petit, Porte A / P0-J0).
 * Structure une idée déposée en fiche standardisée. Aucun jugement, aucune source
 * marché (pure mise en forme).
 */
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { IDEA_INTAKE_STRUCTURING_SYSTEM } from "../prompts/idea-intake-structuring.js";
import { RESEARCH_DEPTH_V1 } from "../grounding.js";

interface IntakeJson {
  idea_card?: Record<string, unknown>;
  summary_md?: string;
  quality_self?: number;
}

export const ideaIntakeStructuring: TaskHandler = async (input, deps) => {
  const userPrompt = [
    "Idée déposée (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Structure cette idée en fiche standardisée, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("petit", IDEA_INTAKE_STRUCTURING_SYSTEM, userPrompt);
  const parsed = parseJsonObject<IntakeJson>(raw);

  return {
    partial: {
      deliverable: {
        title: "Fiche d'idée structurée (E3 · La Forge)",
        contentMd: parsed.summary_md ?? "",
        type: "idea_intake",
      },
      structuredData: { idea_card: parsed.idea_card ?? {} },
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: {} },
      telemetry: {
        researchDepthReached: RESEARCH_DEPTH_V1,
        modelCalls: [modelCallEntry("petit", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
