/**
 * Handler task_type = tax_calendar (tier intermédiaire).
 * Calendrier fiscal (échéances déclaratives/paiement) selon le statut. Daté (validité).
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { modelCallEntry, parseJsonObject } from "@ftg/engine-sdk";
import type { E8Handler } from "../deps.js";
import { TAX_CALENDAR_SYSTEM } from "../prompts/tax-calendar.js";

interface DeadlineJson {
  label?: string;
  period?: string;
  type?: string;
  detail?: string;
}
interface CalendarJson {
  year?: number;
  deadlines?: DeadlineJson[];
  date_validite?: string;
  summary_md?: string;
}
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export const taxCalendar: E8Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const now = deps.now();
  const dateVerif = now.slice(0, 10);
  const status = str(si.status) || "micro-entrepreneur";

  const userPrompt = [
    "Contexte porteur :",
    JSON.stringify({ status, activity_type: si.activity_type, segment: si.segment }, null, 2),
    `Date de vérification : ${dateVerif}.`,
    "",
    "Établis le calendrier fiscal des échéances, selon le schéma JSON.",
  ].join("\n");
  const parsed = parseJsonObject<CalendarJson>(await deps.callModel("intermediaire", TAX_CALENDAR_SYSTEM, userPrompt));

  const tax_calendar = {
    status,
    year: typeof parsed.year === "number" ? parsed.year : 2026,
    deadlines: (parsed.deadlines ?? []).map((d) => ({ label: str(d.label), period: str(d.period), type: str(d.type) || "declaration", detail: str(d.detail) })),
    date_validite: str(parsed.date_validite) || dateVerif,
  };

  const sources: SourceCitation[] = [
    {
      claim: "Calendrier des échéances fiscales selon le statut.",
      source: "Raisonnement E8 (Le Fiscaliste) — d'après impots.gouv.fr / URSSAF",
      date: now,
      url: "https://www.impots.gouv.fr",
      isEstimate: true,
      method: `Échéances déclaratives/paiement selon le statut, à confirmer sur le calendrier officiel (impots.gouv.fr / URSSAF) à la date ${dateVerif} — guidage, pas une optimisation.`,
    },
  ];

  return {
    partial: {
      deliverable: { title: "Calendrier fiscal (E8 · Le Fiscaliste)", contentMd: str(parsed.summary_md), type: "tax_calendar" },
      structuredData: { tax_calendar },
      sources,
      scores: { qualitySelf: 74, vectorContributions: {} },
      telemetry: { researchDepthReached: 1, modelCalls: [modelCallEntry("intermediaire", input.constraints.llmChannel)] },
    },
    obstacleDetected: false,
  };
};
