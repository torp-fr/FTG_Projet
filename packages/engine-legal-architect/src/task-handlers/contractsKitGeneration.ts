/**
 * Handler task_type = contracts_kit_generation (tier intermédiaire, léger v1).
 * Squelettes de documents (CGV/CGU/mentions légales/politique de confidentialité)
 * EXPLIQUÉS + disclaimer par document. v1 = squelette structuré, pas un générateur docx.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E7Handler } from "../deps.js";
import { CONTRACTS_KIT_SYSTEM } from "../prompts/contracts-kit.js";

interface TemplateJson {
  type?: string;
  title?: string;
  role?: string;
  skeleton_md?: string;
  disclaimer?: string;
}
interface KitJson {
  templates?: TemplateJson[];
  summary_md?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const DEFAULT_DISCLAIMER = "Modèle générique NON contractuel — squelette à compléter et à faire valider par un professionnel avant tout usage.";

export const contractsKitGeneration: E7Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const now = deps.now();

  const userPrompt = [
    "Contexte projet :",
    JSON.stringify({ segment: si.segment, activity: si.activity ?? si.idee, vente_en_ligne: si.vente_en_ligne ?? false }, null, 2),
    "",
    "Produis le kit de documents contractuels en version squelette v1, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<KitJson>(await deps.callModel("intermediaire", CONTRACTS_KIT_SYSTEM, userPrompt));

  const templates = (parsed.templates ?? []).map((t) => ({
    type: str(t.type) || "autre",
    title: str(t.title),
    role: str(t.role),
    skeleton_md: str(t.skeleton_md),
    disclaimer: str(t.disclaimer) || DEFAULT_DISCLAIMER,
  }));

  const contracts_kit = { version: "v1_squelette", templates, note: "Squelettes génériques à compléter et à faire relire par un professionnel." };

  const sources: SourceCitation[] = [
    {
      claim: "Kit de documents contractuels (squelettes v1).",
      source: "Raisonnement E7 (L'Architecte)",
      date: now,
      url: null,
      isEstimate: true,
      method: "Modèles GÉNÉRIQUES structurés (placeholders), non contractuels, à faire valider par un professionnel — aucune clause sur mesure, aucun conseil personnalisé.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Kit contractuel — squelettes v1 (E7 · L'Architecte)", contentMd: str(parsed.summary_md), type: "contracts_kit_generation" },
      structuredData: { contracts_kit },
      sources,
      scores: { qualitySelf: 70, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
