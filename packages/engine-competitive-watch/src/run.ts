/**
 * Point d'entrée de l'engine E5 « La Vigie » : dispatch sur input.taskType, assemble
 * l'enveloppe et la VALIDE contre le contrat @ftg/engine-sdk avant retour. Une enveloppe
 * non conforme lève une erreur — jamais de sortie hors-contrat.
 */
import {
  validateOutputEnvelope,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
} from "@ftg/engine-sdk";
import { createDataSources } from "@ftg/data-sources";
import type { E5Deps, E5Handler } from "./deps.js";
import { competitorMapping } from "./task-handlers/competitorMapping.js";
import { financialHealth } from "./task-handlers/financialHealth.js";
import { vitalitySignals } from "./task-handlers/vitalitySignals.js";
import { pricingSurvey } from "./task-handlers/pricingSurvey.js";
import { reviewMining } from "./task-handlers/reviewMining.js";
import { positioningThreeWays } from "./task-handlers/positioningThreeWays.js";

const HANDLERS: Record<string, E5Handler> = {
  competitor_mapping: competitorMapping,
  financial_health: financialHealth,
  vitality_signals: vitalitySignals,
  pricing_survey: pricingSurvey,
  review_mining: reviewMining,
  positioning_three_ways: positioningThreeWays,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "competitive_map" },
    structuredData: {},
    sources: [],
    scores: { qualitySelf: 0, vectorContributions: {} },
    reservesSuggested: [],
    solutionPaths: [],
    pedagogy: {},
    followupsSuggested: [],
    // Waterfall RÉEL : profondeur atteinte reportée honnêtement par chaque handler.
    telemetry: { researchDepthReached: 1, modelCalls: [] },
  };
  return {
    ...base,
    ...partial,
    telemetry: { ...base.telemetry, ...(partial.telemetry ?? {}) },
  };
}

export async function runCompetitiveWatch(
  input: EngineInputEnvelope,
  deps: Partial<E5Deps> = {},
): Promise<EngineOutputEnvelope> {
  const resolved: E5Deps = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
    sources: deps.sources ?? createDataSources(),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runCompetitiveWatch: task_type non supporté par E5 « ${input.taskType} ». ` +
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
      `runCompetitiveWatch: enveloppe de sortie non conforme au contrat engine-sdk ` +
        `(${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
