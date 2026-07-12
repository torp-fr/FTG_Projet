import type { Citation, SourceResult } from "./types.js";

/** GET JSON avec timeout ; lève sur !res.ok ou timeout (capté par les clients pour dégrader). */
export async function fetchJson(url: string, init?: RequestInit, timeoutMs = 12000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
      throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Construit un résultat DÉGRADÉ (source non répondante) : isEstimate=true + method. */
export function degraded<T>(
  source: string,
  waterfallLevel: number,
  date: string,
  url: string | null,
  method: string,
  fallback: T,
): SourceResult<T> {
  const citation: Citation = { source, date, url, isEstimate: true, method };
  return { data: fallback, citation, degraded: true, waterfallLevel };
}

/** Construit un résultat RÉEL (source répondante) : isEstimate=false + source/date. */
export function real<T>(
  source: string,
  waterfallLevel: number,
  date: string,
  url: string | null,
  data: T,
): SourceResult<T> {
  const citation: Citation = { source, date, url, isEstimate: false, method: null };
  return { data, citation, degraded: false, waterfallLevel };
}
