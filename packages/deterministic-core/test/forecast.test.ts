/**
 * Tests du prévisionnel — P&L 3 ans, trésorerie année 1, seuil de rentabilité.
 *
 * Exécution : `pnpm --filter @ftg/deterministic-core test`
 *   ou directement : `node --experimental-strip-types --test test/forecast.test.ts`
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateForecast } from "../src/forecast.ts";

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 (seuil de rentabilité) — cas simple, vérifié à la main.
//
// Hypothèses :
//   charges fixes mensuelles = 2 000 €  ⇒ charges fixes annuelles = 24 000 €
//   charges variables        = 40 % du CA
//   taux de marge sur coûts variables = 1 − 0,40 = 0,60
//
// Point mort en CA (annuel) = charges fixes annuelles / taux de marge
//                           = 24 000 / 0,60 = 40 000 € de CA.
//
// Point mort « en date » (montée en charge) — CA mensuel année 1 :
//   [1000, 2000, 3000, 4000, 5000, 6000, 6000, 6000, 6000, 6000, 6000, 6000]
//   résultat mensuel = CA × 0,60 − 2 000, trésorerie = somme glissante :
//     M1 :   600 − 2000 = −1400   →  cumul −1400
//     M2 :  1200 − 2000 =  −800   →  cumul −2200
//     M3 :  1800 − 2000 =  −200   →  cumul −2400
//     M4 :  2400 − 2000 =  +400   →  cumul −2000
//     M5 :  3000 − 2000 = +1000   →  cumul −1000
//     M6 :  3600 − 2000 = +1600   →  cumul  +600   ← trésorerie ≥ 0 : point mort = M6
// ─────────────────────────────────────────────────────────────────────────────
test("TEST 3 — seuil de rentabilité : point mort CA = 40 000 €, point mort date = M6", () => {
  const forecast = calculateForecast({
    ca_mensuel: [1000, 2000, 3000, 4000, 5000, 6000, 6000, 6000, 6000, 6000, 6000, 6000],
    charges_fixes_mensuelles: 2000,
    charges_variables_pct: 0.4,
  });
  const s = forecast.seuil_rentabilite;

  assert.equal(s.charges_fixes_annuelles, 24_000);
  assert.ok(
    Math.abs(s.taux_marge_sur_couts_variables - 0.6) < 1e-9,
    "taux de marge attendu = 0,60",
  );
  assert.equal(s.point_mort_ca_annuel, 40_000);
  assert.equal(s.point_mort_mois, 6);

  // Points clés de la trésorerie cumulée année 1 (cf. calcul manuel ci-dessus).
  assert.equal(forecast.tresorerie_cumulee_mensuelle_annee_1[2], -2_400); // fin M3
  assert.equal(forecast.tresorerie_cumulee_mensuelle_annee_1[5], 600); // fin M6
});

// Agrégation annuelle + réplication années 2/3 signalée quand 12 mois sont fournis.
test("forecast — 12 mois fournis : horizon 3 ans, réplication signalée", () => {
  const forecast = calculateForecast({
    ca_mensuel: new Array(12).fill(10_000),
    charges_fixes_mensuelles: 3_000,
    charges_variables_pct: 0.25,
  });
  // CA annuel = 12 × 10 000 = 120 000 ; charges variables 25 % ; charges fixes 12 × 3 000 = 36 000
  // résultat annuel = 120 000 − 36 000 − 30 000 = 54 000
  assert.equal(forecast.horizon_mois, 36);
  assert.equal(forecast.hypothese_annees_2_3_repliquees, true);
  assert.equal(forecast.pnl_annuel.length, 3);
  assert.equal(forecast.pnl_annuel[0].ca, 120_000);
  assert.equal(forecast.pnl_annuel[0].resultat, 54_000);
  assert.equal(forecast.pnl_annuel[1].resultat, 54_000); // année 2 répliquée
  assert.equal(forecast.pnl_mensuel.length, 36);
});

// 36 mois fournis : pris tels quels, pas de réplication.
test("forecast — 36 mois fournis : pas de réplication", () => {
  const ca = new Array(36).fill(8_000);
  const forecast = calculateForecast({
    ca_mensuel: ca,
    charges_fixes_mensuelles: 2_000,
    charges_variables_pct: 0.5,
  });
  assert.equal(forecast.hypothese_annees_2_3_repliquees, false);
  assert.equal(forecast.pnl_mensuel.length, 36);
});

// Garde : longueur invalide rejetée (pas de calcul silencieux sur données mal formées).
test("forecast — longueur ca_mensuel invalide → throw", () => {
  assert.throws(() =>
    calculateForecast({
      ca_mensuel: new Array(10).fill(1000),
      charges_fixes_mensuelles: 500,
      charges_variables_pct: 0.2,
    }),
  );
});

// Garde : charges variables hors [0, 1[ rejetées (division par zéro / marge négative).
test("forecast — charges_variables_pct invalide (>= 1) → throw", () => {
  assert.throws(() =>
    calculateForecast({
      ca_mensuel: new Array(12).fill(1000),
      charges_fixes_mensuelles: 500,
      charges_variables_pct: 1,
    }),
  );
});
