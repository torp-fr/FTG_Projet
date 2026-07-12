/**
 * Supervisor — Chantier 4 §4
 *
 * Gère la file de runs, les quotas, les retries, les runs `awaiting_user`,
 * les alertes de veille routées par projet. SLA internes proposés
 * (Chantier 4 §4, point de calibration §8.4) : structuration input < 30 s ;
 * run standard < 5 min ; run profond annoncé avec ETA.
 *
 * Lot 1 : constantes de SLA + garde de quota pure (pas de vraie file — il n'y
 * a pas encore de run à mettre en file tant qu'aucun engine n'existe). La
 * file réelle (table engine_runs + worker) arrive au Lot 2.
 */

export const SLA_MS = {
  structuring: 30_000,
  standardRun: 5 * 60_000,
} as const;

export interface QuotaState {
  included: Record<string, number>;
  consumed: Record<string, number>;
  creditBalance: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
}

export function checkQuota(moduleCode: string, quota: QuotaState): QuotaCheckResult {
  const included = quota.included[moduleCode] ?? 0;
  const consumed = quota.consumed[moduleCode] ?? 0;
  if (consumed < included) return { allowed: true };
  if (quota.creditBalance > 0) return { allowed: true };
  return {
    allowed: false,
    reason: `Quota du module "${moduleCode}" épuisé (${consumed}/${included}) et solde de crédits nul.`,
  };
}

// ============================================================
// Enregistrement des runs (JC-05) — le Supervisor consigne chaque run dans engine_runs
// (statut, profondeur, appels modèle = coût/tokens) et laisse une trace d'événement.
// Serveur uniquement (service_role). Sûreté de rejeu : chaque run porte un runId.
// ============================================================
import type { FtgClient, Json } from "@ftg/database";

export interface EngineRunRow {
  projectId: string;
  agentId?: string | null;
  engineVersionId: string;
  taskType: string;
  inputEnvelope: unknown;
  inputStructuredValidated: boolean;
  researchDepth: number;
  modelCalls: unknown;
  llmChannel: string;
  costEstimate?: number | null;
  outputEnvelopeRef?: string | null;
  status: "queued" | "running" | "awaiting_user" | "done" | "failed";
  startedAt?: string | null;
  finishedAt?: string | null;
}

/** Consigne un run dans engine_runs (télémétrie : research_depth + model_calls = coût/tokens). */
export async function writeEngineRunRow(client: FtgClient, run: EngineRunRow) {
  const { data, error } = await client
    .from("engine_runs")
    .insert({
      project_id: run.projectId,
      agent_id: run.agentId ?? null,
      engine_version_id: run.engineVersionId,
      task_type: run.taskType,
      input_envelope: run.inputEnvelope as unknown as Json,
      input_structured_validated: run.inputStructuredValidated,
      research_depth: run.researchDepth,
      model_calls: run.modelCalls as unknown as Json,
      llm_channel: run.llmChannel,
      cost_estimate: run.costEstimate ?? null,
      output_envelope_ref: run.outputEnvelopeRef ?? null,
      status: run.status,
      started_at: run.startedAt ?? null,
      finished_at: run.finishedAt ?? null,
    })
    .select("id, status")
    .single();
  if (error) throw new Error(`writeEngineRunRow(${run.taskType}): ${error.message}`);
  return data;
}
