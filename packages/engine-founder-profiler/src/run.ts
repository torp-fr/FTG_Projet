/**
 * Point d'entrée de l'engine E1 : dispatch sur input.taskType vers le bon handler,
 * assemble l'enveloppe de sortie et la VALIDE contre le contrat @ftg/engine-sdk avant
 * de la renvoyer. Une enveloppe non conforme lève une erreur explicite — jamais de
 * sortie hors-contrat.
 */
import {
  validateOutputEnvelope,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
} from "@ftg/engine-sdk";
import { callModel, type EngineDeps, type TaskHandler } from "./llm-client.js";
import { profileIntake } from "./task-handlers/profileIntake.js";
import { coherenceCheck } from "./task-handlers/coherenceCheck.js";
import { ambitionCalibration } from "./task-handlers/ambitionCalibration.js";
import { incarnationReport } from "./task-handlers/incarnationReport.js";

const HANDLERS: Record<string, TaskHandler> = {
  profile_intake: profileIntake,
  coherence_check: coherenceCheck,
  ambition_calibration: ambitionCalibration,
  incarnation_report: incarnationReport,
};

/** Fusionne les morceaux produits par un handler dans une enveloppe complète et valide. */
function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "founder_profile" },
    structuredData: {},
    sources: [],
    scores: { qualitySelf: 0, vectorContributions: {} },
    reservesSuggested: [],
    solutionPaths: [],
    pedagogy: {},
    followupsSuggested: [],
    // E1 est un engine réflexif, pas de recherche : profondeur atteinte = 0.
    telemetry: { researchDepthReached: 0, modelCalls: [] },
  };
  return {
    ...base,
    ...partial,
    telemetry: { ...base.telemetry, ...(partial.telemetry ?? {}) },
  };
}

export async function runFounderProfiler(
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
      `runFounderProfiler: task_type non supporté par E1 « ${input.taskType} ». ` +
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
      `runFounderProfiler: enveloppe de sortie non conforme au contrat engine-sdk ` +
        `(${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
