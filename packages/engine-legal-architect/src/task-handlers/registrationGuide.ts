/**
 * Handler task_type = registration_guide (tier intermédiaire).
 * Pas-à-pas Guichet unique (INPI) + pièces à préparer. GUIDAGE, jamais d'action à la
 * place du porteur.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E7Handler } from "../deps.js";
import { REGISTRATION_GUIDE_SYSTEM } from "../prompts/registration-guide.js";

interface StepJson {
  order?: number;
  title?: string;
  detail?: string;
}
interface GuideJson {
  portal?: string;
  steps?: StepJson[];
  documents?: unknown;
  date_verification?: string;
  summary_md?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const registrationGuide: E7Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const now = deps.now();
  const dateVerif = now.slice(0, 10);

  const userPrompt = [
    "Contexte projet :",
    JSON.stringify({ segment: si.segment, activity: si.activity ?? si.idee, statut_envisage: si.statut_envisage ?? si.status }, null, 2),
    `Date de vérification de la procédure : ${dateVerif}.`,
    "",
    "Produis le guide d'immatriculation (Guichet unique), selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<GuideJson>(await deps.callModel("intermediaire", REGISTRATION_GUIDE_SYSTEM, userPrompt));

  const registration_guide = {
    portal: str(parsed.portal) || "Guichet unique — formalites.entreprises.gouv.fr (INPI)",
    steps: (parsed.steps ?? []).map((s, i) => ({ order: typeof s.order === "number" ? s.order : i + 1, title: str(s.title), detail: str(s.detail) })),
    documents: arr(parsed.documents),
    date_verification: str(parsed.date_verification) || dateVerif,
  };

  const sources: SourceCitation[] = [
    {
      claim: "Parcours d'immatriculation (Guichet unique INPI).",
      source: "Raisonnement E7 (L'Architecte) — d'après formalites.entreprises.gouv.fr",
      date: now,
      url: "https://formalites.entreprises.gouv.fr",
      isEstimate: true,
      method: `Guidage des étapes d'immatriculation, procédure en vigueur à la date ${dateVerif} à confirmer sur le portail officiel — guidage, pas une action réalisée à la place du porteur.`,
    },
  ];

  return {
    partial: {
      deliverable: { title: "Guide d'immatriculation (E7 · L'Architecte)", contentMd: str(parsed.summary_md), type: "registration_guide" },
      structuredData: { registration_guide },
      sources,
      scores: { qualitySelf: 74, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
