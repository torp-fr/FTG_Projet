import "./server-guard.js";
import type { LegalText, SourceResult } from "./types.js";
import { errMsg, fetchJson, real, degraded } from "./http.js";

/**
 * Légifrance via la passerelle PISTE (DILA) — waterfall N1.
 *
 * Flux OAuth2 `client_credentials` : échange (client_id, client_secret) contre un jeton
 * d'accès, MIS EN CACHE et rafraîchi avant expiration, puis appels API Légifrance
 * (récupération de texte/article À JOUR — chaque texte porte sa date de version).
 *
 * Identifiants lus depuis l'env SERVEUR (PISTE_CLIENT_ID / PISTE_CLIENT_SECRET, ou une
 * clé combinée PISTE_LEGIFRANCE_API_KEY au format "id:secret"). Si les identifiants sont
 * INCOMPLETS (client_secret absent) ou l'API indisponible, ce client NE PLANTE PAS : il
 * DÉGRADE proprement (available=false + isEstimate + method), et l'engine bascule sur une
 * référence datée + renvoi professionnel. Aucun faux texte de loi n'est jamais fabriqué.
 */
const SOURCE = "Légifrance (API PISTE / DILA)";
const WATERFALL = 1;
const OAUTH_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const API_BASE = "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

interface TokenCache {
  token: string;
  /** Époque ms d'expiration. */
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

/** Lit les identifiants OAuth PISTE depuis l'env serveur (null si incomplets). */
function readCredentials(): { clientId: string; clientSecret: string } | null {
  const combined = process.env.PISTE_LEGIFRANCE_API_KEY ?? "";
  const [ck, cs] = combined.includes(":") ? combined.split(":", 2) : [combined, ""];
  const clientId = (process.env.PISTE_CLIENT_ID ?? process.env.PISTE_OAUTH_CLIENT_ID ?? ck ?? "").trim();
  const clientSecret = (process.env.PISTE_CLIENT_SECRET ?? process.env.PISTE_OAUTH_CLIENT_SECRET ?? cs ?? "").trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Jeton d'accès PISTE (depuis le cache si encore valide, sinon échange client_credentials). */
async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) return tokenCache.token;
  const creds = readCredentials();
  if (!creds) {
    throw new Error(
      "identifiants OAuth PISTE incomplets (client_id/client_secret) — client_secret absent de l'environnement ; ajouter PISTE_CLIENT_SECRET active la récupération réelle",
    );
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: "openid",
  });
  const res = (await fetchJson(OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  })) as { access_token?: string; expires_in?: number };
  if (!res.access_token) throw new Error("réponse OAuth PISTE sans access_token");
  tokenCache = { token: res.access_token, expiresAt: now + (res.expires_in ?? 3600) * 1000 };
  return res.access_token;
}

export interface LegifranceParams {
  /** Identifiant d'article Légifrance (ex. "LEGIARTI000006844934"). */
  articleId: string;
  /** Libellé lisible du texte (pour la citation). */
  label?: string;
}

/** Réinitialise le cache de jeton (tests). */
export function _resetPisteTokenCache(): void {
  tokenCache = null;
}

/**
 * Récupère un article Légifrance à jour (POST consult/getArticle). Renvoie le texte + sa
 * DATE DE VERSION (fraîcheur). Dégrade proprement si OAuth/API indisponible.
 */
export async function legifrancePiste(params: LegifranceParams): Promise<SourceResult<LegalText>> {
  const now = new Date().toISOString();
  const publicUrl = `https://www.legifrance.gouv.fr/codes/article_lc/${params.articleId}`;
  const fallback: LegalText = { articleId: params.articleId, title: params.label ?? null, excerpt: null, dateVersion: null, url: publicUrl, available: false };

  try {
    const token = await getToken();
    const res = (await fetchJson(`${API_BASE}/consult/getArticle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: params.articleId }),
    })) as { article?: { id?: string; num?: string; texte?: string; dateDebut?: number | string } };

    const a = res.article ?? {};
    const dateVersion = a.dateDebut
      ? typeof a.dateDebut === "number"
        ? new Date(a.dateDebut).toISOString().slice(0, 10)
        : String(a.dateDebut).slice(0, 10)
      : null;
    const text: LegalText = {
      articleId: a.id ?? params.articleId,
      title: params.label ?? (a.num ? `Article ${a.num}` : null),
      excerpt: a.texte ? a.texte.replace(/<[^>]+>/g, "").trim().slice(0, 600) : null,
      dateVersion,
      url: publicUrl,
      available: Boolean(a.texte),
    };
    return real(SOURCE, WATERFALL, now, publicUrl, text);
  } catch (err) {
    return degraded(
      SOURCE,
      WATERFALL,
      now,
      publicUrl,
      `API Légifrance/PISTE indisponible (${errMsg(err)}) — texte non récupéré en direct ; se référer à la version datée sur legifrance.gouv.fr et faire vérifier par un professionnel.`,
      fallback,
    );
  }
}
