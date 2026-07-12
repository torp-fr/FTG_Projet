/**
 * Gatekeeper runtime (JC-05) — le Gatekeeper PUR (`evaluateGate`) reste la source des
 * verdicts ; cette couche l'appelle aux frontières de phase sur des vecteurs calculés
 * depuis l'état réel du projet, et ÉCRIT le verdict dans `gate_evaluations` (à la place des
 * gate_evaluations seedés). Serveur uniquement (service_role). Idempotent : le verdict
 * courant d'un (projet, gate) est remplacé, jamais dupliqué.
 *
 * Neutralité factuelle : le verdict provient exclusivement d'evaluateGate (jamais
 * « impossible ») ; les réserves (≤ max) et solution_paths sont joints tels quels.
 */
import type { FtgClient, Json } from "@ftg/database";
import { evaluateGate } from "./gatekeeper.js";
import type { GateDef, ProjectMilestoneRecord, Vector } from "./types.js";

/** Construit un GateDef à partir d'une ligne `gates` de la base (code Gn → phase Pn). */
export function gateDefFromRow(row: {
  code: string;
  weights: Record<string, number> | null;
  threshold: number | string | null;
  critical_floors: Record<string, number> | null;
  verdict_policy: Record<string, unknown> | null;
}): GateDef {
  return {
    code: row.code,
    phaseCode: row.code.replace(/^G/, "P"),
    weights: (row.weights ?? {}) as GateDef["weights"],
    threshold: row.threshold == null ? null : Number(row.threshold),
    criticalFloors: (row.critical_floors ?? {}) as GateDef["criticalFloors"],
    verdictPolicy: (row.verdict_policy ?? {}) as GateDef["verdictPolicy"],
  };
}

export interface GateRuntimeInput {
  gate: GateDef;
  gateId: string;
  projectId: string;
  vectorScores: Partial<Record<Vector, number>>;
  projectMilestonesInScope?: ProjectMilestoneRecord[];
  solutionPathsAvailable: boolean;
  /** Chemins de solution fournis par l'engine amont (joints au verdict, D25). */
  solutionPaths?: unknown[];
  /** Traçabilité : versions d'engine ayant alimenté les vecteurs. */
  engineVersionRefs?: string[];
  /** Note factuelle jointe (méthode de calcul des vecteurs). */
  fact?: Record<string, unknown>;
}

/** Évalue un gate (Gatekeeper pur) et écrit le verdict dans gate_evaluations (idempotent). */
export async function computeAndWriteGate(client: FtgClient, input: GateRuntimeInput) {
  const result = evaluateGate({
    gate: input.gate,
    vectorScores: input.vectorScores,
    projectMilestonesInScope: input.projectMilestonesInScope ?? [],
    solutionPathsAvailable: input.solutionPathsAvailable,
  });

  const facts: unknown[] = [
    ...(input.fact ? [input.fact] : []),
    ...result.reserves.map((r) => ({ kind: "reserve", vector: r.vector, detail: r.description })),
  ];

  // Idempotence : on retire le verdict courant de ce (projet, gate) avant de réécrire.
  await client.from("gate_evaluations").delete().eq("project_id", input.projectId).eq("gate_id", input.gateId);

  const { data, error } = await client
    .from("gate_evaluations")
    .insert({
      gate_id: input.gateId,
      project_id: input.projectId,
      verdict: result.verdict,
      computed_scores: result.computedScores as unknown as Json,
      facts: facts as unknown as Json,
      solution_paths: (input.solutionPaths ?? []) as unknown as Json,
      engine_version_refs: (input.engineVersionRefs ?? []) as unknown as Json,
    })
    .select("id, verdict")
    .single();
  if (error) throw new Error(`computeAndWriteGate(${input.gate.code}): ${error.message}`);
  return { ...data, reserves: result.reserves, requiresSolutionPaths: result.requiresSolutionPaths };
}