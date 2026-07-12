/**
 * @ftg/data-sources — couche de clients de sources de données FR (Lot 3).
 *
 * Chaque client : (a) lit sa clé depuis l'env serveur ("server-only"), (b) respecte son
 * niveau waterfall, (c) DÉGRADE proprement (isEstimate + method) au lieu de planter,
 * (d) renvoie des métadonnées de citation bien formées (A5.4). Aucune donnée inventée.
 */
export * from "./types.js";
export * from "./recherche-entreprises.js";
export * from "./sirene-insee.js";
export * from "./pappers.js";
export * from "./bodacc.js";
export * from "./insee-stats.js";

import { rechercheEntreprises, countEstablishments, type RechercheParams, type DensityParams } from "./recherche-entreprises.js";
import { sireneInsee } from "./sirene-insee.js";
import { pappers } from "./pappers.js";
import { bodacc, bodaccTrend, type BodaccParams, type BodaccTrendParams } from "./bodacc.js";
import { inseeStats, type InseeStatsParams } from "./insee-stats.js";
import type {
  Competitor,
  CompanyFinancials,
  EstablishmentInfo,
  MacroSizing,
  MarketDensity,
  BodaccTrend,
  SourceResult,
  VitalitySignal,
} from "./types.js";

/** Ensemble des clients — INJECTABLE (mockable dans les tests des engines consommateurs). */
export interface DataSources {
  rechercheEntreprises(params: RechercheParams): Promise<SourceResult<Competitor[]>>;
  /** Densité de marché : comptage d'établissements par NAF + zone (agrégation). */
  countEstablishments(params: DensityParams): Promise<SourceResult<MarketDensity>>;
  sireneInsee(siret: string): Promise<SourceResult<EstablishmentInfo | null>>;
  pappers(siren: string): Promise<SourceResult<CompanyFinancials>>;
  bodacc(params: BodaccParams): Promise<SourceResult<VitalitySignal[]>>;
  /** Tendance de vitalité : agrégation temporelle BODACC (créations vs procédures). */
  bodaccTrend(params: BodaccTrendParams): Promise<SourceResult<BodaccTrend>>;
  /** Cadrage macro-sectoriel INSEE (dégrade en [E] si BDM non souscrit). */
  inseeStats(params: InseeStatsParams): Promise<SourceResult<MacroSizing>>;
}

/** Clients réels (lisant l'env serveur). */
export function createDataSources(): DataSources {
  return { rechercheEntreprises, countEstablishments, sireneInsee, pappers, bodacc, bodaccTrend, inseeStats };
}
