/**
 * Handler task_type = incarnation_report (tier FRONTIER — livrable principal, fondation
 * du parcours). Assemble l'enveloppe complète : profil d'incarnation (déclaratif +
 * réflexif), rapport Markdown, sources, et — si écart ambition/moyens — un chemin
 * garanti (D25).
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  guaranteeSolutionPath,
  modelCallEntry,
  normalizeSolutionPaths,
  normalizeThreeWays,
  parseJsonObject,
  serializeDeclaredInput,
  type TaskHandler,
} from "../llm-client.js";
import { INCARNATION_REPORT_SYSTEM } from "../prompts/incarnation-report.js";

interface IncarnationJson {
  intrinsic_nature?: Record<string, unknown>;
  mantra?: string;
  internal_objectives?: Record<string, unknown>;
  builder_vs_opportunist_reading?: string;
  deliverable_md?: string;
  ambition_moyens_gap?: { detected?: boolean; reading?: string };
  solution_paths?: unknown;
  three_ways?: unknown;
  challenge?: { facts?: string[]; risks?: string[]; conditions?: string[] };
  pedagogy?: Record<string, { beginner: string; intermediate: string; advanced: string }>;
  quality_self?: number;
  reserves_suggested?: string[];
  followups_suggested?: string[];
}

/** Champs du profil fondateur qui proviennent des déclarations du porteur (intake). */
function extractDeclaredProfile(si: Record<string, unknown>) {
  return {
    competencies: si.competencies ?? {},
    resources: si.resources ?? {},
    constraints: si.constraints ?? {},
    risk_appetite: typeof si.risk_appetite === "string" ? si.risk_appetite : null,
    engagement: si.engagement ?? {},
  };
}

/** Sources déclaratives : les affirmations de E1 reflètent les réponses du porteur. */
function buildDeclarativeSources(nowIso: string, gapDetected: boolean): SourceCitation[] {
  const sources: SourceCitation[] = [
    {
      claim: "Profil d'incarnation établi à partir des réponses déclarées par le porteur.",
      source: "Auto-déclaration du porteur (intake E1)",
      date: nowIso,
      url: null,
      isEstimate: false,
      method: null,
    },
  ];
  if (gapDetected) {
    sources.push({
      claim: "Lecture de l'écart entre l'objectif annoncé et les moyens déclarés.",
      source: "Lecture interne E1 (estimation)",
      date: nowIso,
      url: null,
      isEstimate: true,
      method:
        "Comparaison des objectifs déclarés (échéance, revenu visé) avec les moyens déclarés (heures/semaine, capital, horizon).",
    });
  }
  return sources;
}

export const incarnationReport: TaskHandler = async (input, deps) => {
  const userPrompt = `${serializeDeclaredInput(input)}\n\nProduis le rapport d'incarnation selon le schéma JSON.`;
  const raw = await deps.callModel("frontier", INCARNATION_REPORT_SYSTEM, userPrompt);
  const parsed = parseJsonObject<IncarnationJson>(raw);

  const declared = extractDeclaredProfile(input.structuredInput ?? {});
  const gapDetected = Boolean(parsed.ambition_moyens_gap?.detected);
  const solutionPaths = guaranteeSolutionPath(
    normalizeSolutionPaths(parsed.solution_paths),
    gapDetected,
  );

  return {
    partial: {
      deliverable: {
        title: "Rapport d'incarnation (E1 · Le Miroir)",
        contentMd: parsed.deliverable_md ?? "",
        type: "incarnation_report",
      },
      // structuredData = objet founder_profile complet (déclaratif + réflexif),
      // consommé tel quel par writeFounderProfile.
      structuredData: {
        competencies: declared.competencies,
        resources: declared.resources,
        constraints: declared.constraints,
        risk_appetite: declared.risk_appetite,
        engagement: declared.engagement,
        intrinsic_nature: parsed.intrinsic_nature ?? {},
        mantra: parsed.mantra ?? null,
        internal_objectives: parsed.internal_objectives ?? {},
        builder_vs_opportunist_reading: parsed.builder_vs_opportunist_reading ?? null,
        ambition_moyens_gap: {
          detected: gapDetected,
          reading: parsed.ambition_moyens_gap?.reading ?? "",
        },
      },
      sources: buildDeclarativeSources(deps.now(), gapDetected),
      solutionPaths,
      threeWays: normalizeThreeWays(parsed.three_ways),
      challenge: parsed.challenge
        ? {
            facts: parsed.challenge.facts ?? [],
            risks: parsed.challenge.risks ?? [],
            conditions: parsed.challenge.conditions ?? [],
          }
        : undefined,
      pedagogy: parsed.pedagogy ?? {},
      scores: {
        qualitySelf: clampScore(parsed.quality_self),
        vectorContributions: { V1: clampScore(parsed.quality_self) },
      },
      reservesSuggested: Array.isArray(parsed.reserves_suggested)
        ? parsed.reserves_suggested
        : [],
      followupsSuggested: Array.isArray(parsed.followups_suggested)
        ? parsed.followups_suggested
        : [],
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: gapDetected,
  };
};
