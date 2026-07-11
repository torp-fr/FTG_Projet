/**
 * @ftg/engine-sdk — Garanties comportementales (Chantier 4 §3.3)
 *
 * Ces vérifications sont ce que les golden sets rejouent (eval_runs) pour
 * accepter/rejeter une engine_version candidate. Elles sont volontairement
 * indépendantes de tout provider LLM : validation mécanique de l'enveloppe
 * de sortie, jamais un jugement de contenu.
 */

import type { EngineOutputEnvelope } from "./types.js";

/**
 * D25 — Neutralité factuelle orientée solutions (Amendement A4).
 * Détection lexicale des jugements de faisabilité interdits. Ce n'est qu'un
 * filet mécanique de premier niveau — la vraie garantie vient de la rubrique
 * d'éval humaine/LLM-judge sur golden_cases, mais aucun de ces termes ne doit
 * jamais apparaître tel quel dans un deliverable.
 */
export const FORBIDDEN_FEASIBILITY_TERMS = [
  "impossible",
  "mauvaise idée",
  "ça ne marchera pas",
  "c'est voué à l'échec",
  "n'a aucune chance",
  "vous ne devriez pas",
] as const;

export interface ContractViolation {
  rule: string;
  detail: string;
}

/**
 * Vérifie qu'aucun terme de jugement de faisabilité n'apparaît dans le texte
 * du livrable. Retourne la liste des violations (vide = conforme).
 */
export function checkFactualNeutrality(contentMd: string): ContractViolation[] {
  const lower = contentMd.toLowerCase();
  const violations: ContractViolation[] = [];
  for (const term of FORBIDDEN_FEASIBILITY_TERMS) {
    if (lower.includes(term)) {
      violations.push({
        rule: "D25_factual_neutrality",
        detail: `Terme de jugement de faisabilité détecté : "${term}"`,
      });
    }
  }
  return violations;
}

/**
 * A5.1 — Recherche waterfall ≥ 3 niveaux sur toute tâche de recherche.
 */
export function checkWaterfallDepth(
  researchDepthReached: number,
  researchDepthMin: number
): ContractViolation[] {
  if (researchDepthReached < researchDepthMin) {
    return [
      {
        rule: "A5.1_waterfall_depth",
        detail: `Profondeur de recherche atteinte (${researchDepthReached}) < minimum requis (${researchDepthMin}).`,
      },
    ];
  }
  return [];
}

/**
 * A5.4 — Factualité certifiable : toute affirmation factuelle sourcée
 * (source + date) ou étiquetée is_estimate avec sa méthode. Zéro fait nu.
 */
export function checkSourcesWellFormed(envelope: EngineOutputEnvelope): ContractViolation[] {
  const violations: ContractViolation[] = [];
  envelope.sources.forEach((s, i) => {
    if (!s.isEstimate && (!s.source || !s.date)) {
      violations.push({
        rule: "A5.4_factuality",
        detail: `sources[${i}] ("${s.claim}") n'est ni sourcée (source+date) ni marquée is_estimate.`,
      });
    }
    if (s.isEstimate && !s.method) {
      violations.push({
        rule: "A5.4_factuality",
        detail: `sources[${i}] ("${s.claim}") est une estimation sans méthode déclarée.`,
      });
    }
  });
  return violations;
}

/**
 * D25 — hors verdict 'validated', au moins un solution_path est obligatoire.
 * Cette règle est vérifiée côté Gatekeeper (elle porte sur gate_evaluations),
 * mais un engine qui identifie un obstacle doit systématiquement proposer un
 * chemin de solution dans son enveloppe de sortie — vérification symétrique
 * ici au niveau engine.
 */
export function checkSolutionOrientation(
  envelope: EngineOutputEnvelope,
  obstacleDetected: boolean
): ContractViolation[] {
  if (obstacleDetected && envelope.solutionPaths.length === 0) {
    return [
      {
        rule: "D25_solution_orientation",
        detail: "Un obstacle a été identifié sans qu'aucun solution_path ne soit proposé.",
      },
    ];
  }
  return [];
}

/**
 * Validation complète d'une enveloppe de sortie contre les 3 garanties
 * mécaniquement vérifiables (neutralité, waterfall, sourcing). La garantie
 * #3 (idempotence) et #5 (routage sobre) se vérifient par rejeu (eval_runs),
 * pas par inspection statique d'une seule sortie.
 */
export function validateOutputEnvelope(
  envelope: EngineOutputEnvelope,
  opts: { researchDepthMin: number; obstacleDetected?: boolean }
): ContractViolation[] {
  return [
    ...checkFactualNeutrality(envelope.deliverable.contentMd),
    ...checkWaterfallDepth(envelope.telemetry.researchDepthReached, opts.researchDepthMin),
    ...checkSourcesWellFormed(envelope),
    ...checkSolutionOrientation(envelope, opts.obstacleDetected ?? false),
  ];
}
