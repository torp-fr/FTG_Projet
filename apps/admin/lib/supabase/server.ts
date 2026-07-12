import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@ftg/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Client Supabase lié à la SESSION (clé anon publique) — sert UNIQUEMENT à l'authentification
 * de l'opérateur (résolution de session + is_operator via RLS). Les lectures de supervision et
 * les écritures d'audit restent en service_role (lib/supabase.ts), gardées derrière l'auth
 * opérateur — l'immuabilité de l'audit n'est pas affaiblie.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component : cookies posés par le middleware.
        }
      },
    },
  });
}
