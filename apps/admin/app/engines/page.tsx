import { getEnginesOverview, type EngineRow } from "@/lib/engines";
import { readRecentAudit } from "@/lib/audit";
import { promoteVersionAction } from "@/app/actions";
import { AuditTable } from "@/components/AuditTable";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const VERSION_CLS: Record<string, string> = {
  active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  candidate: "border-amber-300 bg-amber-50 text-amber-700",
  retired: "border-slate-300 bg-slate-100 text-slate-500",
};

function ResultBanner({ engine, status, reason }: { engine?: string; status?: string; reason?: string }) {
  if (!status) return null;
  const map: Record<string, { cls: string; label: string }> = {
    promoted: { cls: "border-emerald-300 bg-emerald-50 text-emerald-800", label: `Version promue (${engine}).` },
    rolledback: { cls: "border-violet-300 bg-violet-50 text-violet-800", label: `Rollback effectué (${engine}).` },
    refused: { cls: "border-rose-300 bg-rose-50 text-rose-800", label: `Promotion refusée (${engine}) — ${reason || "smoke non vert"}. Trace écrite dans l’audit.` },
  };
  const m = map[status];
  if (!m) return null;
  return <div className={`rounded-lg border px-4 py-3 text-sm ${m.cls}`}>{m.label}</div>;
}

function EngineCard({ e }: { e: EngineRow }) {
  const smokeGreen = e.lastRun?.status === "done";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-slate-900">{e.name}</span>
        <span className="font-mono text-xs text-slate-400">{e.code}</span>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${e.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          engine {e.status}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          smoke (dernier run) :{" "}
          {e.lastRun ? (
            <span className={smokeGreen ? "text-emerald-600" : "text-rose-600"}>{smokeGreen ? "vert" : e.lastRun.status}</span>
          ) : (
            <span className="text-slate-400">aucun run</span>
          )}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-1.5 pr-4 font-medium">Version</th>
              <th className="py-1.5 pr-4 font-medium">Statut</th>
              <th className="py-1.5 pr-4 font-medium">Déployée</th>
              <th className="py-1.5 pr-4 font-medium">Courante</th>
              <th className="py-1.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {e.versions.length === 0 ? (
              <tr><td colSpan={5} className="py-2 text-xs text-slate-400">Aucune version (engine sans version LLM).</td></tr>
            ) : (
              e.versions.map((v) => (
                <tr key={v.id}>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-700">{v.semver}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded border px-1.5 py-0.5 text-xs ${VERSION_CLS[v.status] ?? "border-slate-200 bg-slate-50 text-slate-500"}`}>{v.status}</span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-400">{fmtDateTime(v.deployedAt)}</td>
                  <td className="py-2 pr-4 text-xs text-slate-500">{v.isCurrent ? "●" : ""}</td>
                  <td className="py-2 text-right">
                    {v.status !== "active" ? (
                      <form action={promoteVersionAction}>
                        <input type="hidden" name="versionId" value={v.id} />
                        <input type="hidden" name="engineCode" value={e.code} />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {v.status === "retired" ? "Rollback (smoke → promeut)" : "Promouvoir (smoke → promeut)"}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-300">active</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function EnginesPage({ searchParams }: { searchParams: Promise<{ engine?: string; status?: string; reason?: string }> }) {
  const { engine, status, reason } = await searchParams;
  const engines = await getEnginesOverview();
  const history = (await readRecentAudit(500)).filter((r) => r.action.startsWith("version."));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Engines & versions</h1>
        <p className="text-sm text-slate-500">
          Promotion <span className="font-medium">candidate → active</span> sous verrous : le smoke doit passer (vert) ;
          exactement une version active par engine (swap transactionnel + index unique) ; refus et rollback tracés dans l’audit.
        </p>
      </div>

      <ResultBanner engine={engine} status={status} reason={reason} />

      <div className="space-y-3">
        {engines.map((e) => <EngineCard key={e.id} e={e} />)}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">Historique des promotions (audit)</h2>
        <AuditTable rows={history} emptyLabel="Aucune promotion/refus/rollback enregistré." />
      </div>

      <p className="text-xs text-slate-400">
        Le smoke déclenché ici est un smoke réel léger (santé engine via dernier run enregistré). Le smoke LLM complet de la
        version candidate vit dans scripts/e*-smoke-test ; son résultat peut alimenter promote_engine_version. Toute promotion,
        refus ou rollback est écrit dans admin_audit_log (immuable), dans la même transaction que le changement d’état.
      </p>
    </div>
  );
}
