/** Helpers de présentation partagés (supervision). Aucune dépendance serveur. */

/** Somme des tokens d'un tableau `model_calls` (chaque call = {tokens?, tokens_in?, tokens_out?}). */
export function sumTokens(modelCalls: unknown): number {
  if (!Array.isArray(modelCalls)) return 0;
  let total = 0;
  for (const call of modelCalls) {
    if (!call || typeof call !== "object") continue;
    const c = call as Record<string, unknown>;
    const direct = Number(c.tokens ?? NaN);
    if (Number.isFinite(direct)) {
      total += direct;
      continue;
    }
    const tin = Number(c.tokens_in ?? c.input_tokens ?? 0);
    const tout = Number(c.tokens_out ?? c.output_tokens ?? 0);
    total += (Number.isFinite(tin) ? tin : 0) + (Number.isFinite(tout) ? tout : 0);
  }
  return total;
}

/** Nombre d'appels modèle. */
export function countModelCalls(modelCalls: unknown): number {
  return Array.isArray(modelCalls) ? modelCalls.length : 0;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function fmtCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined || !Number.isFinite(Number(cost))) return "—";
  return `${Number(cost).toFixed(4)} $`;
}
