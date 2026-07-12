/**
 * Grounding V1 HONNÊTE pour E3 (La Forge).
 *
 * Les sources data d'E3 (Sirene/stock pour la densité, Google Trends / DataForSEO pour
 * le volume de demande, Sonar contradictoire) NE SONT PAS ENCORE connectées — elles
 * arrivent au Lot 3. En V1, la « recherche » = connaissance paramétrique du modèle +
 * raisonnement, PAS un vrai waterfall. On encode cette honnêteté ici, en un seul endroit.
 */
import type { SourceCitation } from "@ftg/engine-sdk";

/**
 * Profondeur de recherche V1 = 1 (un seul niveau : raisonnement du modèle, sans source
 * de données connectée). Le waterfall ≥ 3 s'activera au Lot 3 avec Sirene / Google
 * Trends / DataForSEO / Sonar. On ne truque JAMAIS researchDepthReached : les fixtures
 * et le smoke fixent researchDepthMin = 1 pour E3 en V1.
 */
export const RESEARCH_DEPTH_V1 = 1;

/** Méthode déclarée pour toute estimation marché en V1 (contrat A5.4). */
export const GROUNDING_V1_METHOD =
  "raisonnement modèle sans source de données connectée (V1 — sources Sirene/DataForSEO/Sonar prévues au Lot 3)";

/**
 * Source « estimation » standard V1 : aucune donnée marché n'est présentée comme un
 * fait. isEstimate=true + method → conforme à A5.4 (checkSourcesWellFormed).
 */
export function groundingV1Source(nowIso: string, claim: string): SourceCitation {
  return {
    claim,
    source: "Raisonnement E3 (La Forge) — V1 sans source de données",
    date: nowIso,
    url: null,
    isEstimate: true,
    method: GROUNDING_V1_METHOD,
  };
}
