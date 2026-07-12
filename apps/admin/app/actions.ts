"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase";
import { writeAudit } from "@/lib/audit";
import { IMPERSONATION_COOKIE } from "@/lib/impersonation";
import { runEngineSmoke, promoteVersion } from "@/lib/engines";

/**
 * Server actions opérateur. Chaque acte écrit une trace d'audit AVANT tout effet
 * (cookie/redirect) — l'audit est non contournable (fail-closed : si writeAudit lève,
 * l'action s'interrompt sans effet).
 */

export async function startImpersonation(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) throw new Error("startImpersonation: projectId manquant.");

  const c = getServiceClient();
  const { data } = await c.from("projects").select("name, owner_user_id").eq("id", projectId).maybeSingle();
  const proj = data as { name: string; owner_user_id: string } | null;
  if (!proj) throw new Error("startImpersonation: projet introuvable.");
  const { data: uRaw } = await c.from("users").select("profile").eq("id", proj.owner_user_id).maybeSingle();
  const porteurName = (uRaw as { profile: { name?: string } | null } | null)?.profile?.name ?? "—";

  // Trace AVANT d'ouvrir la session (impossible d'impersonate sans début tracé).
  await writeAudit({
    action: "impersonation.start",
    targetType: "porteur",
    targetId: proj.owner_user_id,
    targetLabel: `${porteurName} · ${proj.name}`,
    details: { projectId, projectName: proj.name },
  });

  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE, JSON.stringify({ projectId, porteurName, startedAt: new Date().toISOString() }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(`/impersonation/${projectId}`);
}

export async function endImpersonation(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const jar = await cookies();
  const raw = jar.get(IMPERSONATION_COOKIE)?.value;
  let porteurName = "—";
  let startedAt = "";
  if (raw) {
    try {
      const s = JSON.parse(raw) as { porteurName?: string; startedAt?: string };
      porteurName = s.porteurName ?? "—";
      startedAt = s.startedAt ?? "";
    } catch {
      /* ignore */
    }
  }

  await writeAudit({
    action: "impersonation.end",
    targetType: "porteur",
    targetId: null,
    targetLabel: porteurName,
    details: { projectId, startedAt, endedAt: new Date().toISOString() },
  });

  jar.delete(IMPERSONATION_COOKIE);
  redirect(projectId ? `/projet/${projectId}` : "/");
}

/**
 * Promotion d'une version d'engine : déclenche le smoke réel puis promeut via la fonction base
 * sous verrous (refus si smoke rouge, exactement une active, audit dans la même transaction).
 * Le résultat (promue / refusée + raison) est passé à la page via query params, sans écriture
 * supplémentaire (l'audit est fait par la fonction base).
 */
export async function promoteVersionAction(formData: FormData): Promise<void> {
  const versionId = String(formData.get("versionId") ?? "");
  const engineCode = String(formData.get("engineCode") ?? "");
  if (!versionId || !engineCode) throw new Error("promoteVersionAction: versionId/engineCode manquant.");

  const smoke = await runEngineSmoke(engineCode);
  const result = await promoteVersion(versionId, smoke);

  revalidatePath("/engines");
  const status = result.promoted ? (result.rollback ? "rolledback" : "promoted") : "refused";
  const reason = result.reason ?? "";
  redirect(`/engines?engine=${encodeURIComponent(engineCode)}&status=${status}&reason=${encodeURIComponent(reason)}`);
}
