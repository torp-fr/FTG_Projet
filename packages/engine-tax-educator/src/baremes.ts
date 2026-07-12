/**
 * Barèmes fiscaux DATÉS pour E8, dérivés EXCLUSIVEMENT de @ftg/deterministic-core
 * (aucun chiffre en dur ici, aucun chiffre LLM). Les taux/seuils micro sont obtenus via
 * computeMicroEntrepreneur (réutilisation directe du moteur), les taux IS/PFU via les
 * constantes sourcées. Chaque barème porte sa DATE DE VALIDITÉ.
 */
import {
  computeMicroEntrepreneur,
  TAUX_IS_REDUIT,
  PLAFOND_IS_REDUIT,
  TAUX_IS_NORMAL,
  TAUX_PFU_IR,
  TAUX_PFU_PRELEVEMENTS_SOCIAUX,
  TAUX_PFU_DIVIDENDES,
  type ActivityType,
} from "@ftg/deterministic-core";
import { BAREMES_VERIF_DATE } from "./deps.js";

export interface Baremes {
  date_validite: string;
  micro: {
    activity_type: ActivityType;
    plafond_ca: number;
    taux_cotisations: number;
    taux_abattement: number;
    franchise_tva_base: number;
    franchise_tva_majore: number;
  };
  societe_is: { taux_reduit: number; plafond_reduit: number; taux_normal: number };
  pfu: { ir: number; prelevements_sociaux: number; total_dividendes: number };
}

/** Barèmes datés pour une nature d'activité (chiffres = deterministic_core). */
export function baremesForActivity(activity_type: ActivityType): Baremes {
  // ca_annuel=0 : on n'exploite que les TAUX/SEUILS renvoyés (indépendants du CA).
  const m = computeMicroEntrepreneur({ ca_annuel: 0, activity_type });
  return {
    date_validite: BAREMES_VERIF_DATE,
    micro: {
      activity_type,
      plafond_ca: m.plafond_ca,
      taux_cotisations: m.taux_cotisations,
      taux_abattement: m.taux_abattement,
      franchise_tva_base: m.franchise_tva.seuil_base,
      franchise_tva_majore: m.franchise_tva.seuil_majore,
    },
    societe_is: { taux_reduit: TAUX_IS_REDUIT, plafond_reduit: PLAFOND_IS_REDUIT, taux_normal: TAUX_IS_NORMAL },
    pfu: { ir: TAUX_PFU_IR, prelevements_sociaux: TAUX_PFU_PRELEVEMENTS_SOCIAUX, total_dividendes: TAUX_PFU_DIVIDENDES },
  };
}
