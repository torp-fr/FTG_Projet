import "./server-guard.js";
import type { BodaccTrend, BodaccWindow, VitalitySignal, SourceResult } from "./types.js";
import { fetchJson, errMsg, real, degraded } from "./http.js";

/** Aligné sur data_sources.code = bodacc (waterfall N1, sans clé). */
const SOURCE = "BODACC (open data)";
const WATERFALL = 1;
const BASE = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records";
/** Familles d'avis BODACC (valeurs exactes de familleavis_lib, vérifiées via la facette). */
const FAMILLE_CREATIONS = "Créations";
const FAMILLE_PROCEDURES = "Procédures collectives";

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

export interface BodaccTrendParams {
  /** Terme sectoriel recherché (dérivé des libellés NAF / mots-clés). */
  q: string;
  departement?: string;
  /** Date d'ancrage ISO des fenêtres (injectable pour déterminisme). */
  now: string;
  /** Taille d'une fenêtre en mois (défaut 12). */
  windowMonths?: number;
}

/** Décale une date ISO de `months` mois en arrière → "YYYY-MM-DD". */
function shiftMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function whereClause(q: string, famille: string, from: string, to: string, departement?: string): string {
  const safeQ = q.replace(/"/g, "");
  let w = `search("${safeQ}") and familleavis_lib="${famille}" and dateparution>="${from}" and dateparution<"${to}"`;
  if (departement) w += ` and numerodepartement="${departement}"`;
  return w;
}

async function countAnnonces(where: string): Promise<number> {
  const url = new URL(BASE);
  url.searchParams.set("where", where);
  url.searchParams.set("limit", "1");
  const j = (await fetchJson(url.toString())) as { total_count?: number };
  return j.total_count ?? 0;
}

/**
 * AGRÉGATION TEMPORELLE (tendance de vitalité RÉELLE) : compte les annonces BODACC
 * datées « Créations » vs « Procédures collectives » sur deux fenêtres consécutives de
 * `windowMonths` mois → sens de la tendance des créations. Chiffres réels (total_count,
 * non plafonné). Dégrade proprement si l'API est indisponible. NB : BODACC compte des
 * ANNONCES (plusieurs par entreprise possible), pas des entreprises uniques — déclaré
 * dans la méthode.
 */
export async function bodaccTrend(params: BodaccTrendParams): Promise<SourceResult<BodaccTrend>> {
  const now = new Date().toISOString();
  const wm = params.windowMonths ?? 12;
  const to = new Date(params.now).toISOString().slice(0, 10);
  const midFrom = shiftMonths(params.now, wm); // début fenêtre récente
  const prevFrom = shiftMonths(params.now, wm * 2); // début fenêtre précédente
  const citationUrl = `${BASE}?where=search("${params.q.replace(/"/g, "")}")+familleavis_lib+dateparution (agrégats total_count datés)`;

  const empty: BodaccTrend = {
    q: params.q,
    zone: params.departement ?? null,
    windowMonths: wm,
    recent: { from: midFrom, to, creations: 0, proceduresCollectives: 0 },
    previous: { from: prevFrom, to: midFrom, creations: 0, proceduresCollectives: 0 },
    creationsDelta: 0,
    creationsTrend: "stable",
  };

  try {
    const [recentCrea, recentProc, prevCrea, prevProc] = await Promise.all([
      countAnnonces(whereClause(params.q, FAMILLE_CREATIONS, midFrom, to, params.departement)),
      countAnnonces(whereClause(params.q, FAMILLE_PROCEDURES, midFrom, to, params.departement)),
      countAnnonces(whereClause(params.q, FAMILLE_CREATIONS, prevFrom, midFrom, params.departement)),
      countAnnonces(whereClause(params.q, FAMILLE_PROCEDURES, prevFrom, midFrom, params.departement)),
    ]);
    const recent: BodaccWindow = { from: midFrom, to, creations: recentCrea, proceduresCollectives: recentProc };
    const previous: BodaccWindow = { from: prevFrom, to: midFrom, creations: prevCrea, proceduresCollectives: prevProc };
    const creationsDelta = recentCrea - prevCrea;
    const creationsTrend: BodaccTrend["creationsTrend"] =
      prevCrea === 0
        ? recentCrea > 0
          ? "hausse"
          : "stable"
        : recentCrea > prevCrea * 1.1
          ? "hausse"
          : recentCrea < prevCrea * 0.9
            ? "baisse"
            : "stable";
    const trend: BodaccTrend = { q: params.q, zone: params.departement ?? null, windowMonths: wm, recent, previous, creationsDelta, creationsTrend };
    return real(SOURCE, WATERFALL, now, citationUrl, trend);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      citationUrl,
      `API BODACC indisponible (${errMsg(err)}) — tendance de vitalité non comptée (repli sans donnée inventée).`,
      empty,
    );
  }
}
