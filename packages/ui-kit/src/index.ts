/**
 * @ftg/ui-kit — source UNIQUE des composants UI des 3 apps FTG (JC-09).
 * Purement présentationnel : aucune dépendance app / DB / framework serveur.
 * L'habillage (JC-08b) se fait via src/tokens.css + le preset Tailwind (une seule édition).
 */
export * from "./verdicts";
export * from "./types";
export { VerdictBadge } from "./components/VerdictBadge";
export { StateBadge, RunStatusBadge } from "./components/StateBadge";
export { PhaseDag } from "./components/PhaseDag";
export { DeliverableBody, ScoreBar } from "./components/DeliverableBody";
export { Section } from "./components/Section";
export { StatTile } from "./components/StatTile";
export { ProgressHero } from "./components/ProgressHero";
export { AgentBoard } from "./components/AgentBoard";
