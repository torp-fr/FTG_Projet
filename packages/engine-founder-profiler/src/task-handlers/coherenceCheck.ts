/**
 * Handler task_type = coherence_check (tier intermédiaire).
 * Repère les tensions internes et produit des questions de clarification — jamais une
 * validation complaisante. Une incohérence appelle une clarification, pas un
 * solution_path (obstacleDetected reste false).
 */
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  serializeDeclaredInput,
  type TaskHandler,
} from "../llm-client.js";
import { COHERENCE_CHECK_SYSTEM } from "../prompts/coherence-check.js";

interface CoherenceJson {
  coherent?: boolean;
  incoherences?: string[];
  clarification_questions?: string[];
  summary_md?: string;
  quality_self?: number;
}

export const coherenceCheck: TaskHandler = async (input, deps) => {
  const userPrompt = `${serializeDeclaredInput(input)}\n\nRepère les tensions internes et pose des questions de clarification, selon le schéma JSON.`;
  const raw = await deps.callModel("intermediaire", COHERENCE_CHECK_SYSTEM, userPrompt);
  const parsed = parseJsonObject<CoherenceJson>(raw);

  const coherent = parsed.coherent !== false; // true sauf si explicitement false
  const incoherences = Array.isArray(parsed.incoherences) ? parsed.incoherences : [];
  const clarifications = Array.isArray(parsed.clarification_questions)
    ? parsed.clarification_questions
    : [];

  return {
    partial: {
      deliverable: {
        title: "Contrôle de cohérence (E1 · Le Miroir)",
        contentMd: parsed.summary_md ?? "",
        type: "coherence_check",
      },
      structuredData: { coherent, incoherences },
      reservesSuggested: incoherences,
      followupsSuggested: clarifications,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: { V1: 0 } },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)],
      },
    },
    // Une incohérence relève de la clarification, pas d'un obstacle de faisabilité :
    // le contrat D25 (solution_path obligatoire) ne s'applique donc pas ici.
    obstacleDetected: false,
  };
};
