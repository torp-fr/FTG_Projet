/**
 * Comparateur de statuts juridiques — calcule, sur LE MÊME prévisionnel, ce que
 * donnent les 3 statuts : micro-entrepreneur, société à l'IS, entreprise individuelle
 * au régime réel.
 *
 * Fonctions PURES : zéro appel réseau, zéro LLM. Tous les taux proviennent de
 * rates/fr-2026.ts (aucun nombre magique inline). Montants arrondis au centime.
 */

import type {
  ActivityType,
  ForecastResult,
  MicroEntrepreneurInput,
  MicroEntrepreneurResult,
  SocieteIsInput,
  SocieteIsResult,
  EntrepriseIndividuelleReelInput,
  EntrepriseIndividuelleReelResult,
  StatusComparison,
} from "./types.ts";
import {
  PLAFOND_CA_MICRO_VENTE,
  PLAFOND_CA_MICRO_SERVICES,
  TAUX_COTIS_MICRO_VENTE,
  TAUX_COTIS_MICRO_SERVICES_BIC,
  TAUX_COTIS_MICRO_BNC,
  TAUX_COTIS_MICRO_CIPAV,
  SEUIL_FRANCHISE_TVA_VENTE_BASE,
  SEUIL_FRANCHISE_TVA_VENTE_MAJORE,
  SEUIL_FRANCHISE_TVA_SERVICES_BASE,
  SEUIL_FRANCHISE_TVA_SERVICES_MAJORE,
  ABATTEMENT_MICRO_VENTE,
  ABATTEMENT_MICRO_SERVICES_BIC,
  ABATTEMENT_MICRO_BNC,
  TAUX_IS_REDUIT,
  PLAFOND_IS_REDUIT,
  TAUX_IS_NORMAL,
  TAUX_PFU_DIVIDENDES,
  BAREME_IR_APPROX_V1,
  TAUX_COTIS_TNS_APPROX_V1,
} from "./rates/fr-2026.ts";

/** Arrondi monétaire déterministe au centime (2 décimales). Volontairement local au
 *  module pour garder l'API publique du package limitée aux fonctions métier. */
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// ============================================================
// (a) Micro-entrepreneur
// ============================================================

interface MicroParams {
  plafond_ca: number;
  taux_cotisations: number;
  taux_abattement: number;
  seuil_tva_base: number;
  seuil_tva_majore: number;
}

function microParams(activity_type: ActivityType): MicroParams {
  switch (activity_type) {
    case "vente":
      return {
        plafond_ca: PLAFOND_CA_MICRO_VENTE,
        taux_cotisations: TAUX_COTIS_MICRO_VENTE,
        taux_abattement: ABATTEMENT_MICRO_VENTE,
        seuil_tva_base: SEUIL_FRANCHISE_TVA_VENTE_BASE,
        seuil_tva_majore: SEUIL_FRANCHISE_TVA_VENTE_MAJORE,
      };
    case "services_bic":
      return {
        plafond_ca: PLAFOND_CA_MICRO_SERVICES,
        taux_cotisations: TAUX_COTIS_MICRO_SERVICES_BIC,
        taux_abattement: ABATTEMENT_MICRO_SERVICES_BIC,
        seuil_tva_base: SEUIL_FRANCHISE_TVA_SERVICES_BASE,
        seuil_tva_majore: SEUIL_FRANCHISE_TVA_SERVICES_MAJORE,
      };
    case "services_bnc":
      return {
        plafond_ca: PLAFOND_CA_MICRO_SERVICES,
        taux_cotisations: TAUX_COTIS_MICRO_BNC,
        taux_abattement: ABATTEMENT_MICRO_BNC,
        seuil_tva_base: SEUIL_FRANCHISE_TVA_SERVICES_BASE,
        seuil_tva_majore: SEUIL_FRANCHISE_TVA_SERVICES_MAJORE,
      };
    case "liberal_cipav":
      return {
        plafond_ca: PLAFOND_CA_MICRO_SERVICES,
        taux_cotisations: TAUX_COTIS_MICRO_CIPAV,
        taux_abattement: ABATTEMENT_MICRO_BNC,
        seuil_tva_base: SEUIL_FRANCHISE_TVA_SERVICES_BASE,
        seuil_tva_majore: SEUIL_FRANCHISE_TVA_SERVICES_MAJORE,
      };
    default: {
      // Exhaustivité : si un ActivityType est ajouté sans être traité ici, tsc échoue.
      const _exhaustive: never = activity_type;
      throw new Error(`Type d'activité inconnu: ${String(_exhaustive)}`);
    }
  }
}

export function computeMicroEntrepreneur(
  input: MicroEntrepreneurInput,
): MicroEntrepreneurResult {
  const { ca_annuel, activity_type } = input;
  const p = microParams(activity_type);

  // Dépassement de plafond : on lève le drapeau plutôt que d'afficher un calcul
  // faussement « valide ».
  const statut_invalide_plafond_depasse = ca_annuel > p.plafond_ca;
  const statut_valide = !statut_invalide_plafond_depasse;

  const cotisations = round2(ca_annuel * p.taux_cotisations);
  const revenu_net_cotisations = round2(ca_annuel - cotisations);
  const base_imposable_ir = round2(ca_annuel * (1 - p.taux_abattement));

  return {
    statut: "micro-entrepreneur",
    activity_type,
    ca_annuel: round2(ca_annuel),
    plafond_ca: p.plafond_ca,
    statut_valide,
    statut_invalide_plafond_depasse,
    taux_cotisations: p.taux_cotisations,
    cotisations,
    revenu_net_cotisations,
    taux_abattement: p.taux_abattement,
    base_imposable_ir,
    franchise_tva: {
      seuil_base: p.seuil_tva_base,
      seuil_majore: p.seuil_tva_majore,
      franchissement_seuil_base: ca_annuel > p.seuil_tva_base,
      franchissement_seuil_majore: ca_annuel > p.seuil_tva_majore,
      note:
        "V1 : contrôle sur une seule année. La vraie règle du seuil de base " +
        "s'apprécie sur deux années civiles consécutives ; le dépassement du seuil " +
        "majoré, lui, fait basculer à la TVA dès le mois de dépassement.",
    },
  };
}

// ============================================================
// (b) Société à l'IS
// ============================================================

export function computeSocieteIs(input: SocieteIsInput): SocieteIsResult {
  const { benefice_imposable, distribution_dividendes } = input;

  // IS par tranches : 15 % jusqu'à 42 500 €, 25 % au-delà. Clamp à 0 pour ne jamais
  // produire un IS négatif sur un exercice déficitaire.
  const base_reduite = Math.max(0, Math.min(benefice_imposable, PLAFOND_IS_REDUIT));
  const base_normale = Math.max(0, benefice_imposable - PLAFOND_IS_REDUIT);

  const is_tranche_reduite = round2(base_reduite * TAUX_IS_REDUIT);
  const is_tranche_normale = round2(base_normale * TAUX_IS_NORMAL);
  const is_total = round2(is_tranche_reduite + is_tranche_normale);
  const resultat_net_apres_is = round2(benefice_imposable - is_total);

  // PFU 31,4 % appliqué au résultat net distribué. On ne distribue que si le résultat
  // net après IS est positif (pas de « dividende » sur une perte).
  const distribue = distribution_dividendes && resultat_net_apres_is > 0;
  const pfu_dividendes = distribue
    ? round2(resultat_net_apres_is * TAUX_PFU_DIVIDENDES)
    : 0;
  const net_porteur = round2(resultat_net_apres_is - pfu_dividendes);

  return {
    statut: "societe_is",
    benefice_imposable: round2(benefice_imposable),
    is_tranche_reduite,
    is_tranche_normale,
    is_total,
    resultat_net_apres_is,
    distribution_dividendes,
    pfu_dividendes,
    net_porteur,
    // V1 : la rémunération du dirigeant (charges assimilé-salarié / TNS) n'est pas
    // modélisée. Trop variable pour être précise sans un vrai moteur de paie —
    // extension V2/Lot 3.
    remuneration_dirigeant_non_modelisee: true,
  };
}

// ============================================================
// (c) Entreprise individuelle — régime réel   (⚠️ approximatif_v1)
// ============================================================

/** IR par tranches progressives (barème indicatif V1, 1 part). NON précis — sert
 *  uniquement à donner un ordre de grandeur. */
function irBaremeProgressif(revenuImposable: number): number {
  let ir = 0;
  let plancher = 0;
  for (const tranche of BAREME_IR_APPROX_V1) {
    if (revenuImposable <= plancher) break;
    const assietteTranche = Math.min(revenuImposable, tranche.plafond) - plancher;
    ir += assietteTranche * tranche.taux;
    plancher = tranche.plafond;
  }
  return ir;
}

export function computeEntrepriseIndividuelleReel(
  input: EntrepriseIndividuelleReelInput,
): EntrepriseIndividuelleReelResult {
  const { benefice_imposable } = input;

  // ⚠️ approximatif_v1 : taux TNS et barème IR NON sourcés au centime (cf.
  // rates/fr-2026.ts). Ordre de grandeur uniquement — jamais présenté comme précis.
  const cotisations_tns = round2(
    Math.max(0, benefice_imposable) * TAUX_COTIS_TNS_APPROX_V1,
  );

  // IR au barème progressif sur le bénéfice réel (pas d'abattement micro). Assiette V1
  // simplifiée : bénéfice net des cotisations TNS, quotient familial = 1 part.
  const assiette_ir = Math.max(0, benefice_imposable - cotisations_tns);
  const ir_bareme_progressif = round2(irBaremeProgressif(assiette_ir));

  const net_porteur = round2(
    benefice_imposable - cotisations_tns - ir_bareme_progressif,
  );

  return {
    statut: "entreprise_individuelle_reel",
    precision: "approximatif_v1",
    benefice_imposable: round2(benefice_imposable),
    cotisations_tns,
    ir_bareme_progressif,
    net_porteur,
  };
}

// ============================================================
// Comparateur — les 3 statuts sur le même prévisionnel
// ============================================================

export interface CompareOptions {
  /** Distribution intégrale du résultat en dividendes pour le scénario société à l'IS
   *  (par défaut true). */
  distribution_dividendes?: boolean;
}

export function compareStatuses(
  forecast: ForecastResult,
  activity_type: ActivityType,
  options: CompareOptions = {},
): StatusComparison {
  // On compare sur l'année 1 du prévisionnel : CA pour la base micro, résultat pour la
  // base imposable société/EI.
  const annee1 = forecast.pnl_annuel[0];
  const ca_annuel = annee1.ca;
  const benefice = annee1.resultat;
  const distribution_dividendes = options.distribution_dividendes ?? true;

  return {
    micro_entrepreneur: computeMicroEntrepreneur({ ca_annuel, activity_type }),
    societe_is: computeSocieteIs({
      benefice_imposable: benefice,
      distribution_dividendes,
    }),
    entreprise_individuelle_reel: computeEntrepriseIndividuelleReel({
      benefice_imposable: benefice,
    }),
  };
}
