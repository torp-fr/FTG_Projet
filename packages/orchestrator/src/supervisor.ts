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
