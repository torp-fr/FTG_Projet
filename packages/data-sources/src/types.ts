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
  /** Libellé du code NAF/APE (renseigné par l'engine à partir de la nomenclature sectorielle dérivée ; l'endpoint Recherche d'Entreprises ne le fournit pas). */
  nafLabel: string | null;
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

/** Comptage d'établissements pour un code NAF donné (densité de marché). */
export interface NafCount {
  naf: string;
  /** Nombre d'établissements (total_results). */
  total: number;
  /** true si le compte a atteint le plafond de l'API (valeur = plancher, pas exact). */
  capped: boolean;
}

/**
 * Densité de marché RÉELLE : nombre d'établissements (actifs si demandé) par code(s) NAF
 * et zone, via l'agrégation de Recherche d'Entreprises (total_results). Le comptage
 * national est plafonné par l'API (cap) → `capped=true` signale un PLANCHER, jamais un
 * chiffre exact présenté comme tel.
 */
export interface MarketDensity {
  nafCodes: string[];
  zone: { departement: string | null; codeCommune: string | null };
  /** true si le comptage a filtré sur les établissements administrativement actifs. */
  activeOnly: boolean;
  /** Total agrégé sur l'ensemble des NAF (total_results). */
  total: number;
  /** true si le total agrégé a atteint le plafond de l'API. */
  capped: boolean;
  /** Détail par code NAF. */
  perNaf: NafCount[];
}

/** Fenêtre temporelle de comptage BODACC (créations vs procédures collectives). */
export interface BodaccWindow {
  from: string;
  to: string;
  creations: number;
  proceduresCollectives: number;
}

/**
 * Tendance de vitalité sectorielle RÉELLE : comptages BODACC datés (créations vs
 * procédures collectives) sur deux fenêtres consécutives → sens de la tendance.
 * BODACC n'est PAS indexé par NAF : la recherche s'appuie sur un terme sectoriel
 * (dérivé des libellés NAF/mots-clés) — méthode déclarée dans la citation.
 */
export interface BodaccTrend {
  q: string;
  zone: string | null;
  windowMonths: number;
  recent: BodaccWindow;
  previous: BodaccWindow;
  /** recent.creations − previous.creations. */
  creationsDelta: number;
  creationsTrend: "hausse" | "stable" | "baisse";
}

/**
 * Cadrage macro-sectoriel (INSEE BDM / comptes du commerce). available=false si la
 * souscription BDM dédiée n'est pas connectée (distincte de la clé Sirene) → le sizing
 * macro reste une estimation méthodique côté engine ([E]), jamais un faux chiffre.
 */
export interface MacroSizing {
  sector: string;
  indicator: string | null;
  value: number | null;
  unit: string | null;
  period: string | null;
  available: boolean;
}

/**
 * Texte juridique récupéré via Légifrance (API PISTE / DILA). `dateVersion` porte la
 * FRAÎCHEUR de la règle (les textes changent : toute citation doit être datée).
 * available=false si l'API n'a pas répondu (OAuth incomplet / indisponible) → l'engine
 * bascule sur une référence datée [E] + renvoi professionnel, jamais un faux texte.
 */
export interface LegalText {
  articleId: string | null;
  title: string | null;
  excerpt: string | null;
  /** Date de version du texte (fraîcheur), ISO. */
  dateVersion: string | null;
  url: string | null;
  available: boolean;
}
