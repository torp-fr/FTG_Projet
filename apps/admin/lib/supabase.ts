import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ftg/database";

/**
 * Client Supabase service_role — SERVEUR UNIQUEMENT ("server-only" fait échouer le
 * build si ce module est importé côté client). La console admin supervise les vrais
 * états produits par l'orchestrateur (JC-05) et journalise chaque acte opérateur : elle
 * a besoin du service_role (bypass RLS) pour lire toutes les organisations/projets et
 * écrire l'audit trail. Le service key est lu depuis l'env serveur
 * (SUPABASE_SERVICE_ROLE_KEY, jamais préfixé NEXT_PUBLIC_) → jamais exposé au navigateur.
 */
export function getServiceClient(): SupabaseClient<Database> {
  const rawUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const url = rawUrl.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) manquant dans l'env serveur.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant dans l'env serveur.");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
