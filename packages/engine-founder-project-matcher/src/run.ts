/**
 * Point d'entrée de l'engine E2 « La Boussole » : dispatch sur input.taskType,
 * assemble l'enveloppe et la VALIDE contre le contrat @ftg/engine-sdk avant retour.
 * Une enveloppe non conforme lève une erreur — jamais de sortie hors-contrat.
 */
import {
  validateOutputEnvelope,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
  type EngineDeps,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { requirementsExtraction } from "./task-handlers/requirementsExtraction.js";
import { matchScoring } from "./task-handlers/matchScoring.js";
import { gapBridging } from "./task-handlers/gapBridging.js";

const HANDLERS: Record<string, TaskHandler> = {
  requirements_extraction: requirementsExtraction,
  match_scoring: matchScoring,
  gap_bridging: gapBridging,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "match_report" },
    structuredData: {},
    sources: [],
    scores: { qualitySelf: 0, vectorContributions: {} },
    reservesSuggested: [],
    solutionPaths: [],
    pedagogy: {},
    followupsSuggested: [],
    // E2 est un engine de raisonnement (pas de recherche waterfall) : profondeur = 0.
    telemetry: { researchDepthReached: 0, modelCalls: [] },
  };
  return {
    ...base,
    ...partial,
    telemetry: { ...base.telemetry, ...(partial.telemetry ?? {}) },
  };
}

export async function runFounderProjectMatcher(
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
      `runFounderProjectMatcher: task_type non supporté par E2 « ${input.taskType} ». ` +
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
      `runFounderProjectMatcher: enveloppe de sortie non conforme au contrat engine-sdk ` +
        `(${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
