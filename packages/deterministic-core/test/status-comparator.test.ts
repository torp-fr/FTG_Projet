/**
 * Tests du comparateur de statuts — golden cases FR 2026.
 *
 * Exécution : `pnpm --filter @ftg/deterministic-core test`
 *   ou directement : `node --experimental-strip-types --test test/status-comparator.test.ts`
 *
 * Les valeurs attendues ci-dessous ont été calculées INDÉPENDAMMENT (à la main, depuis
 * les barèmes) : l'implémentation doit tomber pile dessus, jamais l'inverse.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeMicroEntrepreneur,
  computeSocieteIs,
  compareStatuses,
} from "../src/status-comparator.ts";
import { calculateForecast } from "../src/forecast.ts";

// ─────────────────────────────────────────────────────────────────────────────
// CAS 1 (golden) — micro-entrepreneur, services BIC, CA annuel 40 000 €,
//                  sans ACRE, sans versement libératoire.
//   cotisations            = 40 000 × 21,2 %      = 8 480 €
//   revenu net cotisations = 40 000 − 8 480       = 31 520 €
//   base imposable IR      = 40 000 × (1 − 50 %)  = 20 000 €   (abattement services BIC 50 %)
//   statut valide          = 40 000 < 83 600      = true
// ─────────────────────────────────────────────────────────────────────────────
test("CAS 1 (golden) — micro services BIC, CA 40 000 €", () => {
  const r = computeMicroEntrepreneur({
    ca_annuel: 40_000,
    activity_type: "services_bic",
  });
  assert.equal(r.cotisations, 8_480);
  assert.equal(r.revenu_net_cotisations, 31_520);
  assert.equal(r.base_imposable_ir, 20_000);
  assert.equal(r.statut_valide, true);
  assert.equal(r.statut_invalide_plafond_depasse, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 2 (golden) — SASU à l'IS, bénéfice imposable 60 000 €, distribution intégrale.
//   IS tranche réduite  = 42 500 × 15 %            = 6 375 €
//   IS tranche normale  = (60 000 − 42 500) × 25 % = 4 375 €
//   IS total                                        = 10 750 €
//   résultat net après IS = 60 000 − 10 750         = 49 250 €
//   PFU dividendes 31,4 % = 49 250 × 31,4 %          = 15 464,50 €
//   net porteur          = 49 250 − 15 464,50        = 33 785,50 €
// ─────────────────────────────────────────────────────────────────────────────
test("CAS 2 (golden) — SASU IS, bénéfice 60 000 €, distribution intégrale", () => {
  const r = computeSocieteIs({
    benefice_imposable: 60_000,
    distribution_dividendes: true,
  });
  assert.equal(r.is_tranche_reduite, 6_375);
  assert.equal(r.is_tranche_normale, 4_375);
  assert.equal(r.is_total, 10_750);
  assert.equal(r.resultat_net_apres_is, 49_250);
  assert.equal(r.pfu_dividendes, 15_464.5);
  assert.equal(r.net_porteur, 33_785.5);
  assert.equal(r.remuneration_dirigeant_non_modelisee, true);
});

// Garde anti-régression : le PFU 2026 est bien 31,4 % (et non l'ancien 30 %).
// À 30 %, le PFU serait 14 775 € et le net 34 475 € — on vérifie qu'on n'y retombe pas.
test("PFU 2026 = 31,4 % (garde anti-régression sur l'ancien 30 %)", () => {
  const r = computeSocieteIs({
    benefice_imposable: 60_000,
    distribution_dividendes: true,
  });
  assert.notEqual(r.pfu_dividendes, 14_775);
  assert.equal(r.pfu_dividendes, 15_464.5);
});

// Dépassement de plafond micro → drapeau levé, pas de calcul faussement « valide ».
test("micro — CA au-dessus du plafond services → statut_invalide_plafond_depasse", () => {
  const r = computeMicroEntrepreneur({
    ca_annuel: 90_000, // > 83 600
    activity_type: "services_bic",
  });
  assert.equal(r.statut_invalide_plafond_depasse, true);
  assert.equal(r.statut_valide, false);
});

// Le statut EI réel est explicitement marqué approximatif_v1 ; la société IS déclare la
// rémunération dirigeant non modélisée.
test("compareStatuses — EI réel marqué approximatif_v1, IS déclare rému non modélisée", () => {
  const forecast = calculateForecast({
    ca_mensuel: new Array(12).fill(5_000),
    charges_fixes_mensuelles: 1_000,
    charges_variables_pct: 0.3,
  });
  const cmp = compareStatuses(forecast, "services_bic");
  assert.equal(cmp.entreprise_individuelle_reel.precision, "approximatif_v1");
  assert.equal(cmp.societe_is.remuneration_dirigeant_non_modelisee, true);
  assert.equal(cmp.micro_entrepreneur.statut, "micro-entrepreneur");
});
