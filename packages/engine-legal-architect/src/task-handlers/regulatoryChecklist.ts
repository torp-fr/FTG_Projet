/**
 * Handler task_type = regulatory_checklist (tier intermédiaire).
 * Obligations d'accès du segment (diplômes/qualifications, agréments, déclarations,
 * assurances), sourcées via legifrancePiste (datées) quand dispo, sinon [E] + renvoi.
 * Pour l'ARTISANAT : qualification + assurances obligatoires garanties en DÉPENDANCES DURES.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { LegalText, SourceResult } from "@ftg/data-sources";
import { citationToSource, researchDepth, safeSource, type E7Handler } from "../deps.js";
import { REGULATORY_CHECKLIST_SYSTEM } from "../prompts/regulatory-checklist.js";

/** Référence Légifrance par défaut : qualification artisanale (Loi n° 96-603, art. 16). */
const DEFAULT_ARTICLE = { articleId: "LEGIARTI000006451473", label: "Loi n° 96-603 du 5 juillet 1996 (art. 16) — qualification artisanale" };

interface ChecklistItemJson {
  obligation?: string;
  type?: string;
  hard_dependency?: boolean;
  detail?: string;
  reference?: string;
  date_verification?: string;
  is_estimate?: boolean;
  method?: string;
}
interface ChecklistJson {
  items?: ChecklistItemJson[];
  hard_dependencies?: unknown;
  summary_md?: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function isArtisanat(segment: string, activity: string, flag: unknown): boolean {
  if (flag === true) return true;
  return /artisan|menuis|b[aâ]timent|ma[cç]on|plomb|[ée]lectr|btp|charpent|couvreur|serrur|peintre/i.test(`${segment} ${activity}`);
}

export const regulatoryChecklist: E7Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const segment = str(si.segment);
  const activity = str(si.activity ?? si.idee ?? si.activite);
  const now = deps.now();
  const dateVerif = now.slice(0, 10);
  const artisanat = isArtisanat(segment, activity, si.is_artisanat);

  const articleId = str(si.legifrance_article_id) || DEFAULT_ARTICLE.articleId;
  const label = str(si.legifrance_label) || DEFAULT_ARTICLE.label;

  // Récupération d'un texte de loi daté (réel si OAuth PISTE dispo, sinon dégradé [E]).
  const legal: SourceResult<LegalText> = await safeSource(
    () => deps.sources.legifrancePiste({ articleId, label }),
    { articleId, title: label, excerpt: null, dateVersion: null, url: null, available: false },
    "Légifrance (API PISTE / DILA)",
    now,
    "Texte Légifrance non récupéré — à confirmer sur legifrance.gouv.fr + validation professionnelle",
  );

  const userPrompt = [
    "Contexte projet :",
    JSON.stringify({ segment, activity, artisanat }, null, 2),
    "",
    legal.data.available
      ? `Texte de loi récupéré (Légifrance, version du ${legal.data.dateVersion ?? "?"}) : ${legal.data.title ?? articleId}\n${(legal.data.excerpt ?? "").slice(0, 400)}`
      : `Texte de loi NON récupéré en direct (source dégradée) : marque les items concernés is_estimate=true (à confirmer à la date ${dateVerif}).`,
    "",
    "Établis la checklist des obligations d'accès, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<ChecklistJson>(await deps.callModel("intermediaire", REGULATORY_CHECKLIST_SYSTEM, userPrompt));

  const items = (parsed.items ?? []).map((it) => ({
    obligation: str(it.obligation),
    type: str(it.type) || "autre",
    hard_dependency: Boolean(it.hard_dependency),
    detail: str(it.detail),
    reference: str(it.reference) || (legal.data.available ? (legal.data.title ?? label) : "à confirmer (Légifrance/Service-Public)"),
    date_verification: str(it.date_verification) || (legal.data.dateVersion ?? dateVerif),
    is_estimate: it.is_estimate !== false && !legal.data.available ? true : Boolean(it.is_estimate),
    method: str(it.method) || (legal.data.available ? "" : "À confirmer sur Légifrance/Service-Public + validation professionnelle."),
  }));

  const hard_dependencies = arr(parsed.hard_dependencies);

  // GARANTIE DÉTERMINISTE (artisanat) : qualification + assurances obligatoires en dépendances dures.
  if (artisanat) {
    const mandatory = [
      { obligation: "Qualification professionnelle (activité artisanale réglementée)", type: "qualification" },
      { obligation: "Assurance responsabilité civile professionnelle", type: "assurance" },
      ...(/b[aâ]timent|ma[cç]on|menuis|charpent|couvreur|btp/i.test(`${segment} ${activity}`)
        ? [{ obligation: "Assurance décennale (activité du bâtiment)", type: "assurance" }]
        : []),
    ];
    for (const m of mandatory) {
      if (!hard_dependencies.some((h) => h.toLowerCase().includes(m.obligation.slice(0, 12).toLowerCase()))) {
        hard_dependencies.push(m.obligation);
      }
      if (!items.some((it) => it.obligation.toLowerCase().includes(m.obligation.slice(0, 12).toLowerCase()))) {
        items.push({
          obligation: m.obligation,
          type: m.type,
          hard_dependency: true,
          detail: "Dépendance dure : bloque l'accès à l'activité artisanale tant qu'elle n'est pas satisfaite.",
          reference: legal.data.available ? (legal.data.title ?? label) : "Code de l'artisanat / assurances obligatoires — à confirmer",
          date_verification: legal.data.dateVersion ?? dateVerif,
          is_estimate: !legal.data.available,
          method: legal.data.available ? "" : "À confirmer sur Légifrance/Service-Public + validation professionnelle.",
        });
      } else {
        // Force le drapeau hard sur l'item correspondant.
        const it = items.find((x) => x.obligation.toLowerCase().includes(m.obligation.slice(0, 12).toLowerCase()));
        if (it) it.hard_dependency = true;
      }
    }
  }

  const regulatory_checklist = { segment, activity, artisanat, items, hard_dependencies, summary_md: str(parsed.summary_md) };

  const sources: SourceCitation[] = [
    citationToSource(
      legal.citation,
      legal.data.available
        ? `Texte de référence (Légifrance) : ${legal.data.title ?? articleId} — version du ${legal.data.dateVersion ?? "?"}.`
        : `Texte de référence (Légifrance) non récupéré en direct — à confirmer à la date ${dateVerif}.`,
    ),
    {
      claim: "Checklist des obligations d'accès à l'activité.",
      source: "Raisonnement E7 (L'Architecte)",
      date: now,
      url: null,
      isEstimate: true,
      method: "Obligations d'accès listées par raisonnement, à confirmer sur Légifrance/Service-Public à leur date de vérification + validation professionnelle — jamais un conseil personnalisé.",
    },
  ];

  return {
    partial: {
      deliverable: { title: "Checklist réglementaire d'accès (E7 · L'Architecte)", contentMd: str(parsed.summary_md), type: "regulatory_checklist" },
      structuredData: { regulatory_checklist },
      sources,
      scores: { qualitySelf: legal.data.available ? 80 : 66, vectorContributions: {} },
      telemetry: { researchDepthReached: researchDepth([legal]), modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
