/**
 * @ftg/engine-market-cartographer — Engine E4 « Le Cartographe » (Chantier 5, Lot 3).
 *
 * Étude de marché SOURCÉE sur DONNÉES RÉELLES : densité Sirene (comptage par NAF+zone) +
 * tendance BODACC datée (créations vs procédures collectives), sizing macro [E] honnête
 * (INSEE BDM / DataForSEO différés), verdict d'attractivité factuel à double face (😈).
 * Conforme au contrat @ftg/engine-sdk. Entrée : runMarketCartographer().
 */
export * from "./run.js";
export * from "./db-writes.js";
export * from "./deps.js";

export { scopeDefinition } from "./task-handlers/scopeDefinition.js";
export { marketSizing } from "./task-handlers/marketSizing.js";
export { trendAnalysis } from "./task-handlers/trendAnalysis.js";
export { segmentationPersonas } from "./task-handlers/segmentationPersonas.js";
export { fullReportAssembly } from "./task-handlers/fullReportAssembly.js";

export { SCOPE_DEFINITION_SYSTEM } from "./prompts/scope-definition.js";
export { MARKET_SIZING_SYSTEM } from "./prompts/market-sizing.js";
export { TREND_ANALYSIS_SYSTEM } from "./prompts/trend-analysis.js";
export { SEGMENTATION_PERSONAS_SYSTEM } from "./prompts/segmentation-personas.js";
export { FULL_REPORT_SYSTEM } from "./prompts/full-report.js";
