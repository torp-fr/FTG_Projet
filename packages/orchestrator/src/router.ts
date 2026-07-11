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
