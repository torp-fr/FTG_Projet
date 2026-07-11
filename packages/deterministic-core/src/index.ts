/**
 * @ftg/deterministic-core — moteur de simulation financière déterministe (Chantier 5).
 *
 * Composant "deterministic_core" partagé par les futurs engines E7 (Structure
 * juridique) et E8 (Fiscal). Purement déterministe : aucun appel réseau, aucun LLM.
 */

export * from "./types.ts";
export * from "./rates/fr-2026.ts";
export * from "./forecast.ts";
export * from "./status-comparator.ts";
