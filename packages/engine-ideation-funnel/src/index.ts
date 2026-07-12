/**
 * @ftg/engine-ideation-funnel — Engine E3 « La Forge » (Chantier 5).
 *
 * Idéation & entonnoir : Porte A/B, entonnoir tracé (funnel_journal), avocat du diable
 * (😈), règle des 3 (🔀). Grounding V1 honnête (sources isEstimate, waterfall ≥ 3 au
 * Lot 3). Conforme au contrat @ftg/engine-sdk. Entrée : runIdeationFunnel().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./grounding.js";

export { ideaIntakeStructuring } from "./task-handlers/ideaIntakeStructuring.js";
export { ideaGeneration } from "./task-handlers/ideaGeneration.js";
export { hardFilter } from "./task-handlers/hardFilter.js";
export { multiDimChallenge } from "./task-handlers/multiDimChallenge.js";
export { preFeasibilityScoring } from "./task-handlers/preFeasibilityScoring.js";
export { selectionBrief } from "./task-handlers/selectionBrief.js";

export { IDEA_INTAKE_STRUCTURING_SYSTEM } from "./prompts/idea-intake-structuring.js";
export { IDEA_GENERATION_SYSTEM } from "./prompts/idea-generation.js";
export { HARD_FILTER_SYSTEM } from "./prompts/hard-filter.js";
export { MULTI_DIM_CHALLENGE_SYSTEM } from "./prompts/multi-dim-challenge.js";
export { PRE_FEASIBILITY_SCORING_SYSTEM } from "./prompts/pre-feasibility-scoring.js";
export { SELECTION_BRIEF_SYSTEM } from "./prompts/selection-brief.js";
