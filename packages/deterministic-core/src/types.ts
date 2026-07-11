/**
 * @ftg/deterministic-core — types des entrées/sorties du moteur.
 *
 * Convention de nommage : les champs des CONTRATS de sortie financiers sont en
 * snake_case, calqués sur le vocabulaire exact des barèmes (cf. rates/fr-2026.ts) et
 * des golden cases, pour que la relecture d'audit soit sans ambiguïté (result.is_total,
 * result.pfu_dividendes, …).
 */

// ============================================================
// Prévisionnel (forecast.ts)
// ============================================================

/** Nature de l'activité — détermine plafond micro, taux de cotisations, abattement
 *  micro-fiscal et seuils de franchise TVA applicables. */
export type ActivityType =
  | "vente" // vente de marchandises / hébergement (BIC)
  | "services_bic" // prestations de services commerciales (BIC)
  | "services_bnc" // prestations de services non commerciales (BNC)
  | "liberal_cipav"; // professions libérales relevant de la Cipav (BNC)

export interface ForecastInput {
  /** CA mensuel prévisionnel : 12 mois (un exercice, répliqué sur 3 ans) ou 36 mois. */
  ca_mensuel: number[];
  /** Charges fixes mensuelles (constantes sur l'horizon), en euros. */
  charges_fixes_mensuelles: number;
  /** Charges variables exprimées en fraction du CA (0.30 = 30 %). Doit être dans [0, 1[. */
  charges_variables_pct: number;
}

export interface MonthlyPnl {
  mois: number; // 1..36
  annee: number; // 1..3
  ca: number;
  charges_fixes: number;
  charges_variables: number;
  charges_totales: number;
  resultat: number;
}

export interface YearlyPnl {
  annee: number; // 1..3
  ca: number;
  charges_fixes: number;
  charges_variables: number;
  charges_totales: number;
  resultat: number;
}

export interface SeuilRentabilite {
  /** Taux de marge sur coûts variables = (CA − charges_variables) / CA = 1 − pct. */
  taux_marge_sur_couts_variables: number;
  charges_fixes_annuelles: number;
  /** Point mort en CA (annuel) = charges fixes annuelles / taux de marge. */
  point_mort_ca_annuel: number;
  /** Point mort « en date » : 1er mois (1-indexé) où la trésorerie cumulée devient ≥ 0.
   *  null si non atteint sur l'horizon de 36 mois. */
  point_mort_mois: number | null;
}

export interface ForecastResult {
  horizon_mois: number; // toujours 36
  /** true si 12 mois ont été fournis puis répliqués sur les années 2 et 3 (hypothèse signalée). */
  hypothese_annees_2_3_repliquees: boolean;
  pnl_mensuel: MonthlyPnl[]; // 36 entrées
  pnl_annuel: YearlyPnl[]; // 3 entrées
  /** Trésorerie cumulée mensuelle sur l'année 1 (somme glissante du résultat). 12 entrées. */
  tresorerie_cumulee_mensuelle_annee_1: number[];
  seuil_rentabilite: SeuilRentabilite;
}

// ============================================================
// Comparateur de statuts (status-comparator.ts)
// ============================================================

export interface MicroEntrepreneurInput {
  ca_annuel: number;
  activity_type: ActivityType;
}

export interface FranchiseTvaCheck {
  seuil_base: number;
  seuil_majore: number;
  franchissement_seuil_base: boolean;
  franchissement_seuil_majore: boolean;
  /** Rappel de la limite V1 : contrôle sur une seule année (vs règle réelle sur 2 ans). */
  note: string;
}

export interface MicroEntrepreneurResult {
  statut: "micro-entrepreneur";
  activity_type: ActivityType;
  ca_annuel: number;
  plafond_ca: number;
  statut_valide: boolean;
  /** true si le CA dépasse le plafond micro : dans ce cas on N'affiche PAS un calcul
   *  faussement valide, on lève le drapeau. */
  statut_invalide_plafond_depasse: boolean;
  taux_cotisations: number;
  cotisations: number;
  revenu_net_cotisations: number;
  taux_abattement: number;
  base_imposable_ir: number;
  franchise_tva: FranchiseTvaCheck;
}

export interface SocieteIsInput {
  benefice_imposable: number;
  distribution_dividendes: boolean;
}

export interface SocieteIsResult {
  statut: "societe_is";
  benefice_imposable: number;
  is_tranche_reduite: number;
  is_tranche_normale: number;
  is_total: number;
  resultat_net_apres_is: number;
  distribution_dividendes: boolean;
  pfu_dividendes: number;
  net_porteur: number;
  /** La rémunération du dirigeant (charges assimilé-salarié / TNS) N'est PAS modélisée
   *  en V1 : trop variable pour être précise sans un vrai moteur de paie. Extension
   *  prévue au Lot 3 (V2). Voir status-comparator.ts. */
  remuneration_dirigeant_non_modelisee: true;
}

export interface EntrepriseIndividuelleReelInput {
  benefice_imposable: number;
}

export interface EntrepriseIndividuelleReelResult {
  statut: "entreprise_individuelle_reel";
  /** Ce statut repose sur des taux NON sourcés au centime (cf. rates/fr-2026.ts). On ne
   *  prétend jamais à une précision « au centime » ici. */
  precision: "approximatif_v1";
  benefice_imposable: number;
  cotisations_tns: number;
  ir_bareme_progressif: number;
  net_porteur: number;
}

export interface StatusComparison {
  micro_entrepreneur: MicroEntrepreneurResult;
  societe_is: SocieteIsResult;
  entreprise_individuelle_reel: EntrepriseIndividuelleReelResult;
}
