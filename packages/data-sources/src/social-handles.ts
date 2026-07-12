import "./server-guard.js";
import type { SocialHandleAvailability, SocialHandlesResult, SourceResult } from "./types.js";

/**
 * Disponibilité de handles sur les grandes plateformes, SANS CLÉ, BEST-EFFORT.
 * On interroge l'URL de profil : HTTP 404 = libre, 200 = pris. Certaines plateformes
 * (X, Instagram, LinkedIn) bloquent les scripts / renvoient des statuts ambigus → le
 * résultat est marqué `indicative=true` (incertain). GitHub est fiable (404/200 nets).
 * L'ensemble est renvoyé isEstimate=true (best-effort, jamais une certitude).
 */
const SOURCE = "Handles réseaux sociaux (best-effort)";
const WATERFALL = 1;

interface PlatformDef {
  platform: string;
  url: (h: string) => string;
  reliable: boolean;
}
const PLATFORMS: PlatformDef[] = [
  { platform: "github", url: (h) => `https://github.com/${h}`, reliable: true },
  { platform: "x", url: (h) => `https://x.com/${h}`, reliable: false },
  { platform: "instagram", url: (h) => `https://www.instagram.com/${h}/`, reliable: false },
  { platform: "linkedin", url: (h) => `https://www.linkedin.com/company/${h}`, reliable: false },
];

export function toHandle(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]/g, "");
}

async function statusOf(url: string, timeoutMs = 10000): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; FTG-name-forge/1.0)" } });
    return res.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface SocialHandlesParams {
  handle: string;
  platforms?: string[];
}

export async function socialHandles(params: SocialHandlesParams): Promise<SourceResult<SocialHandlesResult>> {
  const now = new Date().toISOString();
  const handle = toHandle(params.handle);
  const wanted = params.platforms && params.platforms.length ? PLATFORMS.filter((p) => params.platforms!.includes(p.platform)) : PLATFORMS;

  const results: SocialHandleAvailability[] = [];
  for (const p of wanted) {
    const url = p.url(handle);
    const status = handle ? await statusOf(url) : null;
    // GitHub : 404=libre / 200=pris (fiable). Autres : 404 plausible-libre mais incertain, 200 ambigu → null.
    let available: boolean | null;
    let indicative: boolean;
    if (p.reliable) {
      available = status === 404 ? true : status === 200 ? false : null;
      indicative = available === null;
    } else {
      available = status === 404 ? true : null;
      indicative = true;
    }
    results.push({ platform: p.platform, url, status, available, indicative, checkedAt: new Date().toISOString() });
  }

  const data: SocialHandlesResult = { handle, results };
  const method = "Disponibilité de handles BEST-EFFORT (HTTP sur l'URL de profil) : GitHub fiable (404/200) ; X/Instagram/LinkedIn indicatifs (anti-bot / statuts ambigus). À confirmer manuellement sur chaque plateforme.";
  return { data, citation: { source: SOURCE, date: now, url: null, isEstimate: true, method }, degraded: false, waterfallLevel: WATERFALL };
}
