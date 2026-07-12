/**
 * Handler task_type = segmentation_personas (tier intermédiaire).
 * Segments + personas actionnables, raisonnés sur les données réelles déjà collectées.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E4Handler } from "../deps.js";
import { SEGMENTATION_PERSONAS_SYSTEM } from "../prompts/segmentation-personas.js";

interface SegmentJson {
  name?: string;
  description?: string;
  size_hint?: string | null;
}
interface PersonaJson {
  name?: string;
  profile?: string;
  needs?: unknown;
  pains?: unknown;
  channels?: unknown;
}
interface SegPersonaJson {
  segments?: SegmentJson[];
  personas?: PersonaJson[];
  summary_md?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const segmentationPersonas: E4Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const userPrompt = [
    "Données de marché réelles déjà collectées (périmètre, densité, tendance) :",
    JSON.stringify({ scope: si.scope, density: si.density ?? si.sizing, trend: si.trend }, null, 2),
    "",
    "Propose des segments et des personas actionnables, raisonnés sur ces données, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<SegPersonaJson>(await deps.callModel("intermediaire", SEGMENTATION_PERSONAS_SYSTEM, userPrompt));

  const segments = (parsed.segments ?? []).map((s) => ({
    name: str(s.name),
    description: str(s.description),
    size_hint: s.size_hint == null ? null : str(s.size_hint),
  }));
  const personas = (parsed.personas ?? []).map((p) => ({
    name: str(p.name),
    profile: str(p.profile),
    needs: arr(p.needs),
    pains: arr(p.pains),
    channels: arr(p.channels),
  }));

  const sources: SourceCitation[] = [
    {
      claim: "Segmentation et personas.",
      source: "Raisonnement E4 (Le Cartographe)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Segments/personas raisonnés sur les données de marché réelles collectées (densité N1, tendance BODACC) — hypothèses de travail, pas des données mesurées ; tout ordre de grandeur est marqué [E].",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Segments & personas (E4 · Le Cartographe)", contentMd: parsed.summary_md ?? "", type: "segmentation_personas" },
      structuredData: { segments_personas: { segments, personas } },
      sources,
      scores: { qualitySelf: 74, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
