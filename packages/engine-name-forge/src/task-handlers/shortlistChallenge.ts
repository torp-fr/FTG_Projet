/**
 * Handler task_type = shortlist_challenge (tier frontier, 🔀😈).
 * Shortlist de 3 challengée (mémorabilité, prononçabilité, connotations multilingues selon
 * les lentilles géo actives, extensibilité), sur les résultats de disponibilité réels.
 */
import type { DevilsAdvocateChallenge, SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import { guaranteeSolutionPath, modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E9Handler } from "../deps.js";
import { SHORTLIST_CHALLENGE_SYSTEM } from "../prompts/shortlist-challenge.js";

interface ConnotationJson {
  lang?: string;
  note?: string;
}
interface ShortlistItemJson {
  name?: string;
  memorability?: string;
  pronounceability?: string;
  extensibility?: string;
  connotations?: ConnotationJson[];
  risks?: unknown;
}
interface ShortlistJson {
  shortlist?: ShortlistItemJson[];
  challenge?: { facts?: unknown; risks?: unknown; conditions?: unknown };
  summary_md?: string;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const shortlistChallenge: E9Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const geoLenses = input.projectContext?.geoLenses ?? [];
  const userPrompt = [
    "Candidats + résultats de disponibilité réels (JSON) :",
    JSON.stringify({ candidates: si.candidates, availability: si.availability, lentilles_geo_actives: geoLenses }, null, 2),
    "",
    "Établis une shortlist de 3 et challenge-la (connotations multilingues selon les lentilles actives), selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<ShortlistJson>(await deps.callModel("frontier", SHORTLIST_CHALLENGE_SYSTEM, userPrompt));

  const shortlist = (parsed.shortlist ?? []).map((s) => ({
    name: str(s.name),
    memorability: str(s.memorability),
    pronounceability: str(s.pronounceability),
    extensibility: str(s.extensibility),
    connotations: (s.connotations ?? []).map((c) => ({ lang: str(c.lang), note: str(c.note) })).filter((c) => c.lang || c.note),
    risks: arr(s.risks),
  }));
  const challenge: DevilsAdvocateChallenge = {
    facts: arr(parsed.challenge?.facts),
    risks: arr(parsed.challenge?.risks),
    conditions: arr(parsed.challenge?.conditions),
  };

  // Le choix d'un nom implique des arbitrages → au moins un chemin (D25).
  const paths: SolutionPath[] = shortlist
    .map((s) => ({ title: s.name, description: `Mémorabilité: ${s.memorability} · Prononçabilité: ${s.pronounceability} · Extensibilité: ${s.extensibility}`, actions: s.risks }))
    .filter((p) => p.title);
  const solutionPaths = guaranteeSolutionPath(paths, true);

  const sources: SourceCitation[] = [
    {
      claim: "Shortlist challengée (mémorabilité, prononçabilité, connotations multilingues, extensibilité).",
      source: "Raisonnement E9 (L'Éponyme 🔀😈)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Évaluation qualitative sur les résultats de disponibilité réels — lecture, pas une garantie juridique.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Shortlist challengée (E9 · L'Éponyme 🔀😈)", contentMd: str(parsed.summary_md), type: "shortlist_challenge" },
      structuredData: { shortlist_challenge: { shortlist, challenge } },
      challenge,
      solutionPaths,
      sources,
      scores: { qualitySelf: 80, vectorContributions: {} },
      telemetry: { researchDepthReached: 2, modelCalls: [modelCallEntry("frontier", input.constraints.llmChannel)] },
    },
    obstacleDetected: true,
  };
};
