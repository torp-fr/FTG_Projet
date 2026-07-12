import { getMyPrimaryProjectId } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const id = await getMyPrimaryProjectId();
  if (!id) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        Aucun projet rattaché à votre compte pour l’instant. Contactez votre accompagnateur si
        vous pensez qu’il s’agit d’une erreur.
      </div>
    );
  }
  return <Dashboard projectId={id} />;
}
