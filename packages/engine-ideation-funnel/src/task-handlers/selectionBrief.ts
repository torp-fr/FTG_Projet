/**
 * Handler task_type = selection_brief (tier FRONTIER, 🔀 règle des 3).
 * Lettre de décision : sélection argumentée + comparatif top-3 tracé dans le
 * funnel_journal ; remplit `threeWays` quand plusieurs directions sont défendables.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  modelCallEntry,
  normalizeThreeWays,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { SELECTION_BRIEF_SYSTEM } from "../prompts/selection-brief.js";
import { RESEARCH_DEPTH_V1, groundingV1Source } from "../grounding.js";

interface Top3Json {
  idea?: string;
  score?: number;
  rationale?: string;
}
interface VariantJson {
  label?: string;
  description?: string;
  risks?: unknown;
  conditions?: unknown;
}
interface SelectionJson {
  selection?: { chosen?: string; rationale?: string; top3?: Top3Json[] };
  funnel_journal_additions?: Array<{ idea?: string; decision?: string; motivation?: string }>;
  three_ways?: VariantJson[];
  decision_letter_md?: string;
  quality_self?: number;
}

function asStrArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const selectionBrief: TaskHandler = async (input, deps) => {
  const userPrompt = [
    "Idées scorées + journal d'entonnoir (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Rédige la lettre de décision : sélection argumentée, top-3 comparé et tracé, et 3 voies si plusieurs directions sont défendables. Selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("frontier", SELECTION_BRIEF_SYSTEM, userPrompt);
  const parsed = parseJsonObject<SelectionJson>(raw);

  const top3 = (parsed.selection?.top3 ?? []).slice(0, 3).map((t) => ({
    idea: t.idea ?? "",
    score: clampScore(t.score),
    rationale: t.rationale ?? "",
  }));
  const selection = {
    chosen: parsed.selection?.chosen ?? "",
    rationale: parsed.selection?.rationale ?? "",
    top3,
  };

  // Traçabilité : motivations de conservation au stade sélection.
  const funnel_journal = (parsed.funnel_journal_additions ?? []).map((j) => ({
    stage: "selection",
    idea: j.idea ?? "",
    decision: j.decision ?? "kept",
    motivation: j.motivation ?? "",
  }));

  const variants = (parsed.three_ways ?? []).map((v) => ({
    label: typeof v.label === "string" ? v.label : "",
    description: typeof v.description === "string" ? v.description : "",
    risks: asStrArray(v.risks),
    conditions: asStrArray(v.conditions),
  }));
  const threeWays = normalizeThreeWays(variants);

  const sources: SourceCitation[] = [
    groundingV1Source(deps.now(), "Comparaison des idées du top-3."),
  ];

  return {
    partial: {
      deliverable: {
        title: "Lettre de décision — sélection (E3 · La Forge 🔀)",
        contentMd: parsed.decision_letter_md ?? "",
        type: "selection_brief",
      },
      structuredData: { selection, funnel_journal, three_ways: variants },
      threeWays,
      sources,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: {} },
      telemetry: {
        researchDepthReached: RESEARCH_DEPTH_V1,
        modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: false,
  };
};
