/**
 * @ftg/engine-sdk — Contrat d'engine (Chantier 4 §3)
 *
 * Tout engine FTG implémente exactement cette interface. C'est la condition
 * de l'indépendance + orchestrabilité (principe #1, Chantier 4 §0) : aucun
 * appel engine→engine, tout transite par l'orchestrateur.
 */

// ============================================================
// Enveloppe d'entrée (§3.1) — constituée PAR l'orchestrateur (Router), jamais par l'UI
// ============================================================

export type LlmChannel = "oauth_user" | "byok_org" | "pooled";
export type PedagogyLevel = "beginner" | "intermediate" | "advanced";

export interface CanonicalState {
  /** État canonique synthétique agrégé depuis project_journal (Diffuser). */
  [key: string]: unknown;
}

export interface DependencyDigest {
  milestoneCode: string;
  digest: string;
  producedAt: string;
}

export interface FounderProfileContext {
  competencies?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  riskAppetite?: string;
  ambitionProfile?: "complement" | "independance" | "croissance" | "scale";
}

export interface SegmentProfileContext {
  code: string;
  name: string;
  config: Record<string, unknown>;
}

export interface DecisionRecord {
  milestoneCode: string;
  options: unknown[];
  chosenIndex: number;
  founderMotivation?: string;
}

export interface ProjectContext {
  canonicalState: CanonicalState;
  dependencyDigests: DependencyDigest[];
  founderProfile: FounderProfileContext;
  segmentProfile: SegmentProfileContext;
  geoLenses: string[];
  decisionsHistory: DecisionRecord[];
}

export interface EngineConstraints {
  quotas: Record<string, unknown>;
  llmChannel: LlmChannel;
  researchDepthMin: number;
  outputLanguage: string;
  pedagogyLevels: PedagogyLevel[];
}

export interface EngineInputEnvelope {
  runId: string;
  taskType: string;
  projectContext: ProjectContext;
  structuredInput: Record<string, unknown>;
  constraints: EngineConstraints;
}

// ============================================================
// Enveloppe de sortie (§3.2) — obligatoire et complète
// ============================================================

export interface SourceCitation {
  claim: string;
  source: string;
  date: string | null;
  url: string | null;
  isEstimate: boolean;
  method: string | null;
}

export interface ThreeWayOption {
  label: string;
  description: string;
  risks: string[];
  conditions: string[];
}

export interface DevilsAdvocateChallenge {
  facts: string[];
  risks: string[];
  conditions: string[];
}

export interface SolutionPath {
  title: string;
  description: string;
  actions: string[];
}

export interface PedagogyBlock {
  [key: string]: { beginner: string; intermediate: string; advanced: string };
}

export interface EngineTelemetry {
  researchDepthReached: number;
  modelCalls: Array<{ provider: string; model: string; tier: string; tokens: number; channel: LlmChannel }>;
}

export interface EngineOutputEnvelope {
  deliverable: { title: string; contentMd: string; type: string };
  structuredData: Record<string, unknown>;
  sources: SourceCitation[];
  threeWays?: ThreeWayOption[];
  challenge?: DevilsAdvocateChallenge;
  scores: { qualitySelf: number; vectorContributions: Record<string, number> };
  reservesSuggested: string[];
  solutionPaths: SolutionPath[];
  pedagogy: PedagogyBlock;
  followupsSuggested: string[];
  telemetry: EngineTelemetry;
}

// ============================================================
// Registre — jalon (Chantier 1) et milestone flags
// ============================================================

export interface MilestoneFlags {
  three_ways: boolean;
  devils_advocate: boolean;
  external_proof: boolean;
  pedagogy_quiz: boolean;
}
