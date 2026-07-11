/**
 * @ftg/database — client Supabase typé (Chantier 4 §1, principe #8 RLS).
 *
 * Aucune logique métier ici — uniquement l'accès data typé, consommé par
 * `orchestrator` et les `apps/*`. Deux constructeurs :
 *  - `createFtgClient` : clé anonyme (RLS appliquée, usage front/porteur)
 *  - `createFtgServiceClient` : clé service_role (bypass RLS — réservé aux
 *    fonctions serveur : Gatekeeper, Sequencer, Diffuser, jamais exposé au client)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

export type FtgClient = SupabaseClient<Database>;

export function createFtgClient(url: string, anonKey: string): FtgClient {
  return createClient<Database>(url, anonKey);
}

export function createFtgServiceClient(url: string, serviceRoleKey: string): FtgClient {
  // Ce client bypasse RLS — ne doit JAMAIS être instancié côté client/navigateur
  // (principe #2, Chantier 4 §0 : gates côté serveur uniquement).
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export * from "./types.js";
