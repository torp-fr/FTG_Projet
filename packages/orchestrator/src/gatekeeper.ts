/**
 * Gatekeeper — Chantier 4 §4 + Chantier 1 §3 (mécanique de verdict)
 *              + Amendement A4/D25 (verdicts reformulés, neutralité factuelle)
 *
 * Calcule les scores composites et les verdicts de gate. SERVEUR UNIQUEMENT
 * (principe #2, Chantier 4 §0) : ce module ne doit jamais être exécuté ni
 * appelable depuis le client — le client ne fait que lire gate_evaluations.
 *
 * Approximations V1 assumées et documentées (à calibrer sur les premières
 * cohortes réelles, cf. Chantier 1 §5 note) :
 *  - Le seuil générique de "vecteur non critique sous plancher" (qui
 *    déclenche VALIDATED_WITH_RESERVES) est fixé à 60 en l'absence d'un
 *    plancher non-critique déclaré par vecteur dans la table `gates`
 *    (seule `critical_floors` existe au schéma v1 — Chantier 4 §1.1).
 *  - ALTERNATIVES_DETECTED (pivot) : déclenché quand V4 spécifiquement
 *    franchit son plancher critique alors que le gate a `pivot_enabled`.
 *  - FACTS_AND_OPTIONS (arrêt) : déclenché quand ≥2 planchers critiques
 *    sont franchis simultanément alors que le gate a `arret_enabled`.
 */

import type {
  GateDef,
  GateEvaluationRecord,
  GateVerdict,
  ProjectMilestoneRecord,
  Vector,
} from "./types.js";

const NON_CRITICAL_RESERVE_THRESHOLD = 60; // cf. note d'approximation V1 ci-dessus

export interface GatekeeperInput {
  gate: GateDef;
  vectorScores: Partial<Record<Vector, number>>;
  projectMilestonesInScope: ProjectMilestoneRecord[];
  /** true si au moins un chemin de solution a été fourni par l'engine amont (D25). */
  solutionPathsAvailable: boolean;
}

export interface GatekeeperResult extends GateEvaluationRecord {
  reserves: Array<{ vector: Vector; description: string }>;
  requiresSolutionPaths: boolean;
}

function computeComposite(gate: GateDef, scores: Partial<Record<Vector, number>>): number | null {
  const entries = Object.entries(gate.weights) as [Vector, number][];
  if (entries.length === 0) return null; // gate binaire (ex G9) — pas de composite
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [vector, weight] of entries) {
    const score = scores[vector];
    if (typeof score === "number") {
      weightedSum += score * weight;
      weightTotal += weight;
    }
  }
  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

function breachedCriticalFloors(
  gate: GateDef,
  scores: Partial<Record<Vector, number>>
): Vector[] {
  const breached: Vector[] = [];
  for (const [vector, floor] of Object.entries(gate.criticalFloors) as [Vector, number][]) {
    const score = scores[vector];
    if (typeof score === "number" && score < floor) breached.push(vector);
  }
  return breached;
}

/**
 * Évalue un gate binaire (G9 : `verdict_policy.binary_proof` pointe un code
 * de jalon dont l'état done/forced fait foi). Pas de score composite.
 */
function evaluateBinaryGate(input: GatekeeperInput): GatekeeperResult {
  const { gate, projectMilestonesInScope } = input;
  const proofCode = gate.verdictPolicy.binary_proof!;
  const pm = projectMilestonesInScope.find((p) => p.milestoneCode === proofCode);
  const proven = !!pm && (pm.state === "done" || pm.state === "forced");
  return {
    gateCode: gate.code,
    verdict: proven ? "validated" : "conditions_not_met",
    computedScores: {},
    reserves: [],
    requiresSolutionPaths: !proven,
  };
}

export function evaluateGate(input: GatekeeperInput): GatekeeperResult {
  const { gate, vectorScores, projectMilestonesInScope, solutionPathsAvailable } = input;

  if (gate.verdictPolicy.binary_proof) {
    return evaluateBinaryGate(input);
  }

  // Plancher non-négociable (ex G7 : P7-J6 obligatoire sans exception).
  if (gate.verdictPolicy.mandatory_milestone) {
    const pm = projectMilestonesInScope.find(
      (p) => p.milestoneCode === gate.verdictPolicy.mandatory_milestone
    );
    const done = !!pm && (pm.state === "done" || pm.state === "forced");
    if (!done) {
      return {
        gateCode: gate.code,
        verdict: "conditions_not_met",
        computedScores: { ...vectorScores },
        reserves: [],
        requiresSolutionPaths: true,
      };
    }
  }

  const composite = computeComposite(gate, vectorScores);
  const breachedCritical = breachedCriticalFloors(gate, vectorScores);
  const threshold = gate.threshold ?? 0;

  let verdict: GateVerdict;
  const reserves: Array<{ vector: Vector; description: string }> = [];

  if (breachedCritical.length >= 2 && gate.verdictPolicy.arret_enabled) {
    verdict = "facts_and_options";
  } else if (
    breachedCritical.includes("V4") &&
    gate.verdictPolicy.pivot_enabled &&
    composite !== null &&
    composite < threshold
  ) {
    verdict = "alternatives_detected";
  } else if (breachedCritical.length > 0) {
    verdict = "conditions_not_met";
  } else if (composite !== null && composite < threshold) {
    verdict = "conditions_not_met";
  } else {
    // Seuil respecté, aucun plancher critique franchi : cherche des
    // vecteurs non-critiques sous le seuil générique de réserve.
    const nonCriticalLow = (Object.keys(gate.weights) as Vector[]).filter((v) => {
      const score = vectorScores[v];
      const isCritical = v in gate.criticalFloors;
      return !isCritical && typeof score === "number" && score < NON_CRITICAL_RESERVE_THRESHOLD;
    });

    const maxReserves = gate.verdictPolicy.max_reserves ?? 3;
    if (nonCriticalLow.length === 0) {
      verdict = "validated";
    } else if (nonCriticalLow.length <= maxReserves) {
      verdict = "validated_with_reserves";
      for (const v of nonCriticalLow) {
        reserves.push({
          vector: v,
          description: `${v} sous le seuil de vigilance (${vectorScores[v]} < ${NON_CRITICAL_RESERVE_THRESHOLD}) — à lever avant le gate N+2.`,
        });
      }
    } else {
      // Plus de réserves que le maximum autorisé (verrou qualité global) → bloqué.
      verdict = "conditions_not_met";
    }
  }

  const requiresSolutionPaths = verdict !== "validated" && !solutionPathsAvailable;

  return {
    gateCode: gate.code,
    verdict,
    computedScores: { ...vectorScores, ...(composite !== null ? { composite } : {}) },
    reserves,
    requiresSolutionPaths,
  };
}
