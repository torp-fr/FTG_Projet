/**
 * Contrat de dépendances de l'engine E8 (Le Fiscaliste) — posture sensible (comme E7).
 *
 * Étend le contrat de handler standard avec la couche de sources (@ftg/data-sources).
 * Les CHIFFRES ne transitent JAMAIS par le LLM : ils proviennent de @ftg/deterministic-core.
 */
import type { CallModel, EngineInputEnvelope, HandlerResult, SourceCitation } from "@ftg/engine-sdk";
import type { Citation, DataSources, SourceResult } from "@ftg/data-sources";

export interface E8Deps {
  callModel: CallModel;
  now: () => string;
  sources: DataSources;
}

export type E8Handler = (input: EngineInputEnvelope, deps: E8Deps) => Promise<HandlerResult>;

export function citationToSource(c: Citation, claim: string): SourceCitation {
  return { claim, source: c.source, date: c.date, url: c.url, isEstimate: c.isEstimate, method: c.method };
}

/** Profondeur waterfall HONNÊTE (N1 réel → 1 ; contrôle de fraîcheur des taux → +1, cap 3). */
export function researchDepth(results: Array<SourceResult<unknown>>, freshnessControlDone = false): number {
  let maxLevel = 0;
  for (const r of results) if (!r.degraded) maxLevel = Math.max(maxLevel, r.waterfallLevel);
  let depth = Math.max(maxLevel, 1);
  if (freshnessControlDone) depth = Math.min(depth + 1, 3);
  return depth;
}

/** Repli DÉFENSIF : un faux client de test peut throw → SourceResult dégradé bien formé. */
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
    return { data: fallback, citation: { source, date: now, url: null, isEstimate: true, method: `${methodOnThrow} (${msg})` }, degraded: true, waterfallLevel: 1 };
  }
}

// ============================================================
// Garde-fous NON désactivables (D7/A5.8, volet fiscal) — injectés par run.ts
// ============================================================

/** Date de vérification/validité des barèmes du deterministic_core (cf. rates/fr-2026.ts). */
export const BAREMES_VERIF_DATE = "2026-07-11";

export const DISCLAIMER_TEXT =
  "⚖️ Information fiscale générale — ce document ne constitue PAS un conseil fiscal personnalisé " +
  "ni un montage d'optimisation. Les taux et seuils changent chaque année et portent leur DATE DE " +
  "VALIDITÉ (barèmes vérifiés au " + BAREMES_VERIF_DATE + ", à revalider) ; une veille mensuelle les " +
  "invalide à péremption. Les chiffres proviennent du moteur déterministe FTG, pas d'une estimation du " +
  "modèle. Le choix vous appartient ; faites valider votre situation par un expert-comptable avant toute décision.";

export const PROFESSIONAL_REFERRAL = {
  checkpoint: "P5-J2",
  required: true,
  acknowledged: false,
  options: ["a_consulte", "choisit_de_ne_pas_consulter"] as const,
  message:
    "Point de contrôle P5-J2 (non désactivable) : la fiscalité de votre situation doit être validée par un " +
    "expert-comptable avant toute décision. Acquittez « j'ai consulté un professionnel » ou « je choisis de " +
    "ne pas consulter » — votre choix est tracé.",
};

export function referralSource(now: string): SourceCitation {
  return {
    claim: "Renvoi professionnel (expert-comptable) — checkpoint P5-J2.",
    source: "Cadre FTG D7/A5.8 (information fiscale, non-optimisation)",
    date: now,
    url: null,
    isEstimate: true,
    method: "Posture réglementaire de l'engine : information fiscale générale, renvoi professionnel obligatoire — pas une donnée mesurée.",
  };
}
