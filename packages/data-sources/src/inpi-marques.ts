import "./server-guard.js";
import type { SourceResult, TrademarkIndication } from "./types.js";
import { errMsg } from "./http.js";

/**
 * Indication de marque — TOUJOURS INDICATIVE (isEstimate=true), jamais une vérification
 * officielle en base marques ni une recherche d'antériorité.
 *
 * Vérifié empiriquement : (a) Pappers `/v2/recherche-marques` existe mais renvoie 401
 * « crédits épuisés » tant que le compte n'est pas rechargé → dégrade en [E] ; (b)
 * data.inpi.fr renvoie 403 à tout accès script (anti-bot) → PAS de source JSON fiable, on
 * ne force pas. Dans tous les cas on JOINT l'URL de recherche INPI pour vérification
 * MANUELLE, et on renvoie vers une recherche d'antériorité professionnelle.
 */
const SOURCE_OK = "Pappers (marques) — indicatif";
const SOURCE_UNVERIFIED = "Marques — vérification manuelle INPI requise";
const WATERFALL = 2;
const PAPPERS_MARQUES = "https://api.pappers.fr/v2/recherche-marques";

export function inpiSearchUrl(query: string): string {
  return `https://data.inpi.fr/search?displayStyle=LIST&type=marques&q=${encodeURIComponent(query)}`;
}

export interface InpiMarquesParams {
  query: string;
}

interface PappersMarque {
  nom?: string;
  nom_marque?: string;
  denomination?: string;
  classes?: Array<{ numero?: number | string }>;
}

export async function inpiMarques(params: InpiMarquesParams): Promise<SourceResult<TrademarkIndication>> {
  const now = new Date().toISOString();
  const url = inpiSearchUrl(params.query);
  const key = process.env.PAPPERS_API_KEY;

  let checked = false;
  let potentialHits: TrademarkIndication["potentialHits"] = [];
  let apiNote: string;

  if (!key) {
    apiNote = "PAPPERS_API_KEY absente — aucune base marques interrogée.";
  } else {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${PAPPERS_MARQUES}?q=${encodeURIComponent(params.query)}&api_token=${encodeURIComponent(key)}`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (res.ok) {
        const j = (await res.json()) as { resultats?: PappersMarque[]; marques?: PappersMarque[] };
        const list = j.resultats ?? j.marques ?? [];
        potentialHits = list
          .map((m) => ({
            denomination: (m.nom ?? m.nom_marque ?? m.denomination ?? "").trim(),
            classes: (m.classes ?? []).map((c) => String(c.numero ?? "")).filter(Boolean),
          }))
          .filter((h) => h.denomination);
        checked = true;
        apiNote = "Pappers marques a répondu (indicatif — PAS une recherche d'antériorité officielle).";
      } else {
        const body = await res.text().catch(() => "");
        apiNote = `Pappers marques indisponible (HTTP ${res.status}${/cr[ée]dit/i.test(body) ? " — crédits gratuits épuisés" : ""}).`;
      }
    } catch (err) {
      apiNote = `Pappers marques indisponible (${errMsg(err)}).`;
    } finally {
      clearTimeout(timer);
    }
  }

  const method =
    `Disponibilité de marque INDICATIVE (jamais certaine). ${apiNote} ` +
    `Ce n'est PAS une recherche d'antériorité officielle. Vérifiez manuellement sur l'INPI (URL jointe) et faites réaliser une recherche d'antériorité par un professionnel (CPI/avocat).`;

  const data: TrademarkIndication = {
    query: params.query,
    source: checked ? "Pappers (marques)" : "non vérifié (indicatif)",
    checked,
    potentialHits,
    inpiSearchUrl: url,
    checkedAt: now,
    note: method,
  };

  // TOUJOURS isEstimate=true (indicatif). degraded=true si aucune base n'a répondu.
  return { data, citation: { source: checked ? SOURCE_OK : SOURCE_UNVERIFIED, date: now, url, isEstimate: true, method }, degraded: !checked, waterfallLevel: WATERFALL };
}
