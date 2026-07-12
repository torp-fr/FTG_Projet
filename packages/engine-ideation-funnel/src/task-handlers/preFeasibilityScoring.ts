/**
 * Handler task_type = pre_feasibility_scoring (tier intermédiaire).
 * Score de pré-faisabilité par critères (le modèle donne les scores BRUTS 0-100) ; la
 * PONDÉRATION dépend du profil d'ambition et est appliquée DÉTERMINISTIQUEMENT ici.
 */
import type { EngineInputEnvelope, SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { PRE_FEASIBILITY_SCORING_SYSTEM } from "../prompts/pre-feasibility-scoring.js";
import { RESEARCH_DEPTH_V1, groundingV1Source } from "../grounding.js";

const CRITERIA = ["demande", "concurrence", "marge", "complexite", "alignement"] as const;
type Criterion = (typeof CRITERIA)[number];
type AmbitionProfile = "complement" | "independance" | "croissance" | "scale";

/**
 * Pondérations V1 (heuristiques produit, à affiner au fil des eval_runs) — somme = 1
 * par profil. « complement » privilégie l'alignement/la simplicité ; « scale »
 * privilégie la demande/la marge de manœuvre concurrentielle.
 */
const WEIGHTS_BY_AMBITION: Record<AmbitionProfile, Record<Criterion, number>> = {
  complement: { alignement: 0.3, complexite: 0.25, marge: 0.2, demande: 0.15, concurrence: 0.1 },
  independance: { alignement: 0.25, demande: 0.25, marge: 0.2, complexite: 0.15, concurrence: 0.15 },
  croissance: { demande: 0.3, concurrence: 0.25, marge: 0.2, alignement: 0.15, complexite: 0.1 },
  scale: { demande: 0.3, concurrence: 0.3, marge: 0.2, complexite: 0.1, alignement: 0.1 },
};

function resolveAmbition(input: EngineInputEnvelope): AmbitionProfile {
  const fromProfile = input.projectContext.founderProfile?.ambitionProfile;
  const fromInput = (input.structuredInput as { ambition_profile?: unknown } | undefined)?.ambition_profile;
  const val = typeof fromProfile === "string" ? fromProfile : typeof fromInput === "string" ? fromInput : "";
  return (["complement", "independance", "croissance", "scale"] as string[]).includes(val)
    ? (val as AmbitionProfile)
    : "independance";
}

interface ScoreRowJson {
  idea?: string;
  criteria?: Record<string, unknown>;
  rationale?: string;
}
interface ScoringJson {
  scores?: ScoreRowJson[];
  summary_md?: string;
  quality_self?: number;
}

export const preFeasibilityScoring: TaskHandler = async (input, deps) => {
  const ambition = resolveAmbition(input);
  const weights = WEIGHTS_BY_AMBITION[ambition];

  const userPrompt = [
    `Profil d'ambition : ${ambition}`,
    "",
    "Idées conservées à scorer (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Donne les scores BRUTS par critère (0-100, plus haut = plus favorable), selon le schéma JSON. Ne calcule pas le total pondéré.",
  ].join("\n");
  const raw = await deps.callModel("intermediaire", PRE_FEASIBILITY_SCORING_SYSTEM, userPrompt);
  const parsed = parseJsonObject<ScoringJson>(raw);

  const scoring_matrix = (parsed.scores ?? [])
    .map((row) => {
      const c = row.criteria ?? {};
      const criteria: Record<Criterion, number> = {
        demande: clampScore(c.demande),
        concurrence: clampScore(c.concurrence),
        marge: clampScore(c.marge),
        complexite: clampScore(c.complexite),
        alignement: clampScore(c.alignement),
      };
      // Total pondéré déterministe (jamais laissé au modèle).
      const weighted_total = Math.round(
        CRITERIA.reduce((acc, k) => acc + criteria[k] * weights[k], 0),
      );
      return { idea: row.idea ?? "", criteria, weighted_total, rationale: row.rationale ?? "" };
    })
    .sort((a, b) => b.weighted_total - a.weighted_total);

  const sources: SourceCitation[] = [
    groundingV1Source(deps.now(), "Scores de demande et de concurrence par idée."),
  ];

  return {
    partial: {
      deliverable: {
        title: "Scoring de pré-faisabilité (E3 · La Forge)",
        contentMd: parsed.summary_md ?? "",
        type: "pre_feasibility_scoring",
      },
      structuredData: { scoring_matrix, ambition_profile: ambition, weights },
      sources,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: {} },
      telemetry: {
        researchDepthReached: RESEARCH_DEPTH_V1,
        modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
