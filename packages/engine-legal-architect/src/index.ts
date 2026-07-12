/**
 * @ftg/engine-legal-architect — Engine E7 « L'Architecte » (Chantier 5, cadre D7/A5.8).
 *
 * Structure juridique sur DONNÉES RÉELLES : comparateur de statuts via @ftg/deterministic-core
 * (chiffres déterministes, zéro chiffre LLM), Légifrance daté (PISTE OAuth), vérif SIRET
 * Sirene. POSTURE STRICTE : information & guidage, jamais de conseil juridique personnalisé
 * (garde checkLegalAdviceNeutrality appliquée par run.ts) ; disclaimer + renvoi professionnel
 * NON désactivables sur chaque livrable. Entrée : runLegalArchitect().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./deps.js";

export { statusComparator } from "./task-handlers/statusComparator.js";
export { regulatoryChecklist } from "./task-handlers/regulatoryChecklist.js";
export { registrationGuide } from "./task-handlers/registrationGuide.js";
export { siretVerification } from "./task-handlers/siretVerification.js";
export { contractsKitGeneration } from "./task-handlers/contractsKitGeneration.js";

export { LEGAL_POSTURE_PREAMBLE } from "./prompts/posture.js";
export { STATUS_COMPARATOR_SYSTEM } from "./prompts/status-comparator.js";
export { REGULATORY_CHECKLIST_SYSTEM } from "./prompts/regulatory-checklist.js";
export { REGISTRATION_GUIDE_SYSTEM } from "./prompts/registration-guide.js";
export { CONTRACTS_KIT_SYSTEM } from "./prompts/contracts-kit.js";
