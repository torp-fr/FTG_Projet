/**
 * Contrat de dépendances de l'engine E7 (L'Architecte) — l'engine le plus sensible.
 *
 * Étend le contrat de handler standard avec la couche de sources (@ftg/data-sources),
 * INJECTABLE (faux clients en test, réels au smoke). callModel injectable/mockable.
 * Les CHIFFRES ne transitent JAMAIS par le LLM : ils proviennent de @ftg/deterministic-core
 * (importé directement par les handlers).
 */
import type { CallModel, EngineInputEnvelope, HandlerResult, SourceCitation } from "@ftg/engine-sdk";
import type { Citation, DataSources, SourceResult } from "@ftg/data-sources";

export interface E7Deps {
  callModel: CallModel;
  now: () => string;
  sources: DataSources;
}

export type E7Handler = (input: EngineInputEnvelope, deps: E7Deps) => Promise<HandlerResult>;

/** Convertit une Citation de la couche data-sources en SourceCitation d'enveloppe (A5.4). */
export function citationToSource(c: Citation, claim: string): SourceCitation {
  return { claim, source: c.source, date: c.date, url: c.url, isEstimate: c.isEstimate, method: c.method };
}

/** Profondeur waterfall HONNÊTE (N1 réel répond → 1 ; contrôle fraîcheur/cohérence → +1, cap 3). */
export function researchDepth(results: Array<SourceResult<unknown>>, coherenceControlDone = false): number {
  let maxLevel = 0;
  for (const r of results) if (!r.degraded) maxLevel = Math.max(maxLevel, r.waterfallLevel);
  let depth = Math.max(maxLevel, 1);
  if (coherenceControlDone) depth = Math.min(depth + 1, 3);
  return depth;
}

/**
 * Repli DÉFENSIF : les clients réels ne LÈVENT jamais (ils dégradent), mais un faux
 * client de test peut throw. On garantit « pas de crash » : en cas d'exception, un
 * SourceResult dégradé bien formé (isEstimate + method).
 */
export async function safeSource<T>(
  call: () => Promise<SourceResult<T>>,
  fallback: T,
  source: string,
  now: string,
  methodOnThrow: string,
): Promise<SourceResult<T>> {
  try {
    return await call();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      data: fallback,
      citation: { source, date: now, url: null, isEstimate: true, method: `${methodOnThrow} (${msg})` },
      degraded: true,
      waterfallLevel: 1,
    };
  }
}

// ============================================================
// Garde-fous NON désactivables (D7 / A5.8) — injectés par run.ts sur CHAQUE livrable
// ============================================================

/** Disclaimer présent sur chaque livrable E7. */
export const DISCLAIMER_TEXT =
  "⚖️ Information & guidage — ce document ne constitue PAS un conseil juridique personnalisé. " +
  "Les règles évoluent : chaque référence citée porte sa date de vérification. Les chiffres " +
  "proviennent du moteur déterministe FTG (barèmes datés), pas d'une estimation du modèle. " +
  "Le choix vous appartient ; faites valider votre situation par un expert-comptable ou un avocat " +
  "avant toute décision.";

/**
 * Renvoi professionnel NON DÉSACTIVABLE (checkpoint P5-J2). Le porteur doit l'acquitter :
 * « a consulté » ou « choisit de ne pas consulter » — tracé par l'application.
 */
export const PROFESSIONAL_REFERRAL = {
  checkpoint: "P5-J2",
  required: true,
  acknowledged: false,
  options: ["a_consulte", "choisit_de_ne_pas_consulter"] as const,
  message:
    "Point de contrôle P5-J2 (non désactivable) : avant toute décision, faites valider votre situation " +
    "par un expert-comptable ou un avocat. Acquittez « j'ai consulté un professionnel » ou « je choisis de " +
    "ne pas consulter » — votre choix est tracé.",
};

/** Citation A5.4 rappelant la posture (information/guidage) — jointe à chaque livrable. */
export function referralSource(now: string): SourceCitation {
  return {
    claim: "Renvoi professionnel (expert-comptable / avocat) — checkpoint P5-J2.",
    source: "Cadre FTG D7/A5.8 (information & guidage, non-conseil)",
    date: now,
    url: null,
    isEstimate: true,
    method: "Posture réglementaire de l'engine : information et guidage uniquement, renvoi professionnel obligatoire — pas une donnée mesurée.",
  };
}
