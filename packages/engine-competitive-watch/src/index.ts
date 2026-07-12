/**
 * @ftg/engine-competitive-watch — Engine E5 « La Vigie » (Chantier 5, Lot 3).
 *
 * Cartographie concurrentielle sur DONNÉES RÉELLES (Recherche d'Entreprises, Sirene,
 * Pappers, BODACC via @ftg/data-sources), waterfall réel, avocat du diable (😈), 3 voies
 * de positionnement (🔀). Conforme au contrat @ftg/engine-sdk. Entrée : runCompetitiveWatch().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./deps.js";

export { competitorMapping } from "./task-handlers/competitorMapping.js";
export { financialHealth } from "./task-handlers/financialHealth.js";
export { vitalitySignals } from "./task-handlers/vitalitySignals.js";
export { pricingSurvey } from "./task-handlers/pricingSurvey.js";
export { reviewMining } from "./task-handlers/reviewMining.js";
export { positioningThreeWays } from "./task-handlers/positioningThreeWays.js";

export { ACTIVITY_DERIVATION_SYSTEM } from "./prompts/activity-derivation.js";
export { ABSENCE_CHALLENGE_SYSTEM } from "./prompts/absence-challenge.js";
export { POSITIONING_THREE_WAYS_SYSTEM } from "./prompts/positioning-three-ways.js";
