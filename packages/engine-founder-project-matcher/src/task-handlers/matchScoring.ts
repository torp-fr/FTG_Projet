/**
 * Handler task_type = match_scoring (tier intermédiaire).
 * Score V3 par dimension (0-100) en croisant les exigences du projet avec le
 * founder_profile (fourni via projectContext.founderProfile — lu depuis la table
 * founder_profiles par l'appelant/Router, cf. db-writes.readFounderProfile).
 *
 * V3 N'EST JAMAIS UN VETO : si un écart est détecté (score < seuil), l'enveloppe porte
 * toujours au moins un solution_path (D25) et rappelle que la décision appartient au
 * porteur.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  guaranteeSolutionPath,
  modelCallEntry,
  normalizeSolutionPaths,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { MATCH_SCORING_SYSTEM } from "../prompts/match-scoring.js";

const DIMENSIONS = ["competences", "exposition", "capital", "rythme"] as const;
type Dimension = (typeof DIMENSIONS)[number];

/** Une dimension sous ce seuil est considérée en écart (gap) à combler. */
const GAP_THRESHOLD = 60;

interface ScoringJson {
  scores_by_dimension?: Record<string, unknown>;
  readings_by_dimension?: Record<string, unknown>;
  bridging_hints?: Array<{ dimension?: string; hint?: string }>;
  summary_md?: string;
  quality_self?: number;
}

export const matchScoring: TaskHandler = async (input, deps) => {
  const founderProfile = input.projectContext.founderProfile ?? {};
  const requirements = (input.structuredInput?.requirements ?? {}) as Record<string, unknown>;

  const userPrompt = [
    "Exigences du projet (JSON) :",
    JSON.stringify(requirements, null, 2),
    "",
    "Profil du porteur / founder_profile (JSON) :",
    JSON.stringify(founderProfile, null, 2),
    "",
    "Score la cohérence V3 par dimension, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("intermediaire", MATCH_SCORING_SYSTEM, userPrompt);
  const parsed = parseJsonObject<ScoringJson>(raw);

  const scores = parsed.scores_by_dimension ?? {};
  const v3_scores_by_dimension: Record<Dimension, number> = {
    competences: clampScore(scores.competences),
    exposition: clampScore(scores.exposition),
    capital: clampScore(scores.capital),
    rythme: clampScore(scores.rythme),
  };
  // composite V3 = moyenne des dimensions, arrondie (déterministe, jamais laissé au LLM).
  const composite_v3 = Math.round(
    DIMENSIONS.reduce((acc, d) => acc + v3_scores_by_dimension[d], 0) / DIMENSIONS.length,
  );

  // gap_map dérivé DÉTERMINISTIQUEMENT des scores (< seuil) — pas du jugement LLM.
  const readings = (parsed.readings_by_dimension ?? {}) as Record<string, unknown>;
  const gap_map = DIMENSIONS.filter((d) => v3_scores_by_dimension[d] < GAP_THRESHOLD).map((d) => ({
    dimension: d,
    score: v3_scores_by_dimension[d],
    reading: typeof readings[d] === "string" ? (readings[d] as string) : "",
  }));
  const gapDetected = gap_map.length > 0;

  // D25 : un écart implique toujours au moins un chemin (jamais un veto nu).
  const hintPaths = normalizeSolutionPaths(
    (parsed.bridging_hints ?? [])
      .filter((h) => h && typeof h.hint === "string")
      .map((h) => ({
        title: `Combler l'écart — ${h.dimension ?? ""}`.trim(),
        description: h.hint ?? "",
        actions: [],
      })),
  );
  const solutionPaths = guaranteeSolutionPath(hintPaths, gapDetected);

  // A5.4 : les scores V3 sont un jugement de cohérence → source is_estimate + méthode.
  const sources: SourceCitation[] = [
    {
      claim: "Scores V3 de cohérence incarnation↔projet, par dimension.",
      source: "Raisonnement E2 (La Boussole)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method:
        "Croisement des exigences du projet (extraites) avec le founder_profile déclaré ; notation 0-100 par dimension, composite = moyenne des dimensions.",
    },
  ];

  return {
    partial: {
      deliverable: {
        title: "Rapport de matching V3 (E2 · La Boussole)",
        contentMd: parsed.summary_md ?? "",
        type: "match_report",
      },
      structuredData: {
        v3_scores_by_dimension,
        composite_v3,
        gap_map,
        requirements,
        decision_ownership:
          "V3 informe la cohérence incarnation↔projet ; la décision d'engagement appartient au porteur.",
      },
      sources,
      solutionPaths,
      scores: {
        qualitySelf: clampScore(parsed.quality_self),
        vectorContributions: { V3: composite_v3 },
      },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: gapDetected,
  };
};
