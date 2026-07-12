import { getImpersonationSession } from "@/lib/impersonation";
import { endImpersonation } from "@/app/actions";

/**
 * Bandeau GLOBAL « Mode impersonation ». Rendu par le layout → visible sur TOUTES les pages
 * pendant toute la session d'impersonation (tant que le cookie est présent). Porte le bouton
 * de sortie (endImpersonation, tracé).
 */
export async function ImpersonationBanner() {
  const session = await getImpersonationSession();
  if (!session) return null;
  return (
    <div className="border-b border-amber-300 bg-amber-100 text-amber-900">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-2 text-sm">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <span className="font-medium">Mode impersonation — {session.porteurName}</span>
        <span className="text-amber-700">vue read-only du dashboard porteur · session tracée</span>
        <form action={endImpersonation} className="ml-auto">
          <input type="hidden" name="projectId" value={session.projectId} />
          <button type="submit" className="rounded-md border border-amber-400 bg-white/70 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-white">
            Terminer l’impersonation
          </button>
        </form>
      </div>
    </div>
  );
}
