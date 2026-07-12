/**
 * Contrat de dépendances de l'engine E5 (La Vigie).
 *
 * E5 étend le contrat de handler standard avec la couche de sources de données
 * (@ftg/data-sources), INJECTABLE pour les tests (faux clients) comme pour le smoke
 * (clients réels). callModel reste injectable/mockable comme pour E1/E2/E3.
 */
import type { CallModel, EngineInputEnvelope, HandlerResult, SourceCitation } from "@ftg/engine-sdk";
import type { Citation, DataSources, SourceResult } from "@ftg/data-sources";

export interface E5Deps {
  callModel: CallModel;
  now: () => string;
  sources: DataSources;
}

export type E5Handler = (input: EngineInputEnvelope, deps: E5Deps) => Promise<HandlerResult>;

/** Convertit une Citation de la couche data-sources en SourceCitation d'enveloppe (A5.4). */
export function citationToSource(c: Citation, claim: string): SourceCitation {
  return { claim, source: c.source, date: c.date, url: c.url, isEstimate: c.isEstimate, method: c.method };
}

/**
 * Profondeur waterfall HONNÊTE atteinte, à partir des résultats de sources réellement
 * obtenus (non dégradés) + un éventuel palier de contradiction/synthèse. On ne truque
 * jamais : le niveau reflète ce qui a réellement répondu.
 *   N1 (open data) répond → 1 ; N2 (Pappers) répond → 2 ; contradiction menée → +1 (cap 3).
 */
export function waterfallDepth(results: Array<SourceResult<unknown>>, contradictionDone = false): number {
  let maxLevel = 0;
  for (const r of results) if (!r.degraded) maxLevel = Math.max(maxLevel, r.waterfallLevel);
  let depth = Math.max(maxLevel, 1); // au moins 1 (une tentative N1 a eu lieu)
  if (contradictionDone) depth = Math.min(depth + 1, 3);
  return depth;
}
