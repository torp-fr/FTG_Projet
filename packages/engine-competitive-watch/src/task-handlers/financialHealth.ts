/**
 * Handler task_type = financial_health (RÉEL, N2 Pappers).
 * Interroge Pappers sur un sous-ensemble BORNÉ de concurrents (CA, ancienneté,
 * procédures). Chiffres sourcés+datés ; dégrade proprement (quota) sans rien inventer.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import type { CompanyFinancials, SourceResult } from "@ftg/data-sources";
import { PAPPERS_MAX_CALLS_PER_RUN } from "@ftg/data-sources";
import { citationToSource, waterfallDepth, type E5Handler } from "../deps.js";

/** Borne du smoke : ≤ 5 fiches, elle-même sous la borne dure ≤ 10/run. */
const SMOKE_CAP = 5;

export const financialHealth: E5Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as { sirens?: string[]; competitors?: Array<{ siren?: string }> };
  const sirens = (si.sirens ?? (si.competitors ?? []).map((c) => c.siren).filter((x): x is string => Boolean(x)))
    .slice(0, Math.min(PAPPERS_MAX_CALLS_PER_RUN, SMOKE_CAP));

  const results: SourceResult<CompanyFinancials>[] = [];
  for (const siren of sirens) {
    results.push(await deps.sources.pappers(siren));
  }

  const financial_health = results.map((r) => r.data);
  const realCount = results.filter((r) => !r.degraded).length;
  const sources: SourceCitation[] = results.map((r, i) => citationToSource(r.citation, `Santé financière du concurrent ${sirens[i]}.`));
  const note = `Pappers interrogé sur ${results.length} concurrent(s) (borne ${PAPPERS_MAX_CALLS_PER_RUN}/run) — ${realCount} fiche(s) réelle(s), ${results.length - realCount} dégradée(s) (quota/indisponibilité).`;

  return {
    partial: {
      deliverable: { title: "Santé financière des concurrents (E5 · La Vigie)", contentMd: note, type: "financial_health" },
      structuredData: { financial_health, pappers_calls: results.length, pappers_real: realCount },
      sources,
      scores: { qualitySelf: realCount > 0 ? 75 : 40, vectorContributions: {} },
      telemetry: { researchDepthReached: waterfallDepth(results), modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
