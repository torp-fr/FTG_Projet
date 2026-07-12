/**
 * Handler task_type = securing_guide (tier intermédiaire).
 * Guide de sécurisation : réservation domaine (guidage) + procédure PI en information —
 * classes de Nice EXPLICITEMENT listées, étapes du dépôt, renvoi INPI. Prévoit pi_status
 * (point de RÉ-ENTRÉE après dépôt externe).
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E9Handler } from "../deps.js";
import { SECURING_GUIDE_SYSTEM } from "../prompts/securing-guide.js";

interface NiceJson {
  number?: number | string;
  label?: string;
}
interface GuideJson {
  domain_reservation?: { priority_tlds?: unknown; steps?: unknown };
  trademark_procedure?: { nice_classes?: NiceJson[]; steps?: unknown; filing_url?: string; referral?: string };
  summary_md?: string;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

const INPI_FILING_URL = "https://www.inpi.fr/proteger-vos-creations/proteger-votre-marque";

export const securingGuide: E9Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const chosen = str(si.name ?? si.chosen ?? si.chosen_name);
  const userPrompt = [
    "Nom retenu + contexte :",
    JSON.stringify({ name: chosen, segment: si.segment, activity: si.idee ?? si.activity }, null, 2),
    "",
    "Produis le guide de sécurisation (domaine + procédure PI avec classes de Nice explicites + renvoi INPI), selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<GuideJson>(await deps.callModel("intermediaire", SECURING_GUIDE_SYSTEM, userPrompt));

  const nice_classes = (parsed.trademark_procedure?.nice_classes ?? [])
    .map((n) => ({ number: typeof n.number === "number" ? n.number : Number(n.number), label: str(n.label) }))
    .filter((n) => Number.isFinite(n.number) && n.label);

  const securing_guide = {
    chosen_name: chosen,
    domain_reservation: {
      priority_tlds: arr(parsed.domain_reservation?.priority_tlds),
      steps: arr(parsed.domain_reservation?.steps),
    },
    trademark_procedure: {
      nice_classes,
      steps: arr(parsed.trademark_procedure?.steps),
      filing_url: str(parsed.trademark_procedure?.filing_url) || INPI_FILING_URL,
      referral: str(parsed.trademark_procedure?.referral) || "recherche d'antériorité par un conseil en propriété industrielle / avocat avant dépôt",
    },
  };

  // Point de RÉ-ENTRÉE après dépôt externe : rempli au retour du porteur.
  const priorPi = (si.pi_status ?? {}) as Record<string, unknown>;
  const pi_status = {
    status: str(priorPi.status) || "a_deposer", // a_deposer | deposee | enregistree
    depot_number: priorPi.depot_number ?? null,
    depot_date: priorPi.depot_date ?? null,
    registration_date: priorPi.registration_date ?? null,
  };

  const sources: SourceCitation[] = [
    {
      claim: "Guide de sécurisation (domaine) et procédure de dépôt de marque (classes de Nice, étapes, renvoi INPI).",
      source: "Raisonnement E9 (L'Éponyme) — d'après inpi.fr",
      date: deps.now(),
      url: INPI_FILING_URL,
      isEstimate: true,
      method: "Guidage informatif : l'engine ne réserve ni ne dépose à la place du porteur. Le dépôt se fait sur l'INPI ; une recherche d'antériorité professionnelle est requise. Pas une garantie juridique.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Guide de sécurisation & PI (E9 · L'Éponyme)", contentMd: str(parsed.summary_md), type: "securing_guide" },
      structuredData: { securing_guide, pi_status },
      sources,
      scores: { qualitySelf: 76, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
