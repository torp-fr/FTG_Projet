import { getDefaultProjectId } from "@/lib/data";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const id = await getDefaultProjectId();
  if (!id) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        Porteur par défaut introuvable. Lance d’abord{" "}
        <code className="rounded bg-slate-100 px-1">scripts/seed-demo-cohort.ts</code>.
      </div>
    );
  }
  return <Dashboard projectId={id} />;
}
