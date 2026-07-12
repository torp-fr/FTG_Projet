"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@ftg/database";

/** Client navigateur (clé anon publique) — formulaire de login. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
