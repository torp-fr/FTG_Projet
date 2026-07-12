/**
 * Types partagés de la couche de sources de données.
 *
 * Chaque client renvoie un SourceResult<T> : la donnée + une CITATION bien formée
 * (source + date réelles, ou isEstimate + method en cas de dégradation) + le niveau
 * waterfall de la source + un drapeau `degraded`. Aucune donnée n'est jamais inventée :
 * en cas d'indisponibilité/quota/erreur, on renvoie un résultat vide/partiel marqué
 * isEstimate=true, jamais un faux fait.
 */

/** Métadonnée de citation — mappable directement vers deliverables.sources (A5.4). */
export interface Citation {
  /** Nom de la source (aligné sur le registre data_sources). */
  source: string;
  /** Date ISO de récupération (ou de l'estimation). */
  date: string;
  url: string | null;
  /** true si le résultat est une estimation/dégradation (source non répondante). */
  isEstimate: boolean;
  /** Méthode déclarée (obligatoire quand isEstimate=true). */
  method: string | null;
}

export interface SourceResult<T> {
  data: T;
  citation: Citation;
  /** true si la source a échoué/été indisponible et que `data` est un repli. */
  degraded: boolean;
  /** Niveau waterfall de la source (N1 = open data, N2 = Pappers). */
  waterfallLevel: number;
}

/** Concurrent identifié (Recherche d'Entreprises / Sirene). */
export interface Competitor {
  siren: string;
  siret: string | null;
  denomination: string;
  commune: string | null;
  codePostal: string | null;
  naf: string | null;
  dateCreation: string | null;
  /** Tranche d'effectif salarié (code INSEE) si disponible. */
  effectif: string | null;
  /** Source qui a identifié ce concurrent. */
  source: string;
}

/** Établissement vérifié/enrichi via Sirene. */
export interface EstablishmentInfo {
  siret: string;
  denomination: string | null;
  naf: string | null;
  commune: string | null;
  codePostal: string | null;
  dateCreation: string | null;
  /** État administratif de l'unité légale : "A" (active) / "C" (cessée). */
  etat: string | null;
}

/** Santé financière (Pappers). available=false si dégradé (quota/indisponible). */
export interface CompanyFinancials {
  siren: string;
  denomination: string | null;
  dateCreation: string | null;
  chiffreAffaires: number | null;
  effectif: string | null;
  proceduresCollectives: number;
  available: boolean;
}

/** Signal de vitalité/défaillance (BODACC). */
export interface VitalitySignal {
  date: string;
  /** Famille d'avis : Création / Vente / Procédure collective… */
  type: string;
  commercant: string | null;
  ville: string | null;
  departement: string | null;
}
