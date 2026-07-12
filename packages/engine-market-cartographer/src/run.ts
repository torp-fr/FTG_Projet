/**
 * Point d'entrée de l'engine E4 « Le Cartographe » : dispatch sur input.taskType, assemble
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
import type { E4Deps, E4Handler } from "./deps.js";
import { scopeDefinition } from "./task-handlers/scopeDefinition.js";
import { marketSizing } from "./task-handlers/marketSizing.js";
import { trendAnalysis } from "./task-handlers/trendAnalysis.js";
import { segmentationPersonas } from "./task-handlers/segmentationPersonas.js";
import { fullReportAssembly } from "./task-handlers/fullReportAssembly.js";

const HANDLERS: Record<string, E4Handler> = {
  scope_definition: scopeDefinition,
  market_sizing: marketSizing,
  trend_analysis: trendAnalysis,
  segmentation_personas: segmentationPersonas,
  full_report_assembly: fullReportAssembly,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "market_study" },
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

export async function runMarketCartographer(
  input: EngineInputEnvelope,
  deps: Partial<E4Deps> = {},
): Promise<EngineOutputEnvelope> {
  const resolved: E4Deps = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
    sources: deps.sources ?? createDataSources(),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runMarketCartographer: task_type non supporté par E4 « ${input.taskType} ». ` +
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
      `runMarketCartographer: enveloppe de sortie non conforme au contrat engine-sdk ` +
        `(${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
