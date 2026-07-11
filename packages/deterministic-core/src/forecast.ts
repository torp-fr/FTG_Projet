/**
 * Prévisionnel financier déterministe — P&L 3 ans, trésorerie année 1, seuil de
 * rentabilité (point mort en CA et en date).
 *
 * Fonction PURE : zéro appel réseau, zéro LLM, sortie entièrement déterminée par
 * l'entrée. Tous les montants sont arrondis au centime (round2) pour éviter toute
 * dérive de flottant dans les chiffres présentés au porteur.
 */

import type {
  ForecastInput,
  ForecastResult,
  MonthlyPnl,
  YearlyPnl,
  SeuilRentabilite,
} from "./types.ts";

const MOIS_PAR_AN = 12;
const HORIZON_MOIS = 36;

/** Arrondi monétaire déterministe au centime (2 décimales). Volontairement local au
 *  module pour garder l'API publique du package limitée aux fonctions métier. */
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function calculateForecast(input: ForecastInput): ForecastResult {
  const { ca_mensuel, charges_fixes_mensuelles, charges_variables_pct } = input;

  if (ca_mensuel.length !== 12 && ca_mensuel.length !== 36) {
    throw new Error(
      `calculateForecast: ca_mensuel doit contenir 12 ou 36 mois (reçu ${ca_mensuel.length}).`,
    );
  }
  if (charges_variables_pct < 0 || charges_variables_pct >= 1) {
    throw new Error(
      `calculateForecast: charges_variables_pct doit être dans [0, 1[ (reçu ${charges_variables_pct}).`,
    );
  }

  // Étendre à 36 mois si un seul exercice (12 mois) est fourni. Hypothèse explicite et
  // signalée (hypothese_annees_2_3_repliquees) : années 2 et 3 identiques à l'année 1.
  const hypothese_annees_2_3_repliquees = ca_mensuel.length === 12;
  const ca36 = hypothese_annees_2_3_repliquees
    ? [...ca_mensuel, ...ca_mensuel, ...ca_mensuel]
    : ca_mensuel;

  const pnl_mensuel: MonthlyPnl[] = ca36.map((caBrut, i) => {
    const ca = round2(caBrut);
    const charges_fixes = round2(charges_fixes_mensuelles);
    const charges_variables = round2(caBrut * charges_variables_pct);
    const charges_totales = round2(charges_fixes + charges_variables);
    const resultat = round2(ca - charges_totales);
    return {
      mois: i + 1,
      annee: Math.floor(i / MOIS_PAR_AN) + 1,
      ca,
      charges_fixes,
      charges_variables,
      charges_totales,
      resultat,
    };
  });

  const pnl_annuel: YearlyPnl[] = [1, 2, 3].map((annee) => {
    const mois = pnl_mensuel.filter((m) => m.annee === annee);
    const sum = (sel: (m: MonthlyPnl) => number) =>
      round2(mois.reduce((acc, m) => acc + sel(m), 0));
    return {
      annee,
      ca: sum((m) => m.ca),
      charges_fixes: sum((m) => m.charges_fixes),
      charges_variables: sum((m) => m.charges_variables),
      charges_totales: sum((m) => m.charges_totales),
      resultat: sum((m) => m.resultat),
    };
  });

  // Trésorerie cumulée mensuelle — année 1 (somme glissante du résultat mensuel).
  const tresorerie_cumulee_mensuelle_annee_1: number[] = [];
  let cumulAnnee1 = 0;
  for (const m of pnl_mensuel.filter((m) => m.annee === 1)) {
    cumulAnnee1 = round2(cumulAnnee1 + m.resultat);
    tresorerie_cumulee_mensuelle_annee_1.push(cumulAnnee1);
  }

  const seuil_rentabilite = computeSeuilRentabilite(
    charges_fixes_mensuelles,
    charges_variables_pct,
    pnl_mensuel,
  );

  return {
    horizon_mois: HORIZON_MOIS,
    hypothese_annees_2_3_repliquees,
    pnl_mensuel,
    pnl_annuel,
    tresorerie_cumulee_mensuelle_annee_1,
    seuil_rentabilite,
  };
}

function computeSeuilRentabilite(
  charges_fixes_mensuelles: number,
  charges_variables_pct: number,
  pnl_mensuel: MonthlyPnl[],
): SeuilRentabilite {
  // Taux de marge sur coûts variables = (CA − charges_variables) / CA = 1 − pct.
  // Indépendant du niveau de CA : les charges variables sont proportionnelles au CA.
  // pct ∈ [0, 1[ (validé en amont) ⇒ taux_marge ∈ ]0, 1] ⇒ pas de division par zéro.
  const taux_marge_sur_couts_variables = 1 - charges_variables_pct;
  const charges_fixes_annuelles = round2(charges_fixes_mensuelles * MOIS_PAR_AN);

  // Point mort en CA (annuel) = charges fixes annuelles / taux de marge.
  const point_mort_ca_annuel = round2(
    charges_fixes_annuelles / taux_marge_sur_couts_variables,
  );

  // Point mort « en date » = 1er mois où la trésorerie cumulée (somme des résultats
  // mensuels) devient ≥ 0. null si jamais atteint sur l'horizon.
  let point_mort_mois: number | null = null;
  let cumul = 0;
  for (const m of pnl_mensuel) {
    cumul += m.resultat;
    if (cumul >= 0) {
      point_mort_mois = m.mois;
      break;
    }
  }

  return {
    taux_marge_sur_couts_variables,
    charges_fixes_annuelles,
    point_mort_ca_annuel,
    point_mort_mois,
  };
}
