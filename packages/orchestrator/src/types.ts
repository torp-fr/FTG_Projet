/**
 * @ftg/orchestrator — types partagés, miroir léger du schéma Chantier 4 §1.
 * Ces types décrivent la forme des données consommées par les 5 composants
 * (Sequencer, Router, Diffuser, Gatekeeper, Supervisor) sans dépendre du
 * client Supabase généré — permet de tester chaque composant en pur/fixture
 * (cf. packages/orchestrator/test/), condition du critère de fin de Lot 1.
 */

export type MilestoneState =
  | "locked"
  | "available"
  | "recommended"
  | "in_progress"
  | "awaiting_proof"
  | "awaiting_review"
  | "done"
  | "forced";

export type GateVerdict =
  | "validated"
  | "validated_with_reserves"
  | "conditions_not_met"
  | "alternatives_detected"
  | "facts_and_options";

export type Vector = "V1" | "V2" | "V3" | "V4" | "V5" | "V6";

export interface MilestoneDef {
  id: string;
  code: string;
  phaseCode: string;
  branch?: "digital" | "physical" | "service" | null;
}

export interface DependencyDef {
  milestoneCode: string;
  dependsOnCode: string;
  hardness: "hard" | "soft";
}

export interface GateDef {
  code: string;
  phaseCode: string;
  weights: Partial<Record<Vector, number>>;
  threshold: number | null;
  criticalFloors: Partial<Record<Vector, number>>;
  verdictPolicy: {
    pivot_enabled?: boolean;
    arret_enabled?: boolean;
    max_reserves?: number;
    mandatory_milestone?: string;
    binary_proof?: string;
  };
}

/** Instance jalon pour UN projet — le cache matérialisé (jamais source de vérité pour locked/available). */
export interface ProjectMilestoneRecord {
  milestoneCode: string;
  state: MilestoneState;
  qualityScore?: number | null;
}

export interface GateEvaluationRecord {
  gateCode: string;
  verdict: GateVerdict;
  computedScores: Partial<Record<Vector, number>> & { composite?: number };
}
