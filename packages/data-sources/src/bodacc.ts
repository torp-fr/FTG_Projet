import "./server-guard.js";
import type { VitalitySignal, SourceResult } from "./types.js";
import { fetchJson, errMsg, real, degraded } from "./http.js";

/** Aligné sur data_sources.code = bodacc (waterfall N1, sans clé). */
const SOURCE = "BODACC (open data)";
const WATERFALL = 1;
const BASE = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records";

export interface BodaccParams {
  /** Terme recherché (secteur/activité), ex. "menuiserie". */
  q: string;
  /** Département (numerodepartement), ex. "34". */
  departement?: string;
  /** Nombre d'annonces (borné à 50). */
  limit?: number;
}

interface RawBodacc {
  dateparution?: string;
  familleavis_lib?: string;
  familleavis?: string;
  typeavis_lib?: string;
  commercant?: string;
  ville?: string;
  cp?: string;
  numerodepartement?: string;
}

function mapSignal(r: RawBodacc): VitalitySignal {
  return {
    date: r.dateparution ?? "",
    type: r.familleavis_lib ?? r.typeavis_lib ?? r.familleavis ?? "annonce",
    commercant: r.commercant ?? null,
    ville: r.ville ?? null,
    departement: r.numerodepartement ?? null,
  };
}

/**
 * Signaux de vitalité/défaillance via BODACC (opendatasoft, sans clé) :
 * créations, ventes, procédures collectives récentes par secteur/zone.
 * Dégrade proprement (liste vide + isEstimate) si indisponible.
 */
export async function bodacc(params: BodaccParams): Promise<SourceResult<VitalitySignal[]>> {
  const now = new Date().toISOString();
  const url = new URL(BASE);
  const safeQ = params.q.replace(/"/g, "");
  const where = params.departement
    ? `search("${safeQ}") and numerodepartement="${params.departement}"`
    : `search("${safeQ}")`;
  url.searchParams.set("where", where);
  url.searchParams.set("order_by", "dateparution desc");
  url.searchParams.set("limit", String(Math.min(Math.max(params.limit ?? 20, 1), 50)));

  try {
    const j = (await fetchJson(url.toString())) as { results?: RawBodacc[]; total_count?: number };
    const signals = (j.results ?? []).map(mapSignal).filter((s) => s.date);
    return real(SOURCE, WATERFALL, now, url.toString(), signals);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      url.toString(),
      `API BODACC indisponible (${errMsg(err)}) — signaux de vitalité non collectés (repli sans donnée inventée).`,
      [] as VitalitySignal[],
    );
  }
}
