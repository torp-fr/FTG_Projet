/**
 * Handler task_type = requirements_extraction (tier petit).
 * Extrait ce que le PROJET exige, par dimension, depuis le contexte projet. Aucun
 * obstacle/solution_path à ce stade.
 */
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { REQUIREMENTS_EXTRACTION_SYSTEM } from "../prompts/requirements-extraction.js";

interface RequirementsJson {
  requirements?: {
    competences?: string;
    exposition?: string;
    capital?: string;
    rythme?: string;
  };
  summary_md?: string;
  quality_self?: number;
}

export const requirementsExtraction: TaskHandler = async (input, deps) => {
  const userPrompt = [
    "Contexte projet (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Extrais les exigences du projet par dimension, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("petit", REQUIREMENTS_EXTRACTION_SYSTEM, userPrompt);
  const parsed = parseJsonObject<RequirementsJson>(raw);

  const requirements = {
    competences: parsed.requirements?.competences ?? "",
    exposition: parsed.requirements?.exposition ?? "",
    capital: parsed.requirements?.capital ?? "",
    rythme: parsed.requirements?.rythme ?? "",
  };

  return {
    partial: {
      deliverable: {
        title: "Exigences du projet (E2 · La Boussole)",
        contentMd: parsed.summary_md ?? "",
        type: "project_requirements",
      },
      structuredData: { requirements },
      scores: {
        qualitySelf: clampScore(parsed.quality_self),
        vectorContributions: { V3: 0 },
      },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("petit", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
