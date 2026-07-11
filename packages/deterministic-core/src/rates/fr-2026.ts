/**
 * Barèmes fiscaux & sociaux France — millésime 2026.
 *
 * Barèmes vérifiés le 11/07/2026 — à revalider par un expert-comptable avant tout
 * usage commercial réel. Voir docs/ops/baremes-fr-2026-deterministic-core.md pour le
 * détail des sources.
 *
 * ── CONTRAINTE CRITIQUE DU PACKAGE ────────────────────────────────────────────
 * Ce moteur produit des chiffres présentés à de vrais porteurs de projet pour
 * arbitrer leur statut juridique : zéro tolérance à l'approximation silencieuse.
 * Aucun taux/plafond/seuil n'apparaît « en dur » (nombre magique) dans forecast.ts
 * ou status-comparator.ts. Chaque valeur est UNE constante nommée ci-dessous, avec sa
 * source et sa date de vérification.
 *
 * Convention : les taux sont exprimés en fraction décimale (0.212 = 21,2 %).
 */

// ============================================================
// MICRO-ENTREPRENEUR
// ============================================================

/** Plafond de CA — vente de marchandises / hébergement (BIC) : 203 100 € (période
 *  2026-2028). Source: legifiscal.fr (seuils micro-entreprises 2026-2028). Vérifié le 11/07/2026. */
export const PLAFOND_CA_MICRO_VENTE = 203_100;

/** Plafond de CA — prestations de services (BIC & BNC) : 83 600 € (période 2026-2028).
 *  Source: legifiscal.fr (seuils micro-entreprises 2026-2028). Vérifié le 11/07/2026. */
export const PLAFOND_CA_MICRO_SERVICES = 83_600;

/** Cotisations sociales micro — vente de marchandises (BIC) : 12,3 %.
 *  Source: economie.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_COTIS_MICRO_VENTE = 0.123;

/** Cotisations sociales micro — prestations de services BIC : 21,2 %.
 *  Source: economie.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_COTIS_MICRO_SERVICES_BIC = 0.212;

/** Cotisations sociales micro — activités BNC (hors Cipav) : 25,6 %.
 *  Source: economie.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_COTIS_MICRO_BNC = 0.256;

/** Cotisations sociales micro — professions libérales relevant de la Cipav : 23,2 %.
 *  Source: economie.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_COTIS_MICRO_CIPAV = 0.232;

/** Franchise en base de TVA — vente/hébergement : seuil de base 85 000 €.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const SEUIL_FRANCHISE_TVA_VENTE_BASE = 85_000;
/** Franchise en base de TVA — vente/hébergement : seuil majoré 93 500 €.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const SEUIL_FRANCHISE_TVA_VENTE_MAJORE = 93_500;

/** Franchise en base de TVA — prestations de services : seuil de base 37 500 €.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const SEUIL_FRANCHISE_TVA_SERVICES_BASE = 37_500;
/** Franchise en base de TVA — prestations de services : seuil majoré 41 250 €.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const SEUIL_FRANCHISE_TVA_SERVICES_MAJORE = 41_250;

/** Abattement forfaitaire micro-fiscal (IR) — vente/hébergement : 71 % du CA.
 *  Barème micro-fiscal standard — à re-sourcer/vérifier séparément si une précision IR
 *  au centime est requise. Vérifié le 11/07/2026. */
export const ABATTEMENT_MICRO_VENTE = 0.71;
/** Abattement forfaitaire micro-fiscal (IR) — prestations de services BIC : 50 % du CA.
 *  Barème micro-fiscal standard — à re-sourcer/vérifier séparément si besoin. Vérifié le 11/07/2026. */
export const ABATTEMENT_MICRO_SERVICES_BIC = 0.5;
/** Abattement forfaitaire micro-fiscal (IR) — BNC : 34 % du CA.
 *  Barème micro-fiscal standard — à re-sourcer/vérifier séparément si besoin. Vérifié le 11/07/2026. */
export const ABATTEMENT_MICRO_BNC = 0.34;

// ============================================================
// SOCIÉTÉ À L'IS
// ============================================================

/** IS — taux réduit PME : 15 % sur la fraction de bénéfice imposable jusqu'à 42 500 €.
 *  Conditions : CA < 10 M€, capital entièrement libéré, ≥ 75 % détenu par des personnes
 *  physiques. Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const TAUX_IS_REDUIT = 0.15;
/** IS — plafond de la tranche à taux réduit : 42 500 € de bénéfice imposable.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const PLAFOND_IS_REDUIT = 42_500;

/** IS — taux normal : 25 % au-delà de 42 500 € de bénéfice imposable.
 *  Source: legifiscal.fr. Vérifié le 11/07/2026. */
export const TAUX_IS_NORMAL = 0.25;

/** PFU (« flat tax ») — part impôt sur le revenu : 12,8 %.
 *  Source: entreprendre.service-public.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_PFU_IR = 0.128;
/** PFU (« flat tax ») — part prélèvements sociaux : 18,6 %.
 *  ⚠️ Hausse de la CSG de +1,4 pt EN VIGUEUR DEPUIS LE 01/01/2026 (17,2 % → 18,6 %).
 *  Source: entreprendre.service-public.gouv.fr. Vérifié le 11/07/2026. */
export const TAUX_PFU_PRELEVEMENTS_SOCIAUX = 0.186;
/**
 * PFU total sur dividendes distribués : 31,4 % = 12,8 % IR + 18,6 % prélèvements sociaux.
 *
 * ⚠️ EN VIGUEUR DEPUIS LE 01/01/2026 — hausse de +1,4 pt de la CSG vs l'ancien taux de
 * 30 % (12,8 % + 17,2 %) applicable de 2018 à 2025. NE PAS utiliser 30 %.
 * Source: entreprendre.service-public.gouv.fr. Vérifié le 11/07/2026.
 */
export const TAUX_PFU_DIVIDENDES = 0.314; // = TAUX_PFU_IR + TAUX_PFU_PRELEVEMENTS_SOCIAUX

// ============================================================
// ENTREPRISE INDIVIDUELLE — RÉGIME RÉEL   (⚠️ approximatif — V1)
// ============================================================
//
// ⚠️ Les valeurs de ce bloc NE SONT PAS sourcées avec la même précision que les blocs
// micro / IS ci-dessus. Elles ne servent qu'à donner un ORDRE DE GRANDEUR pour le statut
// « entreprise individuelle au régime réel », lequel est explicitement marqué
// precision:"approximatif_v1" dans son résultat et ne doit JAMAIS être présenté comme
// précis « au centime ». À revalider au Lot 3 (barème IR officiel + assiette réelle des
// cotisations TNS, qui est dégressive et dépend de nombreux paramètres).

/**
 * Barème progressif de l'IR — tranches indicatives, quotient familial = 1 part.
 * NON SOURCÉ AVEC PRÉCISION — ordre de grandeur V1 uniquement (millésime à revalider).
 */
export const BAREME_IR_APPROX_V1: ReadonlyArray<{ plafond: number; taux: number }> = [
  { plafond: 11_497, taux: 0.0 },
  { plafond: 29_315, taux: 0.11 },
  { plafond: 83_823, taux: 0.3 },
  { plafond: 180_294, taux: 0.41 },
  { plafond: Infinity, taux: 0.45 },
];

/**
 * Taux forfaitaire APPROXIMATIF de cotisations TNS sur le bénéfice réel (EI).
 * NON SOURCÉ AVEC PRÉCISION — l'assiette réelle est dégressive et dépend de nombreux
 * paramètres. Ordre de grandeur V1 uniquement.
 */
export const TAUX_COTIS_TNS_APPROX_V1 = 0.4;
