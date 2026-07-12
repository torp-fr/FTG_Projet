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

import { rechercheEntreprises, type RechercheParams } from "./recherche-entreprises.js";
import { sireneInsee } from "./sirene-insee.js";
import { pappers } from "./pappers.js";
import { bodacc, type BodaccParams } from "./bodacc.js";
import type { Competitor, CompanyFinancials, EstablishmentInfo, SourceResult, VitalitySignal } from "./types.js";

/** Ensemble des clients — INJECTABLE (mockable dans les tests des engines consommateurs). */
export interface DataSources {
  rechercheEntreprises(params: RechercheParams): Promise<SourceResult<Competitor[]>>;
  sireneInsee(siret: string): Promise<SourceResult<EstablishmentInfo | null>>;
  pappers(siren: string): Promise<SourceResult<CompanyFinancials>>;
  bodacc(params: BodaccParams): Promise<SourceResult<VitalitySignal[]>>;
}

/** Clients réels (lisant l'env serveur). */
export function createDataSources(): DataSources {
  return { rechercheEntreprises, sireneInsee, pappers, bodacc };
}
