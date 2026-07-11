/**
 * Handler task_type = ambition_calibration (tier intermédiaire).
 * Calibre le profil d'ambition et lit l'écart ambition/moyens. Si un écart est détecté,
 * le contrat D25 est garanti côté engine (au moins un solution_path).
 */
import {
  clampScore,
  guaranteeSolutionPath,
  modelCallEntry,
  normalizeSolutionPaths,
  parseJsonObject,
  serializeDeclaredInput,
  type TaskHandler,
} from "../llm-client.js";
import { AMBITION_CALIBRATION_SYSTEM } from "../prompts/ambition-calibration.js";

interface AmbitionJson {
  ambition_profile?: string;
  ambition_moyens_gap?: { detected?: boolean; reading?: string };
  solution_paths?: unknown;
  summary_md?: string;
  quality_self?: number;
}

export const ambitionCalibration: TaskHandler = async (input, deps) => {
  const userPrompt = `${serializeDeclaredInput(input)}\n\nCalibre le profil d'ambition et lis l'écart ambition/moyens, selon le schéma JSON.`;
  const raw = await deps.callModel("intermediaire", AMBITION_CALIBRATION_SYSTEM, userPrompt);
  const parsed = parseJsonObject<AmbitionJson>(raw);

  const gapDetected = Boolean(parsed.ambition_moyens_gap?.detected);
  const solutionPaths = guaranteeSolutionPath(
    normalizeSolutionPaths(parsed.solution_paths),
    gapDetected,
  );

  return {
    partial: {
      deliverable: {
        title: "Calibrage d'ambition (E1 · Le Miroir)",
        contentMd: parsed.summary_md ?? "",
        type: "ambition_calibration",
      },
      structuredData: {
        ambition_profile: parsed.ambition_profile ?? null,
        ambition_moyens_gap: {
          detected: gapDetected,
          reading: parsed.ambition_moyens_gap?.reading ?? "",
        },
      },
      solutionPaths,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: { V1: 0 } },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: gapDetected,
  };
};
