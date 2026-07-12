import "./server-guard.js";
import type { MacroSizing, SourceResult } from "./types.js";
import { errMsg, fetchJson, real, degraded } from "./http.js";

/**
 * Cadrage macro-sectoriel INSEE (BDM / comptes du commerce) — waterfall N1.
 *
 * IMPORTANT : la Banque de Données Macro-économiques (BDM) et les comptes du commerce
 * exigent une SOUSCRIPTION dédiée sur portail-api.insee.fr, DISTINCTE de la clé Sirene.
 * Sans clé BDM (`INSEE_BDM_API_KEY`), ce client NE PLANTE PAS : il DÉGRADE proprement
 * (available=false + isEstimate + method). Le sizing macro reste alors une estimation
 * méthodique côté engine ([E]), jamais un faux chiffre présenté comme un fait.
 */
const SOURCE = "INSEE (statistiques macro-sectorielles — BDM / comptes du commerce)";
const WATERFALL = 1;
const BDM_BASE = "https://api.insee.fr/series/BDM/V1/data";

export interface InseeStatsParams {
  /** Secteur cible (libellé). */
  sector: string;
  /** Identifiant de série BDM si connu (sinon dégradation méthodique). */
  seriesId?: string;
}

export async function inseeStats(params: InseeStatsParams): Promise<SourceResult<MacroSizing>> {
  const now = new Date().toISOString();
  const key = process.env.INSEE_BDM_API_KEY;
  const fallback: MacroSizing = { sector: params.sector, indicator: null, value: null, unit: null, period: null, available: false };

  // Sans souscription BDM connectée : dégradation documentée (le sizing macro sera [E]).
  if (!key || !params.seriesId) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      null,
      "Statistiques macro INSEE (BDM / comptes du commerce) non connectées : souscription dédiée (portail-api.insee.fr) distincte de la clé Sirene, non activée. Sizing macro laissé en estimation méthodique ([E]) côté engine.",
      fallback,
    );
  }

  // Chemin réel (si une série BDM est fournie et la clé souscrite) — sinon dégradation propre.
  try {
    const url = `${BDM_BASE}/${encodeURIComponent(params.seriesId)}`;
    const j = (await fetchJson(url, { headers: { "X-INSEE-Api-Key-Integration": key, Accept: "application/json" } })) as {
      value?: number;
      unit?: string;
      period?: string;
    };
    const sizing: MacroSizing = {
      sector: params.sector,
      indicator: params.seriesId,
      value: typeof j.value === "number" ? j.value : null,
      unit: j.unit ?? null,
      period: j.period ?? null,
      available: typeof j.value === "number",
    };
    return real(SOURCE, WATERFALL, now, url, sizing);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      null,
      `Statistiques macro INSEE indisponibles (${errMsg(err)}) — sizing macro laissé en estimation méthodique ([E]).`,
      fallback,
    );
  }
}
