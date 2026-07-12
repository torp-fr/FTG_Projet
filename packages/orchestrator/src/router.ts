/**
 * Router — Chantier 4 §4
 *
 * Constitue l'enveloppe d'entrée d'un engine : injecte état canonique +
 * digests de dépendances + profils (segment, fondateur, ambition) +
 * lentilles géo ; choisit le canal LLM et le tier de modèle.
 *
 * Lot 1 : la forme de l'enveloppe (types EngineInputEnvelope, @ftg/engine-sdk)
 * et le squelette de construction sont posés ici. Le branchement réel aux
 * appels LLM (model_routing par engine, canaux oauth/byok/pooled) et à
 * l'anti-doublon (registre de couverture → route vers enrichissement au lieu
 * de dupliquer un run) arrive au Lot 2 avec les premiers engines E1/E2/E3.
 */

import type {
  EngineConstraints,
  EngineInputEnvelope,
  FounderProfileContext,
  ProjectContext,
  SegmentProfileContext,
} from "@ftg/engine-sdk";

export interface RouterBuildParams {
  runId: string;
  taskType: string;
  structuredInput: Record<string, unknown>;
  projectContext: ProjectContext;
  llmChannel: EngineConstraints["llmChannel"];
  researchDepthMin?: number;
}

export function buildInputEnvelope(params: RouterBuildParams): EngineInputEnvelope {
  return {
    runId: params.runId,
    taskType: params.taskType,
    projectContext: params.projectContext,
    structuredInput: params.structuredInput,
    constraints: {
      quotas: {},
      llmChannel: params.llmChannel,
      researchDepthMin: params.researchDepthMin ?? 3, // A5.1 — plancher standard
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"], // A5.5
    },
  };
}

export function buildFounderProfileContext(raw: Record<string, unknown>): FounderProfileContext {
  return {
    competencies: raw.competencies as Record<string, unknown> | undefined,
    resources: raw.resources as Record<string, unknown> | undefined,
    constraints: raw.constraints as Record<string, unknown> | undefined,
    riskAppetite: raw.risk_appetite as string | undefined,
    ambitionProfile: raw.ambition_profile as FounderProfileContext["ambitionProfile"],
  };
}

export function buildSegmentProfileContext(raw: {
  code: string;
  name: string;
  config: Record<string, unknown>;
}): SegmentProfileContext {
  return { code: raw.code, name: raw.name, config: raw.config };
}

// ============================================================
// Sélection depuis l'état live (JC-05) : quel(s) engine(s) exécuter, dans quelle phase,
// avec quel tier LLM — dérivé du DAG (Sequencer) + d'un plan de couverture par phase.
// Le mapping jalon→engine n'existe pas au schéma : c'est une CONVENTION par phase, alignée
// sur les engines construits (E1-E5, E7-E9). E6 (proof_witness) n'est pas construit → différé.
// ============================================================

export type LlmTier = "petit" | "intermediaire" | "frontier";

/** Une étape de run : un engine à invoquer pour une phase, + le gate à évaluer ensuite. */
export interface PhaseRunStep {
  phaseCode: string;
  /** Ordre d'exécution global (P0 → P6). */
  order: number;
  engineCode: string;
  /** Type canonique du deliverable écrit (deliverables.type). */
  deliverableType: string;
  /** Gate à évaluer à la clôture de la phase (dernière étape de la phase le porte). */
  gateCode?: string;
  /** true si l'engine n'est pas encore construit (E6) → jalons différés, DAG non bloqué. */
  deferred?: boolean;
}

/**
 * Plan de couverture P0→P6 (convention JC-05). Ordre = progression du parcours.
 * P0: E1 (profil) puis E2 (matching V3) · P1: E3 (idéation) · P2: E4 (marché) + E5 (concurrence)
 * P3: E6 DIFFÉRÉ · P5: E7 (juridique) + E8 (fiscal) · P6: E9 (naming).
 */
export const P0_P6_PLAN: PhaseRunStep[] = [
  { phaseCode: "P0", order: 0, engineCode: "founder_profiler", deliverableType: "founder_profile" },
  { phaseCode: "P0", order: 1, engineCode: "founder_project_matcher", deliverableType: "match_report", gateCode: "G0" },
  { phaseCode: "P1", order: 2, engineCode: "ideation_funnel", deliverableType: "selection_brief", gateCode: "G1" },
  { phaseCode: "P2", order: 3, engineCode: "market_cartographer", deliverableType: "market_study" },
  { phaseCode: "P2", order: 4, engineCode: "competitive_watch", deliverableType: "competitive_map", gateCode: "G2" },
  { phaseCode: "P3", order: 5, engineCode: "proof_witness", deliverableType: "proof_bundle", gateCode: "G3", deferred: true },
  { phaseCode: "P5", order: 6, engineCode: "legal_architect", deliverableType: "legal_structure" },
  { phaseCode: "P5", order: 7, engineCode: "tax_educator", deliverableType: "tax_education", gateCode: "G5" },
  { phaseCode: "P6", order: 8, engineCode: "name_forge", deliverableType: "naming_report", gateCode: "G6" },
];

/**
 * Choisit le tier LLM d'une tâche à partir du `model_routing` de l'engine (profondeur de
 * tâche). Convention : dominant sert de défaut ; on mappe des libellés de profondeur vers
 * les tiers engine-sdk. Fallback sûr = intermediaire.
 */
export function selectTier(modelRouting: Record<string, unknown> | null | undefined, taskKind = "dominant"): LlmTier {
  const raw = String((modelRouting ?? {})[taskKind] ?? (modelRouting ?? {})["dominant"] ?? "").toLowerCase();
  if (raw.includes("frontier")) return "frontier";
  if (raw.includes("petit") || raw.includes("collecte") || raw.includes("déterministe") || raw.includes("deterministe")) return "petit";
  return "intermediaire";
}

/**
 * Sélectionne la prochaine étape exécutable : la première étape du plan (ordre croissant)
 * dont la phase n'est pas encore clôturée. `phaseClosed(phaseCode)` = toutes les étapes de
 * la phase ont produit leur livrable (ou différées). Lecture seule — n'écrit pas.
 */
export function selectNextStep(plan: PhaseRunStep[], completedOrders: Set<number>): PhaseRunStep | null {
  const sorted = [...plan].sort((a, b) => a.order - b.order);
  for (const step of sorted) {
    if (!completedOrders.has(step.order)) return step;
  }
  return null;
}
