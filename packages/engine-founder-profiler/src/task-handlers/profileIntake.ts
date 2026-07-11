/**
 * Handler task_type = profile_intake (tier petit).
 * Structure les réponses brutes du porteur ; ne remplit que les morceaux d'enveloppe
 * qui le concernent (cadrage). Aucun obstacle "solution_path" à ce stade.
 */
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  serializeDeclaredInput,
  type TaskHandler,
} from "../llm-client.js";
import { PROFILE_INTAKE_SYSTEM } from "../prompts/profile-intake.js";

interface IntakeJson {
  competencies?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  engagement?: Record<string, unknown>;
  risk_appetite?: string;
  summary_md?: string;
  followups?: string[];
  quality_self?: number;
}

export const profileIntake: TaskHandler = async (input, deps) => {
  const userPrompt = `${serializeDeclaredInput(input)}\n\nStructure ce profil selon le schéma JSON.`;
  const raw = await deps.callModel("petit", PROFILE_INTAKE_SYSTEM, userPrompt);
  const parsed = parseJsonObject<IntakeJson>(raw);

  return {
    partial: {
      deliverable: {
        title: "Cadrage du profil porteur (E1 · Le Miroir)",
        contentMd: parsed.summary_md ?? "",
        type: "founder_profile_intake",
      },
      structuredData: {
        competencies: parsed.competencies ?? {},
        resources: parsed.resources ?? {},
        constraints: parsed.constraints ?? {},
        engagement: parsed.engagement ?? {},
        risk_appetite: parsed.risk_appetite ?? null,
      },
      followupsSuggested: Array.isArray(parsed.followups) ? parsed.followups : [],
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: { V1: 0 } },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("petit", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
