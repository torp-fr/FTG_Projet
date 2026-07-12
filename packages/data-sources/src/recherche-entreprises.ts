import "./server-guard.js";
import type { Competitor, MarketDensity, NafCount, SourceResult } from "./types.js";
import { fetchJson, errMsg, real, degraded } from "./http.js";

/** Aligné sur data_sources.code = annuaire_entreprises_datagouv (waterfall N1, sans clé). */
const SOURCE = "Annuaire des Entreprises (data.gouv)";
const WATERFALL = 1;
const BASE = "https://recherche-entreprises.api.gouv.fr/search";
/** Plafond de `total_results` renvoyé par l'API : au-delà, la valeur est un PLANCHER. */
export const RE_TOTAL_CAP = 10000;

export interface RechercheParams {
  /** Texte libre (nom/activité/mots-clés). NE QUALIFIE PAS un concurrent à lui seul (risque de faux positif matché sur le nom) — préférer `nafCodes`. */
  q?: string;
  /** Code NAF/APE unique (activite_principale), ex. "16.23Z". */
  naf?: string;
  /**
   * LISTE de codes NAF/APE (activite_principale), ex. ["43.32A","43.32B","16.23Z"].
   * L'API Recherche d'Entreprises accepte des valeurs multiples séparées par des virgules :
   * c'est le filtre d'ACTIVITÉ qualifiant réellement un concurrent (vs. la recherche par nom).
   * Prioritaire sur `naf` s'il est renseigné.
   */
  nafCodes?: string[];
  /** Département (ex. "34"). */
  departement?: string;
  /** Code commune INSEE (ex. "34154"). */
  codeCommune?: string;
  /** Nombre de résultats (borné à 25). */
  perPage?: number;
}

interface RawSiege {
  siret?: string;
  commune?: string;
  libelle_commune?: string;
  code_postal?: string;
  adresse?: string;
  activite_principale?: string;
  date_creation?: string;
  tranche_effectif_salarie?: string;
}
interface RawResult {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: RawSiege;
  activite_principale?: string;
  date_creation?: string;
  tranche_effectif_salarie?: string;
}

function mapCompetitor(r: RawResult): Competitor {
  const s = r.siege ?? {};
  return {
    siren: r.siren ?? "",
    siret: s.siret ?? null,
    denomination: r.nom_complet ?? r.nom_raison_sociale ?? "",
    commune: s.libelle_commune ?? s.commune ?? null,
    codePostal: s.code_postal ?? null,
    naf: r.activite_principale ?? s.activite_principale ?? null,
    // L'endpoint ne renvoie pas le libellé NAF ; l'engine le renseigne depuis la nomenclature sectorielle dérivée.
    nafLabel: null,
    dateCreation: r.date_creation ?? s.date_creation ?? null,
    effectif: r.tranche_effectif_salarie ?? s.tranche_effectif_salarie ?? null,
    source: SOURCE,
  };
}

/**
 * Recherche d'entreprises (API Recherche d'Entreprises / Annuaire des Entreprises,
 * data.gouv). SANS CLÉ. Recherche par activité (NAF), localisation (dép./commune) et
 * texte. Dégrade proprement (liste vide + isEstimate) si l'API est indisponible.
 */
export async function rechercheEntreprises(params: RechercheParams): Promise<SourceResult<Competitor[]>> {
  const url = new URL(BASE);
  if (params.q) url.searchParams.set("q", params.q);
  // Filtre d'activité : liste de NAF prioritaire (qualifie réellement l'activité), sinon code unique.
  const activite = params.nafCodes?.length
    ? params.nafCodes.map((c) => c.trim()).filter(Boolean).join(",")
    : params.naf;
  if (activite) url.searchParams.set("activite_principale", activite);
  if (params.departement) url.searchParams.set("departement", params.departement);
  if (params.codeCommune) url.searchParams.set("code_commune", params.codeCommune);
  url.searchParams.set("per_page", String(Math.min(Math.max(params.perPage ?? 10, 1), 25)));
  url.searchParams.set("page", "1");
  const now = new Date().toISOString();

  try {
    const res = (await fetchJson(url.toString())) as { results?: RawResult[]; total_results?: number };
    const competitors = (res.results ?? []).map(mapCompetitor).filter((c) => c.siren);
    return real(SOURCE, WATERFALL, now, url.toString(), competitors);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      url.toString(),
      `API Recherche d'Entreprises indisponible (${errMsg(err)}) — cartographie non enrichie par cette source (repli sans donnée inventée).`,
      [] as Competitor[],
    );
  }
}

export interface DensityParams {
  /** Codes NAF/APE du secteur (ex. ["43.32A","16.23Z"]). */
  nafCodes: string[];
  departement?: string;
  codeCommune?: string;
  /** Ne compter que les établissements administrativement actifs (etat_administratif=A). */
  activeOnly?: boolean;
}

function densityUrl(activite: string, params: DensityParams): string {
  const url = new URL(BASE);
  url.searchParams.set("activite_principale", activite);
  if (params.departement) url.searchParams.set("departement", params.departement);
  if (params.codeCommune) url.searchParams.set("code_commune", params.codeCommune);
  if (params.activeOnly) url.searchParams.set("etat_administratif", "A");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("page", "1");
  return url.toString();
}

async function fetchTotal(activite: string, params: DensityParams): Promise<number> {
  const res = (await fetchJson(densityUrl(activite, params))) as { total_results?: number };
  return res.total_results ?? 0;
}

/**
 * AGRÉGATION / COMPTAGE (densité de marché RÉELLE) : nombre d'établissements par code(s)
 * NAF + zone, via `total_results` (aucune pagination). Réutilise le filtre `activite_principale`.
 * `total` national est plafonné par l'API → `capped=true` (plancher). Dégrade proprement.
 */
export async function countEstablishments(params: DensityParams): Promise<SourceResult<MarketDensity>> {
  const now = new Date().toISOString();
  const codes = params.nafCodes.map((c) => c.trim()).filter(Boolean);
  const citationUrl = densityUrl(codes.join(","), params);
  const empty: MarketDensity = {
    nafCodes: codes,
    zone: { departement: params.departement ?? null, codeCommune: params.codeCommune ?? null },
    activeOnly: Boolean(params.activeOnly),
    total: 0,
    capped: false,
    perNaf: [],
  };

  try {
    const total = await fetchTotal(codes.join(","), params);
    const perNaf: NafCount[] = [];
    for (const naf of codes) {
      const t = await fetchTotal(naf, params);
      perNaf.push({ naf, total: t, capped: t >= RE_TOTAL_CAP });
    }
    const density: MarketDensity = {
      nafCodes: codes,
      zone: { departement: params.departement ?? null, codeCommune: params.codeCommune ?? null },
      activeOnly: Boolean(params.activeOnly),
      total,
      capped: total >= RE_TOTAL_CAP,
      perNaf,
    };
    return real(SOURCE, WATERFALL, now, citationUrl, density);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      citationUrl,
      `API Recherche d'Entreprises indisponible (${errMsg(err)}) — densité de marché non comptée (repli sans donnée inventée).`,
      empty,
    );
  }
}
