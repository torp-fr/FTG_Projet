/**
 * Point d'entrée de l'engine E3 « La Forge » : dispatch sur input.taskType, assemble
 * l'enveloppe et la VALIDE contre le contrat @ftg/engine-sdk avant retour. Une
 * enveloppe non conforme lève une erreur — jamais de sortie hors-contrat.
 */
import {
  validateOutputEnvelope,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
  type EngineDeps,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { ideaIntakeStructuring } from "./task-handlers/ideaIntakeStructuring.js";
import { ideaGeneration } from "./task-handlers/ideaGeneration.js";
import { hardFilter } from "./task-handlers/hardFilter.js";
import { multiDimChallenge } from "./task-handlers/multiDimChallenge.js";
import { preFeasibilityScoring } from "./task-handlers/preFeasibilityScoring.js";
import { selectionBrief } from "./task-handlers/selectionBrief.js";

const HANDLERS: Record<string, TaskHandler> = {
  idea_intake_structuring: ideaIntakeStructuring,
  idea_generation: ideaGeneration,
  hard_filter: hardFilter,
  multi_dim_challenge: multiDimChallenge,
  pre_feasibility_scoring: preFeasibilityScoring,
  selection_brief: selectionBrief,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "idea_portfolio" },
    structuredData: {},
    sources: [],
    scores: { qualitySelf: 0, vectorContributions: {} },
    reservesSuggested: [],
    solutionPaths: [],
    pedagogy: {},
    followupsSuggested: [],
    // E3 V1 : raisonnement paramétrique (profondeur 1), pas de waterfall connecté.
    telemetry: { researchDepthReached: 1, modelCalls: [] },
  };
  return {
    ...base,
    ...partial,
    telemetry: { ...base.telemetry, ...(partial.telemetry ?? {}) },
  };
}

export async function runIdeationFunnel(
  input: EngineInputEnvelope,
  deps: EngineDeps = { callModel },
): Promise<EngineOutputEnvelope> {
  const resolved: Required<EngineDeps> = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runIdeationFunnel: task_type non supporté par E3 « ${input.taskType} ». ` +
        `Attendus : ${Object.keys(HANDLERS).join(", ")}.`,
    );
  }

  const { partial, obstacleDetected } = await handler(input, resolved);
  const envelope = mergeEnvelope(partial);

  const violations = validateOutputEnvelope(envelope, {
    researchDepthMin: input.constraints.researchDepthMin,
    obstacleDetected,
  });
  if (violations.length > 0) {
    throw new Error(
      `runIdeationFunnel: enveloppe de sortie non conforme au contrat engine-sdk ` +
        `(${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
