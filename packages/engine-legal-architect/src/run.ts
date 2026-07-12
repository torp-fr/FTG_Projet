/**
 * Point d'entrée de l'engine E7 « L'Architecte » : dispatch sur input.taskType, assemble
 * l'enveloppe, INJECTE les garde-fous NON désactivables (disclaimer + renvoi professionnel
 * P5-J2 sur CHAQUE livrable), puis VALIDE contre le contrat @ftg/engine-sdk ET contre la
 * garde anti-conseil juridique (checkLegalAdviceNeutrality) AVANT de retourner. Une
 * enveloppe non conforme — y compris un terme de conseil personnalisé — lève une erreur.
 */
import {
  validateOutputEnvelope,
  checkLegalAdviceNeutrality,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
} from "@ftg/engine-sdk";
import { createDataSources } from "@ftg/data-sources";
import {
  DISCLAIMER_TEXT,
  PROFESSIONAL_REFERRAL,
  referralSource,
  type E7Deps,
  type E7Handler,
} from "./deps.js";
import { statusComparator } from "./task-handlers/statusComparator.js";
import { regulatoryChecklist } from "./task-handlers/regulatoryChecklist.js";
import { registrationGuide } from "./task-handlers/registrationGuide.js";
import { siretVerification } from "./task-handlers/siretVerification.js";
import { contractsKitGeneration } from "./task-handlers/contractsKitGeneration.js";

const HANDLERS: Record<string, E7Handler> = {
  status_comparator: statusComparator,
  regulatory_checklist: regulatoryChecklist,
  registration_guide: registrationGuide,
  siret_verification: siretVerification,
  contracts_kit_generation: contractsKitGeneration,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "legal_structure" },
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

export async function runLegalArchitect(
  input: EngineInputEnvelope,
  deps: Partial<E7Deps> = {},
): Promise<EngineOutputEnvelope> {
  const resolved: E7Deps = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
    sources: deps.sources ?? createDataSources(),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runLegalArchitect: task_type non supporté par E7 « ${input.taskType} ». ` +
        `Attendus : ${Object.keys(HANDLERS).join(", ")}.`,
    );
  }

  const { partial, obstacleDetected } = await handler(input, resolved);
  const envelope = mergeEnvelope(partial);
  const now = resolved.now();

  // Garde-fous NON désactivables (D7/A5.8) — injectés APRÈS le handler (impossible à retirer) :
  // disclaimer + renvoi professionnel P5-J2 sur CHAQUE livrable, + rappel dans le texte + une citation.
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

  // Validation standard du contrat (neutralité faisabilité, waterfall, sourcing, D25)…
  const violations = validateOutputEnvelope(envelope, {
    researchDepthMin: input.constraints.researchDepthMin,
    obstacleDetected,
  });
  // …PLUS la garde anti-conseil juridique personnalisé (D7/A5.8), spécifique à E7.
  violations.push(...checkLegalAdviceNeutrality(envelope.deliverable.contentMd));

  if (violations.length > 0) {
    throw new Error(
      `runLegalArchitect: enveloppe de sortie non conforme (${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
