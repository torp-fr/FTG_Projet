import "./server-guard.js";
import type { DomainAvailability, DomainCheckResult, SourceResult } from "./types.js";
import { real, degraded } from "./http.js";

/**
 * Disponibilité de noms de domaine via RDAP (Registration Data Access Protocol), SANS CLÉ.
 * rdap.org route la requête vers le registre du TLD (.com Verisign, .fr AFNIC, etc.).
 * Sémantique VÉRIFIÉE empiriquement : HTTP 404 = domaine absent du registre (LIBRE),
 * HTTP 200 = enregistré (PRIS), autre = indéterminé. On lit le STATUT (pas via fetchJson
 * qui lèverait sur 404). Dégrade proprement si le registre est injoignable.
 */
const SOURCE = "RDAP (registres de noms de domaine)";
const WATERFALL = 1;
const RDAP_BASE = "https://rdap.org/domain/";
const DEFAULT_TLDS = ["com", "fr"];
const MAX_TLDS = 8;

/** Normalise un nom en label de domaine (minuscule, sans accent/espace/caractère spécial). */
export function toDomainLabel(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

async function statusOf(url: string, timeoutMs = 12000): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { Accept: "application/rdap+json" } });
    return res.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface RdapParams {
  name: string;
  tlds?: string[];
}

export async function rdapDomains(params: RdapParams): Promise<SourceResult<DomainCheckResult>> {
  const now = new Date().toISOString();
  const label = toDomainLabel(params.name);
  const tlds = (params.tlds && params.tlds.length ? params.tlds : DEFAULT_TLDS).map((t) => t.replace(/^\./, "").toLowerCase()).slice(0, MAX_TLDS);

  const domains: DomainAvailability[] = [];
  let anyResolved = false;
  for (const tld of tlds) {
    const domain = `${label}.${tld}`;
    const status = label ? await statusOf(`${RDAP_BASE}${domain}`) : null;
    if (status !== null) anyResolved = true;
    const available = status === 404 ? true : status === 200 ? false : null;
    domains.push({ domain, tld, available, status, checkedAt: new Date().toISOString() });
  }

  const data: DomainCheckResult = { name: params.name, label, domains };
  if (!anyResolved) {
    return degraded(SOURCE, WATERFALL, now, RDAP_BASE, "Registre RDAP injoignable — disponibilité des domaines non vérifiée (repli sans donnée inventée).", data);
  }
  return real(SOURCE, WATERFALL, now, RDAP_BASE, data);
}
