import "./server-guard.js";
import type { EstablishmentInfo, SourceResult } from "./types.js";
import { fetchJson, errMsg, real, degraded } from "./http.js";

/** Aligné sur data_sources.code = insee_sirene (waterfall N1). */
const SOURCE = "API Sirene (INSEE)";
const WATERFALL = 1;
// Nouveau portail INSEE (portail-api.insee.fr) : gateway api.insee.fr/api-sirene/3.11,
// auth par en-tête X-INSEE-Api-Key-Integration (clé UUID) — vérifié empiriquement.
const BASE = "https://api.insee.fr/api-sirene/3.11/siret";

interface RawSirene {
  etablissement?: {
    siret?: string;
    uniteLegale?: {
      denominationUniteLegale?: string;
      nomUniteLegale?: string;
      activitePrincipaleUniteLegale?: string;
      dateCreationUniteLegale?: string;
      etatAdministratifUniteLegale?: string;
    };
    adresseEtablissement?: {
      libelleCommuneEtablissement?: string;
      codePostalEtablissement?: string;
    };
  };
}

/**
 * Enrichissement / vérification d'un établissement via l'API Sirene (INSEE).
 * Clé INSEE_SIRENE_API_KEY (en-tête X-INSEE-Api-Key-Integration). Dégrade proprement
 * (null + isEstimate) si clé absente ou API indisponible.
 */
export async function sireneInsee(siret: string): Promise<SourceResult<EstablishmentInfo | null>> {
  const now = new Date().toISOString();
  const url = `${BASE}/${encodeURIComponent(siret)}`;
  const key = process.env.INSEE_SIRENE_API_KEY;
  if (!key) {
    return degraded(SOURCE, WATERFALL, now, url, "Clé INSEE_SIRENE_API_KEY absente — établissement non vérifié via Sirene.", null);
  }
  try {
    const res = (await fetchJson(url, {
      headers: { "X-INSEE-Api-Key-Integration": key, Accept: "application/json" },
    })) as RawSirene;
    const e = res.etablissement ?? {};
    const u = e.uniteLegale ?? {};
    const a = e.adresseEtablissement ?? {};
    const info: EstablishmentInfo = {
      siret: e.siret ?? siret,
      denomination: u.denominationUniteLegale ?? u.nomUniteLegale ?? null,
      naf: u.activitePrincipaleUniteLegale ?? null,
      commune: a.libelleCommuneEtablissement ?? null,
      codePostal: a.codePostalEtablissement ?? null,
      dateCreation: u.dateCreationUniteLegale ?? null,
      etat: u.etatAdministratifUniteLegale ?? null,
    };
    return real(SOURCE, WATERFALL, now, url, info);
  } catch (err) {
    return degraded(SOURCE, WATERFALL, now, url, `API Sirene indisponible (${errMsg(err)}) — établissement non vérifié.`, null);
  }
}
