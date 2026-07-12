import "server-only";
import { createSupabaseServerClient } from "./supabase/server";

export interface SessionUser {
  authId: string;
  email: string | null;
  userId: string | null;
  name: string | null;
}

/** Utilisateur connecté (session) + sa ligne public.users (own row via RLS). null si non connecté. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("id, profile").eq("auth_ref", user.id).maybeSingle();
  const row = data as { id: string; profile: { name?: string } | null } | null;
  return { authId: user.id, email: user.email ?? null, userId: row?.id ?? null, name: row?.profile?.name ?? null };
}
