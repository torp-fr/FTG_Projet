/**
 * Handler task_type = hard_filter (tier petit).
 * Élimination par critères durs. TRAÇABILITÉ : chaque élimination ET chaque
 * conservation est motivée dans funnel_journal.
 */
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { HARD_FILTER_SYSTEM } from "../prompts/hard-filter.js";
import { RESEARCH_DEPTH_V1 } from "../grounding.js";

interface HardFilterJson {
  kept?: Array<{ idea?: string; motivation?: string }>;
  eliminated?: Array<{ idea?: string; criterion?: string; motivation?: string }>;
  summary_md?: string;
  quality_self?: number;
}

export const hardFilter: TaskHandler = async (input, deps) => {
  const userPrompt = [
    "Portefeuille d'idées + critères durs (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Applique les critères durs ; motive CHAQUE élimination ET conservation, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("petit", HARD_FILTER_SYSTEM, userPrompt);
  const parsed = parseJsonObject<HardFilterJson>(raw);

  const kept = (parsed.kept ?? []).map((k) => ({
    idea: k.idea ?? "",
    motivation: k.motivation ?? "",
  }));
  const eliminated = (parsed.eliminated ?? []).map((e) => ({
    idea: e.idea ?? "",
    criterion: e.criterion ?? "",
    motivation: e.motivation ?? "",
  }));

  // funnel_journal : trace de CHAQUE décision (éliminée comme conservée).
  const funnel_journal = [
    ...eliminated.map((e) => ({
      stage: "hard_filter",
      idea: e.idea,
      decision: "eliminated",
      criterion: e.criterion,
      motivation: e.motivation,
    })),
    ...kept.map((k) => ({
      stage: "hard_filter",
      idea: k.idea,
      decision: "kept",
      motivation: k.motivation,
    })),
  ];

  return {
    partial: {
      deliverable: {
        title: "Filtrage par critères durs (E3 · La Forge)",
        contentMd: parsed.summary_md ?? "",
        type: "hard_filter",
      },
      structuredData: { funnel_journal, kept, eliminated },
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: {} },
      telemetry: {
        researchDepthReached: RESEARCH_DEPTH_V1,
        modelCalls: [modelCallEntry("petit", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
