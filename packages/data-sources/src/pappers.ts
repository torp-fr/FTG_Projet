import "./server-guard.js";
import type { CompanyFinancials, SourceResult } from "./types.js";
import { fetchJson, errMsg, real, degraded } from "./http.js";

/** Aligné sur data_sources.code = pappers (waterfall N2, pay-as-you-go). */
const SOURCE = "API Pappers";
const WATERFALL = 2;
const BASE = "https://api.pappers.fr/v2/entreprise";

/** Borne DURE d'appels Pappers par run (quotas : 100 crédits gratuits). */
export const PAPPERS_MAX_CALLS_PER_RUN = 10;

interface RawPappers {
  nom_entreprise?: string;
  denomination?: string;
  date_creation?: string;
  chiffre_affaires?: number;
  finances?: Array<{ chiffre_affaires?: number; annee?: number }>;
  effectif?: string;
  procedures_collectives?: unknown[];
  procedure_collective?: boolean;
}

function fallback(siren: string): CompanyFinancials {
  return { siren, denomination: null, dateCreation: null, chiffreAffaires: null, effectif: null, proceduresCollectives: 0, available: false };
}

/**
 * Fiche entreprise Pappers (santé financière : CA publié si dispo, ancienneté,
 * procédures collectives). Clé PAPPERS_API_KEY. La clé N'apparaît PAS dans la citation
 * (url publique sans token). Dégrade proprement (available=false + isEstimate + method)
 * en cas de quota épuisé / indisponibilité — jamais de chiffre inventé.
 */
export async function pappers(siren: string): Promise<SourceResult<CompanyFinancials>> {
  const now = new Date().toISOString();
  const publicUrl = `${BASE}?siren=${encodeURIComponent(siren)}`;
  const key = process.env.PAPPERS_API_KEY;
  if (!key) {
    return degraded(SOURCE, WATERFALL, now, publicUrl, "Clé PAPPERS_API_KEY absente — santé financière non récupérée.", fallback(siren));
  }
  const url = `${BASE}?api_token=${encodeURIComponent(key)}&siren=${encodeURIComponent(siren)}`;
  try {
    const j = (await fetchJson(url)) as RawPappers;
    const ca =
      typeof j.chiffre_affaires === "number"
        ? j.chiffre_affaires
        : Array.isArray(j.finances) && typeof j.finances[0]?.chiffre_affaires === "number"
          ? (j.finances[0]!.chiffre_affaires as number)
          : null;
    const data: CompanyFinancials = {
      siren,
      denomination: j.nom_entreprise ?? j.denomination ?? null,
      dateCreation: j.date_creation ?? null,
      chiffreAffaires: ca,
      effectif: j.effectif ?? null,
      proceduresCollectives: Array.isArray(j.procedures_collectives) ? j.procedures_collectives.length : j.procedure_collective ? 1 : 0,
      available: true,
    };
    return real(SOURCE, WATERFALL, now, publicUrl, data);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      publicUrl,
      `Pappers indisponible / quota épuisé (${errMsg(err)}) — santé financière non sourcée pour ce concurrent (approfondissement financier reporté / relevé V2).`,
      fallback(siren),
    );
  }
}
