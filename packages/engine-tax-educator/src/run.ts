/**
 * Point d'entrée de l'engine E8 « Le Fiscaliste » : dispatch sur input.taskType, assemble
 * l'enveloppe, INJECTE les garde-fous NON désactivables (disclaimer + renvoi professionnel
 * P5-J2), puis VALIDE contre le contrat @ftg/engine-sdk ET contre les gardes anti-conseil
 * (checkLegalAdviceNeutrality) et anti-optimisation fiscale (checkTaxAdviceNeutrality) AVANT
 * de retourner. Une enveloppe non conforme — y compris un terme d'optimisation personnalisée
 * — lève une erreur.
 */
import {
  validateOutputEnvelope,
  checkLegalAdviceNeutrality,
  checkTaxAdviceNeutrality,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
} from "@ftg/engine-sdk";
import { createDataSources } from "@ftg/data-sources";
import { DISCLAIMER_TEXT, PROFESSIONAL_REFERRAL, referralSource, type E8Deps, type E8Handler } from "./deps.js";
import { taxCourseGeneration } from "./task-handlers/taxCourseGeneration.js";
import { taxCalendar } from "./task-handlers/taxCalendar.js";
import { taxSimulation } from "./task-handlers/taxSimulation.js";
import { thresholdAlerts } from "./task-handlers/thresholdAlerts.js";

const HANDLERS: Record<string, E8Handler> = {
  tax_course_generation: taxCourseGeneration,
  tax_calendar: taxCalendar,
  tax_simulation: taxSimulation,
  threshold_alerts: thresholdAlerts,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "tax_education" },
    structuredData: {},
    sources: [],
    scores: { qualitySelf: 0, vectorContributions: {} },
    reservesSuggested: [],
    solutionPaths: [],
    pedagogy: {},
    followupsSuggested: [],
    telemetry: { researchDepthReached: 1, modelCalls: [] },
  };
  return { ...base, ...partial, telemetry: { ...base.telemetry, ...(partial.telemetry ?? {}) } };
}

export async function runTaxEducator(
  input: EngineInputEnvelope,
  deps: Partial<E8Deps> = {},
): Promise<EngineOutputEnvelope> {
  const resolved: E8Deps = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
    sources: deps.sources ?? createDataSources(),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runTaxEducator: task_type non supporté par E8 « ${input.taskType} ». Attendus : ${Object.keys(HANDLERS).join(", ")}.`,
    );
  }

  const { partial, obstacleDetected } = await handler(input, resolved);
  const envelope = mergeEnvelope(partial);
  const now = resolved.now();

  // Garde-fous NON désactivables (D7/A5.8) — injectés APRÈS le handler.
  envelope.structuredData = {
    ...envelope.structuredData,
    disclaimers: { text: DISCLAIMER_TEXT, on_every_deliverable: true },
    professional_referral: PROFESSIONAL_REFERRAL,
  };
  envelope.deliverable = {
    ...envelope.deliverable,
    contentMd: `${envelope.deliverable.contentMd}\n\n---\n${DISCLAIMER_TEXT}\n\n${PROFESSIONAL_REFERRAL.message}`,
  };
  envelope.sources = [...envelope.sources, referralSource(now)];

  // Contrat standard + garde anti-conseil juridique + garde anti-optimisation fiscale (E8).
  const violations = validateOutputEnvelope(envelope, {
    researchDepthMin: input.constraints.researchDepthMin,
    obstacleDetected,
  });
  violations.push(...checkLegalAdviceNeutrality(envelope.deliverable.contentMd));
  violations.push(...checkTaxAdviceNeutrality(envelope.deliverable.contentMd));

  if (violations.length > 0) {
    throw new Error(
      `runTaxEducator: enveloppe de sortie non conforme (${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
