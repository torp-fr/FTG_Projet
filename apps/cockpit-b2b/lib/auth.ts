import "server-only";
import { createSupabaseServerClient } from "./supabase/server";

export interface SessionUser {
  authId: string;
  email: string | null;
  userId: string | null;
  name: string | null;
}

export interface ConseillerContext {
  user: SessionUser;
  orgs: Array<{ id: string; name: string }>;
}

/** Utilisateur connecté + sa ligne public.users. null si non connecté. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("id, profile").eq("auth_ref", user.id).maybeSingle();
  const row = data as { id: string; profile: { name?: string } | null } | null;
  return { authId: user.id, email: user.email ?? null, userId: row?.id ?? null, name: row?.profile?.name ?? null };
}

/**
 * Contexte conseiller : ses organisations (RLS ne renvoie que celles dont il est membre).
 * `orgs` vide = utilisateur authentifié mais sans cohorte (aucun accès B2B).
 */
export async function getConseillerContext(): Promise<ConseillerContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: urow } = await supabase.from("users").select("id, profile").eq("auth_ref", user.id).maybeSingle();
  const row = urow as { id: string; profile: { name?: string } | null } | null;
  const { data: orgsRaw } = await supabase.from("organizations").select("id, name").order("name");
  const orgs = ((orgsRaw ?? []) as Array<{ id: string; name: string }>).map((o) => ({ id: o.id, name: o.name }));
  return {
    user: { authId: user.id, email: user.email ?? null, userId: row?.id ?? null, name: row?.profile?.name ?? null },
    orgs,
  };
}
