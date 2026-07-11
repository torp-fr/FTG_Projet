/**
 * @ftg/engine-founder-project-matcher — Engine E2 « La Boussole » (Chantier 5).
 *
 * Scoring V3 de cohérence incarnation↔projet + gap bridging 3 voies. Conforme au
 * contrat @ftg/engine-sdk. Point d'entrée principal : runFounderProjectMatcher().
 */
export * from "./run.js";
export * from "./db-writes.js";

export { requirementsExtraction } from "./task-handlers/requirementsExtraction.js";
export { matchScoring } from "./task-handlers/matchScoring.js";
export { gapBridging } from "./task-handlers/gapBridging.js";

export { REQUIREMENTS_EXTRACTION_SYSTEM } from "./prompts/requirements-extraction.js";
export { MATCH_SCORING_SYSTEM } from "./prompts/match-scoring.js";
export { GAP_BRIDGING_SYSTEM } from "./prompts/gap-bridging.js";
