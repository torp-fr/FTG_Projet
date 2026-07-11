/**
 * Handler task_type = gap_bridging (tier FRONTIER, 🔀 trois voies).
 * Pour chaque écart, 3 voies réellement divergentes (acquérir / déléguer / adapter le
 * projet) avec risques et conditions. Un écart n'est jamais un blocage.
 */
import type { SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  guaranteeSolutionPath,
  modelCallEntry,
  normalizeThreeWays,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { GAP_BRIDGING_SYSTEM } from "../prompts/gap-bridging.js";

interface VoieJson {
  label?: string;
  description?: string;
  risks?: unknown;
  conditions?: unknown;
}
interface BridgingPlanJson {
  dimension?: string;
  gap_reading?: string;
  voies?: VoieJson[];
}
interface BridgingJson {
  bridging_plans?: BridgingPlanJson[];
  summary_md?: string;
  quality_self?: number;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const gapBridging: TaskHandler = async (input, deps) => {
  const requirements = (input.structuredInput?.requirements ?? {}) as Record<string, unknown>;
  const gapMap = (input.structuredInput?.gap_map ?? []) as unknown[];
  const founderProfile = input.projectContext.founderProfile ?? {};

  const userPrompt = [
    "Exigences du projet (JSON) :",
    JSON.stringify(requirements, null, 2),
    "",
    "Écarts identifiés / gap_map (JSON) :",
    JSON.stringify(gapMap, null, 2),
    "",
    "Profil du porteur / founder_profile (JSON) :",
    JSON.stringify(founderProfile, null, 2),
    "",
    "Pour chaque écart, propose 3 voies divergentes, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("frontier", GAP_BRIDGING_SYSTEM, userPrompt);
  const parsed = parseJsonObject<BridgingJson>(raw);

  const bridging_plans = (parsed.bridging_plans ?? []).map((p) => ({
    dimension: typeof p.dimension === "string" ? p.dimension : "",
    gap_reading: typeof p.gap_reading === "string" ? p.gap_reading : "",
    voies: (p.voies ?? []).map((v) => ({
      label: typeof v.label === "string" ? v.label : "",
      description: typeof v.description === "string" ? v.description : "",
      risks: asStringArray(v.risks),
      conditions: asStringArray(v.conditions),
    })),
  }));

  const gapDetected = bridging_plans.length > 0;

  // solution_paths = toutes les voies aplaties (chaque voie est un chemin de comblement).
  const flattened: SolutionPath[] = bridging_plans
    .flatMap((p) =>
      p.voies.map((v) => ({
        title: `${p.dimension} — ${v.label}`.trim(),
        description: v.description,
        actions: v.conditions,
      })),
    )
    .filter((sp) => sp.description !== "" || sp.title !== "");
  const solutionPaths = guaranteeSolutionPath(flattened, gapDetected);

  // three_ways 🔀 : les 3 voies de l'écart principal (premier gap).
  const primary = bridging_plans[0];
  const threeWays = primary
    ? normalizeThreeWays(
        primary.voies.map((v) => ({
          label: v.label,
          description: v.description,
          risks: v.risks,
          conditions: v.conditions,
        })),
      )
    : undefined;

  const sources: SourceCitation[] = [
    {
      claim: "Voies de comblement des écarts de cohérence incarnation↔projet.",
      source: "Raisonnement E2 (La Boussole)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method:
        "Génération, par écart, de 3 voies divergentes (acquérir / déléguer / adapter le projet) avec risques et conditions.",
    },
  ];

  return {
    partial: {
      deliverable: {
        title: "Plan de comblement d'écarts (E2 · La Boussole)",
        contentMd: parsed.summary_md ?? "",
        type: "gap_bridging",
      },
      structuredData: {
        bridging_plans,
        decision_ownership:
          "Ces voies éclairent le porteur ; la décision d'en emprunter une (ou aucune) lui appartient.",
      },
      sources,
      solutionPaths,
      threeWays,
      scores: { qualitySelf: clampScore(parsed.quality_self), vectorContributions: { V3: 0 } },
      telemetry: {
        researchDepthReached: 0,
        modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)],
      },
    },
    obstacleDetected: gapDetected,
  };
};
