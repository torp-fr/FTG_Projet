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
export * from "./legifrance-piste.js";
export * from "./rdap-domains.js";
export * from "./inpi-marques.js";
export * from "./social-handles.js";

import { rechercheEntreprises, countEstablishments, type RechercheParams, type DensityParams } from "./recherche-entreprises.js";
import { sireneInsee } from "./sirene-insee.js";
import { pappers } from "./pappers.js";
import { bodacc, bodaccTrend, type BodaccParams, type BodaccTrendParams } from "./bodacc.js";
import { inseeStats, type InseeStatsParams } from "./insee-stats.js";
import { legifrancePiste, type LegifranceParams } from "./legifrance-piste.js";
import { rdapDomains, type RdapParams } from "./rdap-domains.js";
import { inpiMarques, type InpiMarquesParams } from "./inpi-marques.js";
import { socialHandles, type SocialHandlesParams } from "./social-handles.js";
import type {
  Competitor,
  CompanyFinancials,
  DomainCheckResult,
  EstablishmentInfo,
  LegalText,
  MacroSizing,
  MarketDensity,
  BodaccTrend,
  SocialHandlesResult,
  SourceResult,
  TrademarkIndication,
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
  /** Texte juridique daté via Légifrance/PISTE (dégrade en [E] si OAuth indisponible). */
  legifrancePiste(params: LegifranceParams): Promise<SourceResult<LegalText>>;
  /** Disponibilité de noms de domaine (RDAP, réel : 404=libre / 200=pris). */
  rdapDomains(params: RdapParams): Promise<SourceResult<DomainCheckResult>>;
  /** Indication de marque (Pappers/URL INPI) — TOUJOURS indicatif [E], jamais officiel. */
  inpiMarques(params: InpiMarquesParams): Promise<SourceResult<TrademarkIndication>>;
  /** Disponibilité de handles réseaux sociaux (best-effort [E]). */
  socialHandles(params: SocialHandlesParams): Promise<SourceResult<SocialHandlesResult>>;
}

/** Clients réels (lisant l'env serveur). */
export function createDataSources(): DataSources {
  return { rechercheEntreprises, countEstablishments, sireneInsee, pappers, bodacc, bodaccTrend, inseeStats, legifrancePiste, rdapDomains, inpiMarques, socialHandles };
}
