/**
 * Test de bout en bout — critère de fin de Lot 1 (plan d'exécution soumis) :
 * "un projet test progresse à travers le DAG P0→P1 avec un verdict de gate
 * calculé côté serveur, même sur données fixture."
 *
 * Ce test n'ouvre aucune connexion réseau : il exerce le Sequencer et le
 * Gatekeeper en pur, sur des fixtures qui reproduisent fidèlement la forme
 * du référentiel V1.1 injecté dans Supabase (supabase/seed/referentiel_v1.1.json)
 * et les golden_cases (supabase/seed/golden_cases_seed.json).
 *
 * Exécution : `pnpm --filter @ftg/orchestrator test`
 *   ou directement : `npx tsx packages/orchestrator/test/e2e-p0-to-p1.test.ts`
 */

import assert from "node:assert/strict";
import { deriveMilestoneStates } from "../src/sequencer.js";
import { evaluateGate } from "../src/gatekeeper.js";
import { P0_P6_PLAN, selectNextStep, selectTier } from "../src/router.js";
import type {
  DependencyDef,
  GateDef,
  GateEvaluationRecord,
  MilestoneDef,
  ProjectMilestoneRecord,
} from "../src/types.js";

// --- Fixtures : sous-ensemble P0/P1 du référentiel V1.1 (miroir du seed) ---

const MILESTONES: MilestoneDef[] = [
  { id: "m-p0-j1", code: "P0-J1", phaseCode: "P0" },
  { id: "m-p0-j2", code: "P0-J2", phaseCode: "P0" },
  { id: "m-p0-j3", code: "P0-J3", phaseCode: "P0" },
  { id: "m-p0-j4", code: "P0-J4", phaseCode: "P0" },
  { id: "m-p0-j5", code: "P0-J5", phaseCode: "P0" },
  { id: "m-p1-j1", code: "P1-J1", phaseCode: "P1" },
  { id: "m-p1-j2", code: "P1-J2", phaseCode: "P1" },
  { id: "m-p1-j3", code: "P1-J3", phaseCode: "P1" },
];

const DEPENDENCIES: DependencyDef[] = [
  { milestoneCode: "P0-J2", dependsOnCode: "P0-J1", hardness: "hard" },
  { milestoneCode: "P0-J3", dependsOnCode: "P0-J1", hardness: "hard" },
  { milestoneCode: "P0-J4", dependsOnCode: "P0-J1", hardness: "hard" },
  { milestoneCode: "P0-J4", dependsOnCode: "P0-J2", hardness: "hard" },
  { milestoneCode: "P0-J4", dependsOnCode: "P0-J3", hardness: "hard" },
  { milestoneCode: "P0-J5", dependsOnCode: "P0-J4", hardness: "hard" },
  { milestoneCode: "P1-J1", dependsOnCode: "P0-J5", hardness: "hard" }, // frontière de phase (ancre G0)
  { milestoneCode: "P1-J2", dependsOnCode: "P1-J1", hardness: "hard" },
  { milestoneCode: "P1-J3", dependsOnCode: "P1-J2", hardness: "hard" },
];

const GATE_G0: GateDef = {
  code: "G0",
  phaseCode: "P0",
  weights: { V2: 60, V3: 40 },
  threshold: 65,
  criticalFloors: { V2: 50 },
  verdictPolicy: { pivot_enabled: false, arret_enabled: false, max_reserves: 3 },
};

// --- Étape 1 : au tout début, P1-J1 doit être verrouillé (aucun P0 fait) ---

function step1_freshProject() {
  const projectMilestones: ProjectMilestoneRecord[] = [];
  const states = deriveMilestoneStates({
    milestones: MILESTONES,
    dependencies: DEPENDENCIES,
    projectMilestones,
    gates: [GATE_G0],
    gateEvaluations: [],
  });

  assert.equal(states["P0-J1"], "recommended", "P0-J1 doit être le jalon recommandé de départ");
  assert.equal(states["P1-J1"], "locked", "P1-J1 doit être verrouillé tant que P0 n'est pas fait");
  console.log("✓ Étape 1 — projet neuf : P0-J1 recommandé, P1-J1 verrouillé");
}

// --- Étape 2 : tout P0 est done, mais G0 pas encore évalué → P1 reste verrouillé ---

function step2_p0DoneNoGateYet() {
  const projectMilestones: ProjectMilestoneRecord[] = [
    { milestoneCode: "P0-J1", state: "done", qualityScore: 82 },
    { milestoneCode: "P0-J2", state: "done", qualityScore: 70 },
    { milestoneCode: "P0-J3", state: "done", qualityScore: 75 },
    { milestoneCode: "P0-J4", state: "done", qualityScore: 88 },
    { milestoneCode: "P0-J5", state: "done", qualityScore: 100 },
  ];
  const states = deriveMilestoneStates({
    milestones: MILESTONES,
    dependencies: DEPENDENCIES,
    projectMilestones,
    gates: [GATE_G0],
    gateEvaluations: [], // <-- G0 pas encore calculé
  });

  assert.equal(
    states["P1-J1"],
    "locked",
    "P1-J1 doit rester verrouillé tant que G0 n'a pas rendu un verdict favorable, même si P0-J5 est done"
  );
  console.log("✓ Étape 2 — P0 entièrement fait mais G0 non évalué : P1-J1 toujours verrouillé");
}

// --- Étape 3 : le Gatekeeper calcule G0 côté serveur (golden case G0 favorable) ---

function step3_gatekeeperComputesG0() {
  const projectMilestonesInScope: ProjectMilestoneRecord[] = [
    { milestoneCode: "P0-J1", state: "done" },
    { milestoneCode: "P0-J2", state: "done" },
    { milestoneCode: "P0-J3", state: "done" },
    { milestoneCode: "P0-J4", state: "done" },
    { milestoneCode: "P0-J5", state: "done" },
  ];

  // Reprend exactement le golden case "gate:G0" de golden_cases_seed.json
  const result = evaluateGate({
    gate: GATE_G0,
    vectorScores: { V2: 74, V3: 68 },
    projectMilestonesInScope,
    solutionPathsAvailable: false,
  });

  // composite = 74*0.6 + 68*0.4 = 71.6 >= seuil 65 ; V2=74 >= plancher 50
  assert.equal(result.verdict, "validated", `verdict attendu 'validated', obtenu '${result.verdict}'`);
  assert.ok(
    Math.abs((result.computedScores.composite ?? 0) - 71.6) < 0.001,
    `composite attendu 71.6, obtenu ${result.computedScores.composite}`
  );
  console.log(
    `✓ Étape 3 — Gatekeeper G0 (côté serveur) : verdict=${result.verdict}, composite=${result.computedScores.composite}`
  );
  return result;
}

// --- Étape 3bis : golden case G0 défavorable (conditions_not_met) ---

function step3bis_gatekeeperG0ConditionsNotMet() {
  const projectMilestonesInScope: ProjectMilestoneRecord[] = [
    { milestoneCode: "P0-J1", state: "done" },
    { milestoneCode: "P0-J5", state: "done" },
  ];
  const result = evaluateGate({
    gate: GATE_G0,
    vectorScores: { V2: 45, V3: 50 }, // V2 < plancher critique 50
    projectMilestonesInScope,
    solutionPathsAvailable: false,
  });
  assert.equal(result.verdict, "conditions_not_met");
  assert.equal(result.requiresSolutionPaths, true, "D25 : un solution_path doit être exigé hors 'validated'");
  console.log(`✓ Étape 3bis — Gatekeeper G0 défavorable : verdict=${result.verdict} (plancher V2 franchi)`);
}

// --- Étape 4 : une fois G0 validé, le Sequencer déverrouille P1-J1 (et P1-J2/J3 restent verrouillés) ---

function step4_p1UnlockedAfterG0() {
  const projectMilestones: ProjectMilestoneRecord[] = [
    { milestoneCode: "P0-J1", state: "done" },
    { milestoneCode: "P0-J2", state: "done" },
    { milestoneCode: "P0-J3", state: "done" },
    { milestoneCode: "P0-J4", state: "done" },
    { milestoneCode: "P0-J5", state: "done" },
  ];
  const gateEvaluations: GateEvaluationRecord[] = [
    { gateCode: "G0", verdict: "validated", computedScores: { V2: 74, V3: 68, composite: 71.2 } },
  ];

  const states = deriveMilestoneStates({
    milestones: MILESTONES,
    dependencies: DEPENDENCIES,
    projectMilestones,
    gates: [GATE_G0],
    gateEvaluations,
  });

  assert.equal(states["P1-J1"], "recommended", "P1-J1 doit être déverrouillé (et recommandé) une fois G0 validé");
  assert.equal(states["P1-J2"], "locked", "P1-J2 reste verrouillé tant que P1-J1 n'est pas fait");
  assert.equal(states["P1-J3"], "locked");
  console.log("✓ Étape 4 — G0 validé : P1-J1 déverrouillé (recommandé), P1-J2/J3 toujours verrouillés en aval");
}

// ─────────────────────────────────────────────────────────────────────────────
// JC-05 — Orchestration P0→P6 : plan de couverture + sélection + progression multi-phase.
// (Le run RÉEL bout-en-bout est scripts/orchestrated-run.ts ; ici, fixtures pures.)
// ─────────────────────────────────────────────────────────────────────────────

// --- Étape 5 : le Router parcourt le plan P0→P6 dans l'ordre, E6 marqué différé ---

function step5_planCoversP0toP6() {
  const phases = [...new Set(P0_P6_PLAN.map((s) => s.phaseCode))];
  assert.deepEqual(phases, ["P0", "P1", "P2", "P3", "P5", "P6"], "le plan couvre P0→P6 (P4 hors périmètre, P3 différé)");

  const deferred = P0_P6_PLAN.filter((s) => s.deferred);
  assert.equal(deferred.length, 1, "exactement une étape différée");
  assert.equal(deferred[0]!.engineCode, "proof_witness", "E6 (proof_witness) est l'engine différé");

  // selectNextStep parcourt tout le plan dans l'ordre sans jamais bloquer.
  const completed = new Set<number>();
  const order: string[] = [];
  let s = selectNextStep(P0_P6_PLAN, completed);
  while (s) {
    order.push(`${s.phaseCode}:${s.engineCode}`);
    completed.add(s.order);
    s = selectNextStep(P0_P6_PLAN, completed);
  }
  assert.equal(order.length, 9, "9 étapes sélectionnées (E1,E2,E3,E4,E5,E6†,E7,E8,E9)");
  assert.equal(order[0], "P0:founder_profiler");
  assert.equal(order[8], "P6:name_forge");
  console.log(`✓ Étape 5 — plan P0→P6 : ${order.length} étapes, E6 différé (DAG non bloqué)`);
}

// --- Étape 6 : sélection du tier LLM depuis model_routing ---

function step6_tierFromModelRouting() {
  assert.equal(selectTier({ dominant: "frontier" }), "frontier");
  assert.equal(selectTier({ dominant: "déterministe_petit" }), "petit");
  assert.equal(selectTier({ dominant: "api_intermediaire" }), "intermediaire");
  assert.equal(selectTier(null), "intermediaire", "fallback sûr = intermediaire");
  console.log("✓ Étape 6 — tier LLM dérivé de model_routing (frontier/petit/intermediaire, fallback sûr)");
}

// --- Étape 7 : progression multi-phase — après G1 validé, P2 se déverrouille ---

function step7_p2UnlockedAfterG1() {
  const milestones: MilestoneDef[] = [
    ...MILESTONES,
    { id: "m-p2-j1", code: "P2-J1", phaseCode: "P2" },
    { id: "m-p2-j2", code: "P2-J2", phaseCode: "P2" },
  ];
  const dependencies: DependencyDef[] = [
    ...DEPENDENCIES,
    { milestoneCode: "P2-J1", dependsOnCode: "P1-J3", hardness: "hard" }, // frontière P1→P2 (ancre G1)
    { milestoneCode: "P2-J2", dependsOnCode: "P2-J1", hardness: "hard" },
  ];
  const gateG1: GateDef = { code: "G1", phaseCode: "P1", weights: { V2: 50, V3: 50 }, threshold: 60, criticalFloors: { V3: 45 }, verdictPolicy: { max_reserves: 3 } };

  // Tout P0/P1 done, G0 ET G1 favorables → P2-J1 doit se déverrouiller.
  const projectMilestones: ProjectMilestoneRecord[] = [
    "P0-J1", "P0-J2", "P0-J3", "P0-J4", "P0-J5", "P1-J1", "P1-J2", "P1-J3",
  ].map((code) => ({ milestoneCode: code, state: "done" as const }));
  const gateEvaluations: GateEvaluationRecord[] = [
    { gateCode: "G0", verdict: "validated", computedScores: {} },
    { gateCode: "G1", verdict: "validated_with_reserves", computedScores: {} },
  ];

  const states = deriveMilestoneStates({ milestones, dependencies, projectMilestones, gates: [GATE_G0, gateG1], gateEvaluations });
  assert.equal(states["P2-J1"], "recommended", "P2-J1 déverrouillé (recommandé) après G1 favorable");
  assert.equal(states["P2-J2"], "locked", "P2-J2 reste verrouillé en aval");

  // Sans verdict G1, P2 doit rester verrouillé (franchissement de phase exige le gate).
  const statesNoG1 = deriveMilestoneStates({ milestones, dependencies, projectMilestones, gates: [GATE_G0, gateG1], gateEvaluations: [gateEvaluations[0]!] });
  assert.equal(statesNoG1["P2-J1"], "locked", "P2-J1 verrouillé tant que G1 n'a pas rendu de verdict favorable");
  console.log("✓ Étape 7 — progression multi-phase : G1 validé → P2 déverrouillé (sinon verrouillé)");
}

// --- Exécution séquentielle du scénario P0 → G0 → P1 → … → P6 ---

step1_freshProject();
step2_p0DoneNoGateYet();
step3_gatekeeperComputesG0();
step3bis_gatekeeperG0ConditionsNotMet();
step4_p1UnlockedAfterG0();
step5_planCoversP0toP6();
step6_tierFromModelRouting();
step7_p2UnlockedAfterG1();

console.log("\n✅ Orchestration validée : progression DAG P0→P1→P2 (verdicts gate côté serveur) + plan P0→P6 avec E6 différé (fixtures).");
