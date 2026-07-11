/**
 * @ftg/engine-founder-profiler — Engine E1 « Le Miroir » (Chantier 5).
 *
 * Premier engine réel : appels LLM (Anthropic) + écritures Supabase, conforme au
 * contrat @ftg/engine-sdk. Point d'entrée principal : runFounderProfiler().
 */
export * from "./llm-client.js";
export * from "./run.js";
export * from "./db-writes.js";

export { profileIntake } from "./task-handlers/profileIntake.js";
export { coherenceCheck } from "./task-handlers/coherenceCheck.js";
export { ambitionCalibration } from "./task-handlers/ambitionCalibration.js";
export { incarnationReport } from "./task-handlers/incarnationReport.js";

export { PROFILE_INTAKE_SYSTEM } from "./prompts/profile-intake.js";
export { COHERENCE_CHECK_SYSTEM } from "./prompts/coherence-check.js";
export { AMBITION_CALIBRATION_SYSTEM } from "./prompts/ambition-calibration.js";
export { INCARNATION_REPORT_SYSTEM } from "./prompts/incarnation-report.js";
