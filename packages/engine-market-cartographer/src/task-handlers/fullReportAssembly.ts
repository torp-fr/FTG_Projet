/**
 * Handler task_type = full_report_assembly (tier FRONTIER, 😈).
 * Assemble l'étude + VERDICT D'ATTRACTIVITÉ FACTUEL à DOUBLE FACE (faits POUR et CONTRE),
 * jamais un jugement de faisabilité. Contradiction sur les données réelles → palier 2.
 */
import type { DevilsAdvocateChallenge, SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import { guaranteeSolutionPath, modelCallEntry, normalizeSolutionPaths, parseJsonObject } from "@ftg/engine-sdk";
import type { E4Handler } from "../deps.js";
import { FULL_REPORT_SYSTEM } from "../prompts/full-report.js";

interface VerdictJson {
  facts_for?: unknown;
  facts_against?: unknown;
  arbitrage_method?: string;
  synthese_md?: string;
}
interface FullReportJson {
  study_md?: string;
  attractiveness_verdict?: VerdictJson;
  challenge?: { facts?: unknown; risks?: unknown; conditions?: unknown };
  next_investigations?: unknown;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const fullReportAssembly: E4Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const userPrompt = [
    "Blocs d'étude déjà collectés (périmètre, densité réelle, sizing [E], tendance datée, segments/personas) :",
    JSON.stringify(
      { scope: si.scope, sizing: si.sizing, trend: si.trend, segments_personas: si.segments_personas },
      null,
      2,
    ),
    "",
    "Assemble l'étude et produis un verdict d'attractivité FACTUEL à double face (faits pour ET contre) + challenge 😈, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<FullReportJson>(await deps.callModel("frontier", FULL_REPORT_SYSTEM, userPrompt));

  const v = parsed.attractiveness_verdict ?? {};
  const attractiveness_verdict = {
    facts_for: arr(v.facts_for),
    facts_against: arr(v.facts_against),
    arbitrage_method: typeof v.arbitrage_method === "string" ? v.arbitrage_method : "",
    synthese_md: typeof v.synthese_md === "string" ? v.synthese_md : "",
  };
  const challenge: DevilsAdvocateChallenge = {
    facts: arr(parsed.challenge?.facts),
    risks: arr(parsed.challenge?.risks),
    conditions: arr(parsed.challenge?.conditions),
  };

  // Le verdict implique des choix d'investigation → au moins un chemin (D25).
  const investigations: SolutionPath[] = normalizeSolutionPaths(parsed.next_investigations);
  const solutionPaths = guaranteeSolutionPath(investigations, true);

  const sources: SourceCitation[] = [
    {
      claim: "Verdict d'attractivité (synthèse + contradiction).",
      source: "Raisonnement E4 (Le Cartographe 😈)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Synthèse et mise en contradiction des données de marché réelles collectées (densité N1 Sirene, tendance BODACC datée, sizing [E]) — lecture équilibrée, pas une donnée mesurée supplémentaire.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Étude de marché — verdict d'attractivité (E4 · Le Cartographe 😈)", contentMd: parsed.study_md ?? "", type: "full_report_assembly" },
      structuredData: { attractiveness_verdict },
      challenge,
      solutionPaths,
      sources,
      scores: { qualitySelf: 82, vectorContributions: {} },
      // Synthèse/contradiction sur les données N1 réelles — palier de raisonnement (2).
      telemetry: { researchDepthReached: 2, modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)] },
    },
    obstacleDetected: true,
  };
};
