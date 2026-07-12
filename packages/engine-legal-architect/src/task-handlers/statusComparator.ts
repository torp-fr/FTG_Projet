/**
 * Handler task_type = status_comparator (tier intermédiaire, 🔀).
 *
 * RÉUTILISE @ftg/deterministic-core (calculateForecast + compareStatuses) sur LE
 * prévisionnel du projet → comparatif chiffré des 3 statuts. E7 n'ajoute QUE la couche
 * pédagogique + « le choix vous appartient ». Les CHIFFRES viennent EXCLUSIVEMENT du
 * moteur déterministe (zéro chiffre LLM). Les zones d'imprécision assumées (rémunération
 * dirigeant non modélisée, EI réel approximatif_v1) sont affichées telles quelles.
 */
import type { SourceCitation, ThreeWayOption } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import {
  calculateForecast,
  compareStatuses,
  type ActivityType,
  type ForecastInput,
  type ForecastResult,
  type StatusComparison,
} from "@ftg/deterministic-core";
import type { E7Handler } from "../deps.js";
import { STATUS_COMPARATOR_SYSTEM } from "../prompts/status-comparator.js";

/** Date de vérification des barèmes du deterministic_core (cf. rates/fr-2026.ts). */
const BAREMES_VERIF_DATE = "2026-07-11";

interface PedagogyJson {
  pedagogy_md?: string;
  criteria_md?: string;
  imprecision_notes?: unknown;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function buildThreeWays(cmp: StatusComparison): ThreeWayOption[] {
  const m = cmp.micro_entrepreneur;
  const s = cmp.societe_is;
  const e = cmp.entreprise_individuelle_reel;
  return [
    {
      label: "Micro-entrepreneur",
      description: `Cotisations ${m.cotisations} € ; base imposable IR ${m.base_imposable_ir} € (abattement ${Math.round(m.taux_abattement * 100)} %). Statut ${m.statut_valide ? "dans les plafonds" : "au-dessus du plafond"} (plafond CA ${m.plafond_ca} €).`,
      risks: m.statut_invalide_plafond_depasse ? ["CA au-dessus du plafond micro : régime non applicable en l'état"] : ["Plafond de CA à surveiller", "Pas de déduction des charges réelles"],
      conditions: ["CA sous le plafond du régime micro"],
    },
    {
      label: "Société à l'IS",
      description: `IS total ${s.is_total} € ; résultat net après IS ${s.resultat_net_apres_is} € ; net porteur après PFU ${s.net_porteur} € (si distribution).`,
      risks: ["Rémunération du dirigeant NON modélisée (V1) — à chiffrer avec un professionnel", "Coût et formalisme de structure plus élevés"],
      conditions: ["Comptabilité d'engagement", "Arbitrage rémunération / dividendes à définir"],
    },
    {
      label: "Entreprise individuelle au réel",
      description: `Cotisations TNS ${e.cotisations_tns} € ; IR ${e.ir_bareme_progressif} € ; net porteur ${e.net_porteur} € — ⚠️ approximatif (ordre de grandeur, ${e.precision}).`,
      risks: ["Chiffres approximatifs V1 (barème IR/TNS non sourcés au centime)", "Responsabilité sur le patrimoine (hors patrimoine personnel protégé)"],
      conditions: ["Tenue d'une comptabilité au réel"],
    },
  ];
}

export const statusComparator: E7Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const activity_type = (typeof si.activity_type === "string" ? si.activity_type : "services_bic") as ActivityType;
  const distribution_dividendes = si.distribution_dividendes === undefined ? true : Boolean(si.distribution_dividendes);

  // Prévisionnel : soit fourni tel quel (ForecastResult), soit calculé depuis un ForecastInput.
  const forecast: ForecastResult = si.forecast
    ? (si.forecast as ForecastResult)
    : calculateForecast((si.forecast_input ?? { ca_mensuel: new Array(12).fill(0), charges_fixes_mensuelles: 0, charges_variables_pct: 0 }) as ForecastInput);

  // CHIFFRES : exclusivement du moteur déterministe.
  const comparison = compareStatuses(forecast, activity_type, { distribution_dividendes });
  const annee1 = forecast.pnl_annuel[0];

  // Couche pédagogique (LLM) — AUCUN nouveau chiffre.
  const userPrompt = [
    "Comparatif CHIFFRÉ des 3 statuts (moteur déterministe FTG, barèmes datés) — NE PRODUIS AUCUN NOUVEAU CHIFFRE :",
    JSON.stringify({ previsionnel_annee1: { ca: annee1.ca, resultat: annee1.resultat }, comparison }, null, 2),
    "",
    "Produis la couche pédagogique factuelle et neutre, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<PedagogyJson>(await deps.callModel("intermediaire", STATUS_COMPARATOR_SYSTEM, userPrompt));

  const status_comparison = {
    activity_type,
    previsionnel_annee1: { ca: annee1.ca, resultat: annee1.resultat },
    comparison, // ← sortie EXACTE du deterministic_core (au centime)
    pedagogy_md: parsed.pedagogy_md ?? "",
    criteria_md: parsed.criteria_md ?? "",
    imprecision_notes: arr(parsed.imprecision_notes).length
      ? arr(parsed.imprecision_notes)
      : ["rémunération du dirigeant non modélisée (société IS)", "EI au réel : approximatif — ordre de grandeur"],
    choice_belongs_to_founder: true,
  };

  const sources: SourceCitation[] = [
    {
      claim: "Comparatif chiffré des 3 statuts (micro / société IS / EI réel) sur le prévisionnel — micro & IS.",
      source: "@ftg/deterministic-core — barèmes FR 2026",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: false,
      method: null,
    },
    {
      claim: "Statut « entreprise individuelle au réel » — ordre de grandeur.",
      source: "@ftg/deterministic-core (EI réel, approximatif_v1)",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: true,
      method: "Barème IR indicatif + taux TNS forfaitaire NON sourcés au centime (approximatif_v1) — ordre de grandeur, jamais présenté comme précis.",
    },
    {
      claim: "Lecture pédagogique du comparatif.",
      source: "Raisonnement E7 (L'Architecte)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Explication factuelle et neutre des chiffres déterministes fournis — aucun chiffre produit par le modèle, aucune recommandation de statut.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Comparateur de statuts (E7 · L'Architecte 🔀)", contentMd: status_comparison.pedagogy_md, type: "status_comparator" },
      structuredData: { status_comparison },
      threeWays: buildThreeWays(comparison),
      sources,
      scores: { qualitySelf: 82, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
