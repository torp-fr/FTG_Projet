import "server-only";
import { createSupabaseServerClient } from "./supabase/server";

export interface SessionOperator {
  authId: string;
  email: string | null;
  userId: string | null;
  name: string | null;
  isOperator: boolean;
}

/** Opérateur connecté (session) + drapeau is_operator (own row via RLS). null si non connecté. */
export async function getSessionOperator(): Promise<SessionOperator | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("id, profile, is_operator").eq("auth_ref", user.id).maybeSingle();
  const row = data as { id: string; profile: { name?: string } | null; is_operator: boolean } | null;
  return {
    authId: user.id,
    email: user.email ?? null,
    userId: row?.id ?? null,
    name: row?.profile?.name ?? null,
    isOperator: row?.is_operator === true,
  };
}
