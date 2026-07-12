import "server-only";
import { cookies } from "next/headers";

/**
 * Session d'impersonation (cookie httpOnly). Le cookie sert d'indicateur de session pour
 * afficher la bannière pendant toute la session ; il n'est JAMAIS la source de vérité de
 * l'audit (chaque vue impersonée écrit sa propre trace, cf. la page d'impersonation).
 */
export const IMPERSONATION_COOKIE = "ftg_impersonation";

export interface ImpersonationSession {
  projectId: string;
  porteurName: string;
  startedAt: string;
}

export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
  const jar = await cookies();
  const raw = jar.get(IMPERSONATION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ImpersonationSession>;
    if (parsed && typeof parsed.projectId === "string") {
      return { projectId: parsed.projectId, porteurName: parsed.porteurName ?? "—", startedAt: parsed.startedAt ?? "" };
    }
  } catch {
    /* cookie corrompu → pas de session */
  }
  return null;
}
