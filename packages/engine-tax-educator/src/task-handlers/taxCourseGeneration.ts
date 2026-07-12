/**
 * Handler task_type = tax_course_generation (tier intermédiaire).
 * Cours 3 niveaux (débutant/intermédiaire/avancé) adapté au statut + segment, ancré sur
 * les barèmes DATÉS du deterministic_core + référence Légifrance/BOFiP datée ([E] si PISTE
 * dégradé). Aucun chiffre LLM.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { ActivityType } from "@ftg/deterministic-core";
import type { LegalText, SourceResult } from "@ftg/data-sources";
import { citationToSource, researchDepth, safeSource, BAREMES_VERIF_DATE, type E8Handler } from "../deps.js";
import { baremesForActivity } from "../baremes.js";
import { TAX_COURSE_SYSTEM } from "../prompts/tax-course.js";

/** Référence fiscale par défaut : CGI art. 293 B (franchise en base de TVA). Identifiant
 *  d'article VÉRIFIÉ via l'API Légifrance/PISTE (getArticle → num « 293 B », en vigueur
 *  depuis 2025-03-01). Dégrade en [E] si PISTE indisponible. */
const DEFAULT_ARTICLE = { articleId: "LEGIARTI000052488142", label: "Code général des impôts, art. 293 B — franchise en base de TVA" };

interface CourseJson {
  levels?: { beginner?: string; intermediate?: string; advanced?: string };
  key_points?: unknown;
  summary_md?: string;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export const taxCourseGeneration: E8Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const activity_type = (typeof si.activity_type === "string" ? si.activity_type : "services_bic") as ActivityType;
  const status = str(si.status) || "micro-entrepreneur";
  const segment = str(si.segment);
  const now = deps.now();

  const baremes = baremesForActivity(activity_type);

  const legal: SourceResult<LegalText> = await safeSource(
    () => deps.sources.legifrancePiste({ articleId: str(si.legifrance_article_id) || DEFAULT_ARTICLE.articleId, label: str(si.legifrance_label) || DEFAULT_ARTICLE.label }),
    { articleId: DEFAULT_ARTICLE.articleId, title: DEFAULT_ARTICLE.label, excerpt: null, dateVersion: null, url: null, available: false },
    "Légifrance (API PISTE / DILA)",
    now,
    "Référence fiscale non récupérée — à confirmer sur BOFiP/Service-Public + validation professionnelle",
  );

  const userPrompt = [
    "Contexte porteur :",
    JSON.stringify({ status, segment, activity_type }, null, 2),
    "",
    `Barèmes DATÉS à utiliser (validité ${baremes.date_validite}) — N'EN INVENTE AUCUN AUTRE :`,
    JSON.stringify(baremes, null, 2),
    "",
    legal.data.available
      ? `Référence Légifrance (version du ${legal.data.dateVersion ?? "?"}) : ${legal.data.title ?? ""}`
      : "Référence Légifrance/BOFiP non récupérée en direct : cite-la comme « à confirmer sur BOFiP/Service-Public » à la date de validité des barèmes.",
    "",
    "Produis le cours fiscal 3 niveaux, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<CourseJson>(await deps.callModel("intermediaire", TAX_COURSE_SYSTEM, userPrompt));

  const tax_course = {
    status,
    segment,
    activity_type,
    date_validite: baremes.date_validite,
    levels: {
      beginner: str(parsed.levels?.beginner),
      intermediate: str(parsed.levels?.intermediate),
      advanced: str(parsed.levels?.advanced),
    },
    key_points: arr(parsed.key_points),
    baremes_used: baremes,
    references: [
      legal.data.available ? `${legal.data.title ?? DEFAULT_ARTICLE.label} (Légifrance, ${legal.data.dateVersion ?? "?"})` : `${DEFAULT_ARTICLE.label} — à confirmer (BOFiP/Service-Public), validité ${baremes.date_validite}`,
    ],
  };

  const sources: SourceCitation[] = [
    {
      claim: "Barèmes fiscaux utilisés dans le cours (taux, seuils, plafonds).",
      source: "@ftg/deterministic-core — barèmes FR 2026",
      date: BAREMES_VERIF_DATE,
      url: null,
      isEstimate: false,
      method: null,
    },
    citationToSource(
      legal.citation,
      legal.data.available
        ? `Référence fiscale (Légifrance) : ${legal.data.title ?? DEFAULT_ARTICLE.label} — version du ${legal.data.dateVersion ?? "?"}.`
        : `Référence fiscale (Légifrance/BOFiP) non récupérée en direct — à confirmer à la date ${baremes.date_validite}.`,
    ),
    {
      claim: "Rédaction pédagogique du cours (3 niveaux).",
      source: "Raisonnement E8 (Le Fiscaliste)",
      date: now,
      url: null,
      isEstimate: true,
      method: "Explication du cadre fiscal à partir des barèmes déterministes datés — aucun chiffre produit par le modèle, aucune optimisation personnalisée.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Cours fiscal 3 niveaux (E8 · Le Fiscaliste)", contentMd: str(parsed.summary_md), type: "tax_course_generation" },
      structuredData: { tax_course },
      pedagogy: {
        cadre_fiscal: { beginner: tax_course.levels.beginner, intermediate: tax_course.levels.intermediate, advanced: tax_course.levels.advanced },
      },
      sources,
      scores: { qualitySelf: legal.data.available ? 82 : 74, vectorContributions: {} },
      telemetry: { researchDepthReached: researchDepth([legal]), modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
