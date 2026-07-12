/**
 * Contrat de dépendances de l'engine E9 (L'Éponyme).
 * Étend le contrat de handler standard avec la couche de sources (@ftg/data-sources),
 * INJECTABLE (faux clients en test, réels au smoke). callModel injectable/mockable.
 */
import type { CallModel, EngineInputEnvelope, HandlerResult, SourceCitation } from "@ftg/engine-sdk";
import type { Citation, DataSources, SourceResult } from "@ftg/data-sources";

export interface E9Deps {
  callModel: CallModel;
  now: () => string;
  sources: DataSources;
}

export type E9Handler = (input: EngineInputEnvelope, deps: E9Deps) => Promise<HandlerResult>;

export function citationToSource(c: Citation, claim: string): SourceCitation {
  return { claim, source: c.source, date: c.date, url: c.url, isEstimate: c.isEstimate, method: c.method };
}

/** Profondeur waterfall HONNÊTE (N1 open data réel → 1 ; contrôle de cohérence → +1, cap 3). */
export function researchDepth(results: Array<SourceResult<unknown>>, coherenceDone = false): number {
  let maxLevel = 0;
  for (const r of results) if (!r.degraded) maxLevel = Math.max(maxLevel, r.waterfallLevel);
  let depth = Math.max(maxLevel, 1);
  if (coherenceDone) depth = Math.min(depth + 1, 3);
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
// Garde-fous NON désactivables (E9) — injectés par run.ts sur CHAQUE livrable
// ============================================================

/**
 * Sur-affirmations INTERDITES dans le livrable : on ne déclare JAMAIS un nom
 * « juridiquement sûr » / garanti disponible. La disponibilité marque est indicative et
 * ne remplace pas une recherche d'antériorité professionnelle. run.ts rejette si un de ces
 * termes apparaît.
 */
// Liste HAUTE PRÉCISION : uniquement des AFFIRMATIONS POSITIVES de sécurité juridique,
// improbables dans un disclaimer nié. On EXCLUT volontairement « garantie de disponibilité »
// / « garanti disponible » (fréquents dans les disclaimers légitimes : « ne constitue pas
// une garantie de disponibilité ») et les variantes contenant « sur » sans accent (collision
// avec « sur le plan… »). La formulation positive est portée par les prompts.
export const FORBIDDEN_NAMING_CERTAINTY_TERMS = [
  "juridiquement sûr",
  "juridiquement sécurisé",
  "aucun risque juridique",
  "totalement libre de droits",
  "100% libre",
  "100 % libre",
] as const;

export function checkNamingCertainty(contentMd: string): Array<{ rule: string; detail: string }> {
  const lower = contentMd.toLowerCase();
  const out: Array<{ rule: string; detail: string }> = [];
  for (const t of FORBIDDEN_NAMING_CERTAINTY_TERMS) {
    if (lower.includes(t)) out.push({ rule: "E9_no_legal_certainty", detail: `Sur-affirmation de sécurité juridique détectée : "${t}"` });
  }
  return out;
}

export const DISCLAIMER_TEXT =
  "ℹ️ Disponibilité indiquée dans les bases CONSULTÉES À DATE : domaines (RDAP) et dénomination " +
  "(Recherche d'Entreprises) sont des vérifications réelles horodatées ; la dimension MARQUES est " +
  "INDICATIVE (Pappers / recherche INPI) et ne constitue en aucun cas une garantie de disponibilité. " +
  "Aucun nom n'est présenté comme garanti sur le plan juridique : cette analyse NE REMPLACE PAS une " +
  "recherche d'antériorité par un professionnel (conseil en propriété industrielle / avocat) avant tout dépôt.";

/** Renvoi antériorité professionnelle (dimension marques) — non désactivable. */
export const PROFESSIONAL_REFERRAL = {
  checkpoint: "P5-J2",
  required: true,
  acknowledged: false,
  dimension: "marques / antériorité",
  options: ["a_consulte", "choisit_de_ne_pas_consulter"] as const,
  message:
    "Sur la dimension MARQUES, une recherche d'antériorité par un professionnel (CPI / avocat) est requise " +
    "avant tout dépôt : la vérification ici est indicative. Acquittez « j'ai consulté un professionnel » ou " +
    "« je choisis de ne pas consulter » — votre choix est tracé.",
};

export function referralSource(now: string): SourceCitation {
  return {
    claim: "Renvoi antériorité professionnelle (marques).",
    source: "Cadre FTG E9 (disponibilité indicative, non-garantie)",
    date: now,
    url: null,
    isEstimate: true,
    method: "Posture de l'engine : disponibilité indiquée à date, dimension marques indicative, recherche d'antériorité professionnelle requise — pas une garantie juridique.",
  };
}
