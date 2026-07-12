/**
 * @ftg/engine-name-forge — Engine E9 « L'Éponyme » (Chantier 5, Lot 3).
 *
 * Naming sur DONNÉES RÉELLES : génération de candidats, vérification de disponibilité
 * (domaines RDAP + dénomination Recherche d'Entreprises RÉELS horodatés ; marques
 * INDICATIF Pappers/URL INPI ; handles best-effort), shortlist challengée (🔀😈), guide
 * de sécurisation + procédure PI (classes de Nice) avec point de ré-entrée pi_status.
 * Garde-fous : jamais « juridiquement sûr », disclaimer + renvoi antériorité pro non
 * désactivables. Entrée : runNameForge().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./deps.js";

export { nameGeneration } from "./task-handlers/nameGeneration.js";
export { availabilityCheck } from "./task-handlers/availabilityCheck.js";
export { shortlistChallenge } from "./task-handlers/shortlistChallenge.js";
export { securingGuide } from "./task-handlers/securingGuide.js";

export { NAME_GENERATION_SYSTEM } from "./prompts/name-generation.js";
export { SHORTLIST_CHALLENGE_SYSTEM } from "./prompts/shortlist-challenge.js";
export { SECURING_GUIDE_SYSTEM } from "./prompts/securing-guide.js";
