/**
 * Sequencer — Chantier 4 §4 + §2.1
 *
 * Dérive les états locked/available/recommended de chaque jalon à partir du
 * DAG de dépendances (Amendement A2) et de l'état d'exécution du projet.
 * Ces trois états ne sont JAMAIS stockés en dur : ils sont recalculés à
 * chaque lecture (ici, matérialisables en cache applicatif par l'appelant,
 * mais jamais source de vérité — principe #3, Chantier 4 §0).
 *
 * Règle de franchissement de phase (interprétation du "Gate déverrouille la
 * phase suivante", Chantier 1 §4) : quand une dépendance dure traverse une
 * frontière de phase (le jalon amont appartient à une autre phase que le
 * jalon aval), le déverrouillage exige EN PLUS que le gate de la phase amont
 * ait rendu un verdict favorable (validated | validated_with_reserves) — pas
 * seulement que le jalon amont soit marqué done. C'est ce qui matérialise
 * "GATE G0 … Déverrouille P1" avec le schéma de données du Chantier 4 §1,
 * qui ne porte pas de champ dédié "unlocks_phase" sur la table gates.
 */

import type {
  DependencyDef,
  GateDef,
  GateEvaluationRecord,
  MilestoneDef,
  MilestoneState,
  ProjectMilestoneRecord,
} from "./types.js";

const EXECUTION_STATES: MilestoneState[] = [
  "in_progress",
  "awaiting_proof",
  "awaiting_review",
  "done",
  "forced",
];

const FAVORABLE_VERDICTS = new Set(["validated", "validated_with_reserves"]);

export interface SequencerInput {
  milestones: MilestoneDef[];
  dependencies: DependencyDef[];
  projectMilestones: ProjectMilestoneRecord[];
  gates: GateDef[];
  gateEvaluations: GateEvaluationRecord[];
}

export type SequencerResult = Record<string, MilestoneState>;

function isMilestoneSatisfied(
  code: string,
  pmByCode: Map<string, ProjectMilestoneRecord>
): boolean {
  const pm = pmByCode.get(code);
  return !!pm && (pm.state === "done" || pm.state === "forced");
}

export function deriveMilestoneStates(input: SequencerInput): SequencerResult {
  const { milestones, dependencies, projectMilestones, gates, gateEvaluations } = input;

  const pmByCode = new Map(projectMilestones.map((pm) => [pm.milestoneCode, pm]));
  const milestoneByCode = new Map(milestones.map((m) => [m.code, m]));
  const gateByPhase = new Map(gates.map((g) => [g.phaseCode, g]));
  const verdictByGate = new Map(gateEvaluations.map((ge) => [ge.gateCode, ge.verdict]));
  const depsByMilestone = new Map<string, DependencyDef[]>();
  for (const d of dependencies) {
    if (!depsByMilestone.has(d.milestoneCode)) depsByMilestone.set(d.milestoneCode, []);
    depsByMilestone.get(d.milestoneCode)!.push(d);
  }

  const result: SequencerResult = {};

  for (const m of milestones) {
    const pm = pmByCode.get(m.code);

    // Les états d'exécution explicites (in_progress → forced) sont toujours
    // conservés tels quels : ce sont des faits d'exécution, pas des dérivés.
    if (pm && EXECUTION_STATES.includes(pm.state)) {
      result[m.code] = pm.state;
      continue;
    }

    const hardDeps = (depsByMilestone.get(m.code) ?? []).filter((d) => d.hardness === "hard");

    let locked = false;
    for (const dep of hardDeps) {
      const depMilestone = milestoneByCode.get(dep.dependsOnCode);
      if (!depMilestone) continue; // dépendance vers un jalon hors référentiel courant — ignorée défensivement

      if (!isMilestoneSatisfied(dep.dependsOnCode, pmByCode)) {
        locked = true;
        break;
      }

      // Frontière de phase : exige en plus le verdict favorable du gate amont.
      if (depMilestone.phaseCode !== m.phaseCode) {
        const gate = gateByPhase.get(depMilestone.phaseCode);
        if (gate) {
          const verdict = verdictByGate.get(gate.code);
          if (!verdict || !FAVORABLE_VERDICTS.has(verdict)) {
            locked = true;
            break;
          }
        }
      }
    }

    result[m.code] = locked ? "locked" : "available";
  }

  // Chemin recommandé : au sein de chaque phase, le premier jalon 'available'
  // (dans l'ordre de déclaration du référentiel) devient 'recommended'. Simple
  // scaffold V1 — affiné au chantier de calibration des dépendances détaillées.
  const seenRecommendedPhase = new Set<string>();
  for (const m of milestones) {
    if (result[m.code] === "available" && !seenRecommendedPhase.has(m.phaseCode)) {
      result[m.code] = "recommended";
      seenRecommendedPhase.add(m.phaseCode);
    }
  }

  return result;
}
