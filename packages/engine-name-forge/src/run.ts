/**
 * Point d'entrée de l'engine E9 « L'Éponyme » : dispatch sur input.taskType, assemble
 * l'enveloppe, INJECTE les garde-fous NON désactivables (disclaimer marques + renvoi
 * antériorité pro), puis VALIDE contre le contrat @ftg/engine-sdk ET contre la garde
 * anti-sur-affirmation (checkNamingCertainty : jamais « juridiquement sûr ») AVANT de
 * retourner. Enveloppe non conforme → erreur.
 */
import {
  validateOutputEnvelope,
  callModel,
  type EngineInputEnvelope,
  type EngineOutputEnvelope,
} from "@ftg/engine-sdk";
import { createDataSources } from "@ftg/data-sources";
import {
  DISCLAIMER_TEXT,
  PROFESSIONAL_REFERRAL,
  checkNamingCertainty,
  referralSource,
  type E9Deps,
  type E9Handler,
} from "./deps.js";
import { nameGeneration } from "./task-handlers/nameGeneration.js";
import { availabilityCheck } from "./task-handlers/availabilityCheck.js";
import { shortlistChallenge } from "./task-handlers/shortlistChallenge.js";
import { securingGuide } from "./task-handlers/securingGuide.js";

const HANDLERS: Record<string, E9Handler> = {
  name_generation: nameGeneration,
  availability_check: availabilityCheck,
  shortlist_challenge: shortlistChallenge,
  securing_guide: securingGuide,
};

function mergeEnvelope(partial: Partial<EngineOutputEnvelope>): EngineOutputEnvelope {
  const base: EngineOutputEnvelope = {
    deliverable: { title: "", contentMd: "", type: "naming_report" },
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

export async function runNameForge(
  input: EngineInputEnvelope,
  deps: Partial<E9Deps> = {},
): Promise<EngineOutputEnvelope> {
  const resolved: E9Deps = {
    callModel: deps.callModel ?? callModel,
    now: deps.now ?? (() => new Date().toISOString()),
    sources: deps.sources ?? createDataSources(),
  };

  const handler = HANDLERS[input.taskType];
  if (!handler) {
    throw new Error(
      `runNameForge: task_type non supporté par E9 « ${input.taskType} ». Attendus : ${Object.keys(HANDLERS).join(", ")}.`,
    );
  }

  const { partial, obstacleDetected } = await handler(input, resolved);
  const envelope = mergeEnvelope(partial);
  const now = resolved.now();

  // Contenu PRODUIT PAR LE HANDLER (avant injection du disclaimer) — c'est lui qu'on
  // soumet à la garde anti-sur-affirmation (le disclaimer est un texte engine, connu sûr).
  const handlerContent = envelope.deliverable.contentMd;

  // Garde-fous NON désactivables — injectés APRÈS le handler.
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

  // Contrat standard + garde anti-sur-affirmation de sécurité juridique (jamais « sûr »).
  const violations = validateOutputEnvelope(envelope, {
    researchDepthMin: input.constraints.researchDepthMin,
    obstacleDetected,
  });
  violations.push(...checkNamingCertainty(handlerContent));

  if (violations.length > 0) {
    throw new Error(
      `runNameForge: enveloppe de sortie non conforme (${violations.length} violation(s)) — ` +
        violations.map((v) => `[${v.rule}] ${v.detail}`).join(" ; "),
    );
  }

  return envelope;
}
