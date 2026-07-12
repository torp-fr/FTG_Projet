/**
 * Handler task_type = idea_generation (tier intermédiaire, Porte B).
 * Génère un portefeuille d'idées ancrées profil × contexte (founder_profile lu en base,
 * fourni via projectContext.founderProfile) + segment.
 *
 * Garde-fou d'accès : toute idée touchant une qualification absente reçoit un chemin
 * d'accès non vide (fallback si le modèle l'omet) — jamais de qualification requise sans
 * chemin pour l'obtenir.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import {
  clampScore,
  modelCallEntry,
  parseJsonObject,
  type TaskHandler,
} from "@ftg/engine-sdk";
import { IDEA_GENERATION_SYSTEM } from "../prompts/idea-generation.js";
import { RESEARCH_DEPTH_V1, groundingV1Source } from "../grounding.js";

interface IdeaCardJson {
  title?: string;
  rationale_anchor?: string;
  problem?: string;
  solution?: string;
  target?: string;
  business_model?: string;
  qualification_required?: string;
  access_path?: string;
}
interface GenerationJson {
  idea_cards?: IdeaCardJson[];
  summary_md?: string;
  quality_self?: number;
}

const DEFAULT_ACCESS_PATH =
  "Chemin d'accès à préciser : identifier le diplôme/agrément requis et une voie pour l'obtenir (formation, VAE, partenariat ou association avec un profil qualifié).";

export const ideaGeneration: TaskHandler = async (input, deps) => {
  const founderProfile = input.projectContext.founderProfile ?? {};
  const segment = input.projectContext.segmentProfile ?? {};

  const userPrompt = [
    "Profil du porteur / founder_profile (JSON) :",
    JSON.stringify(founderProfile, null, 2),
    "",
    "Segment (JSON) :",
    JSON.stringify(segment, null, 2),
    "",
    "Contexte / opportunités (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
    "",
    "Génère un portefeuille d'idées ANCRÉES profil × contexte, selon le schéma JSON.",
  ].join("\n");
  const raw = await deps.callModel("intermediaire", IDEA_GENERATION_SYSTEM, userPrompt);
  const parsed = parseJsonObject<GenerationJson>(raw);

  const idea_cards = (parsed.idea_cards ?? []).map((c) => {
    const qualification_required =
      typeof c.qualification_required === "string" ? c.qualification_required.trim() : "";
    let access_path = typeof c.access_path === "string" ? c.access_path.trim() : "";
    // Garde-fou : qualification touchée ⇒ chemin d'accès obligatoire (jamais laissé vide).
    if (qualification_required !== "" && access_path === "") access_path = DEFAULT_ACCESS_PATH;
    return {
      title: typeof c.title === "string" ? c.title : "",
      rationale_anchor: typeof c.rationale_anchor === "string" ? c.rationale_anchor : "",
      problem: typeof c.problem === "string" ? c.problem : "",
      solution: typeof c.solution === "string" ? c.solution : "",
      target: typeof c.target === "string" ? c.target : "",
      business_model: typeof c.business_model === "string" ? c.business_model : "",
      qualification_required,
      access_path,
    };
  });

  const sources: SourceCitation[] = [
    groundingV1Source(deps.now(), "Pertinence marché présumée des idées générées."),
  ];

  return {
    partial: {
      deliverable: {
        title: "Portefeuille d'idées (E3 · La Forge · Porte B)",
        contentMd: parsed.summary_md ?? "",
        type: "idea_portfolio",
      },
      structuredData: { idea_cards },
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
