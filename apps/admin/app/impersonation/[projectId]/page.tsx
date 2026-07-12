import Link from "next/link";
import { notFound } from "next/navigation";
import { getPorteurView } from "@/lib/porteur-view";
import { writeAudit } from "@/lib/audit";
import { ImpersonationDashboard } from "@/components/ImpersonationDashboard";

export const dynamic = "force-dynamic";

/**
 * Vue impersonée « voir-comme le porteur » (read-only).
 *
 * AUDIT NON CONTOURNABLE : chaque rendu écrit une trace `impersonation.view` (périmètre
 * consulté) AVANT de renvoyer le dashboard. `writeAudit` lève en cas d'échec → aucune vue
 * n'est rendue sans trace (fail-closed). Il est donc impossible de consulter le contexte d'un
 * porteur — même en naviguant directement sur l'URL — sans qu'une ligne d'audit soit écrite.
 */
export default async function ImpersonationPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const view = await getPorteurView(projectId);
  if (!view) notFound();

  // Trace du périmètre consulté — écrite à CHAQUE rendu, avant l'affichage.
  await writeAudit({
    action: "impersonation.view",
    targetType: "porteur",
    targetId: view.project.id,
    targetLabel: `${view.project.ownerName} · ${view.project.name}`,
    details: {
      projectId: view.project.id,
      scope: {
        phase: view.progression.currentPhase,
        deliverables: view.deliverables.length,
        gates: view.gates.length,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/projet/${view.project.id}`} className="text-sm text-slate-500 hover:underline">← Fiche supervision</Link>
        <span className="text-xs text-slate-400">Impersonation read-only · chaque consultation est journalisée</span>
      </div>
      <ImpersonationDashboard view={view} />
    </div>
  );
}
