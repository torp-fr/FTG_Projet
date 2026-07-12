import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@ftg/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Client Supabase lié à la SESSION de l'utilisateur (clé anon publique) — la RLS s'applique.
 * Le porteur ne lit donc que SES données (owner). Aucun service_role ici : jamais de bypass RLS
 * côté données porteur, jamais de secret exposé.
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
          // Appelé depuis un Server Component : les cookies sont posés par le middleware.
        }
      },
    },
  });
}
