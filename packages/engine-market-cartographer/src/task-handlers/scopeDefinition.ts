/**
 * Handler task_type = scope_definition (tier petit).
 * Définit le périmètre : codes NAF du métier cœur + zone + lentille géo (leçon E5 : NAF).
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E4Handler } from "../deps.js";
import { SCOPE_DEFINITION_SYSTEM } from "../prompts/scope-definition.js";

interface NafCode {
  code?: string;
  label?: string;
}
interface ScopeJson {
  keywords?: string;
  naf_codes?: Array<NafCode | string>;
  departement?: string;
  code_commune?: string;
  geo_scope?: string;
  scope_md?: string;
  rationale?: string;
}

export const scopeDefinition: E4Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const geoLenses = input.projectContext?.geoLenses ?? [];
  const userPrompt = [
    "Contexte projet (JSON) :",
    JSON.stringify(
      { segment: si.segment, idee_retenue: si.idee ?? si.idea ?? si.selection, zone: si.zone, geo_lenses: geoLenses },
      null,
      2,
    ),
    "",
    "Définis le périmètre de l'étude de marché, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<ScopeJson>(await deps.callModel("petit", SCOPE_DEFINITION_SYSTEM, userPrompt));

  const nafList: NafCode[] = Array.isArray(parsed.naf_codes)
    ? parsed.naf_codes.map((n) => (typeof n === "string" ? { code: n } : n)).filter((n) => (n.code ?? "").trim())
    : [];
  const keywords = (parsed.keywords || (typeof si.keywords === "string" ? si.keywords : "") || "").trim();
  const departement = (parsed.departement || "").trim() || null;
  const codeCommune = (parsed.code_commune || "").trim() || null;
  const geoScope = (parsed.geo_scope || (departement || codeCommune ? "departemental" : "national")).trim();

  const scope = {
    keywords,
    naf_codes: nafList,
    departement,
    code_commune: codeCommune,
    geo_scope: geoScope,
    geo_lenses: geoLenses,
    rationale: parsed.rationale ?? "",
  };

  const sources: SourceCitation[] = [
    {
      claim: "Définition du périmètre d'étude (codes NAF du métier cœur + zone).",
      source: "Raisonnement E4 (Le Cartographe)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Dérivation des codes NAF/zone par raisonnement à partir du segment et de l'idée retenue (pas une donnée mesurée). Le comptage effectif s'appuiera sur ces codes.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Périmètre d'étude de marché (E4 · Le Cartographe)", contentMd: parsed.scope_md ?? "", type: "scope_definition" },
      structuredData: { scope },
      sources,
      scores: { qualitySelf: 70, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("petit", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
