/**
 * @ftg/engine-tax-educator — Engine E8 « Le Fiscaliste » (Chantier 5, cadre D7/A5.8).
 *
 * Fiscal & imposition sur DONNÉES RÉELLES : cours 3 niveaux ancré sur les barèmes datés
 * du @ftg/deterministic-core, calendrier fiscal, simulation (cotisations/IR-IS/PFU/TVA via
 * deterministic_core — zéro chiffre LLM), alertes de seuils. POSTURE STRICTE : information
 * fiscale générale, jamais d'optimisation personnalisée (gardes checkLegalAdviceNeutrality +
 * checkTaxAdviceNeutrality appliquées par run.ts) ; disclaimer + renvoi professionnel NON
 * désactivables. Entrée : runTaxEducator().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./deps.js";
export { baremesForActivity, type Baremes } from "./baremes.js";

export { taxCourseGeneration } from "./task-handlers/taxCourseGeneration.js";
export { taxCalendar } from "./task-handlers/taxCalendar.js";
export { taxSimulation } from "./task-handlers/taxSimulation.js";
export { thresholdAlerts } from "./task-handlers/thresholdAlerts.js";

export { TAX_POSTURE_PREAMBLE } from "./prompts/posture.js";
export { TAX_COURSE_SYSTEM } from "./prompts/tax-course.js";
export { TAX_CALENDAR_SYSTEM } from "./prompts/tax-calendar.js";
