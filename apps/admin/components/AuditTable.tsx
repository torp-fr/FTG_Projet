import type { AuditRow } from "@/lib/audit";
import { fmtDateTime } from "@/lib/format";

const ACTION_CLS: Record<string, string> = {
  "impersonation.start": "bg-amber-50 text-amber-700 border-amber-200",
  "impersonation.view": "bg-amber-50 text-amber-700 border-amber-200",
  "impersonation.end": "bg-slate-100 text-slate-600 border-slate-300",
  "version.promote": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "version.promote_refused": "bg-rose-50 text-rose-700 border-rose-200",
  "version.rollback": "bg-violet-50 text-violet-700 border-violet-200",
  "account.provision": "bg-blue-50 text-blue-700 border-blue-200",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_CLS[action] ?? "bg-slate-50 text-slate-500 border-slate-200";
  return <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>{action}</span>;
}

export function AuditTable({ rows, emptyLabel = "Aucune trace." }: { rows: AuditRow[]; emptyLabel?: string }) {
  if (rows.length === 0) return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Horodatage</th>
            <th className="px-4 py-2.5 font-medium">Opérateur</th>
            <th className="px-4 py-2.5 font-medium">Action</th>
            <th className="px-4 py-2.5 font-medium">Cible</th>
            <th className="px-4 py-2.5 font-medium">Détails</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="align-top hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{fmtDateTime(r.createdAt)}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.actorLabel}</td>
              <td className="px-4 py-2.5"><ActionBadge action={r.action} /></td>
              <td className="px-4 py-2.5 text-slate-600">
                {r.targetLabel ?? "—"}
                {r.targetType ? <span className="ml-1 text-xs text-slate-400">({r.targetType})</span> : null}
              </td>
              <td className="px-4 py-2.5">
                <code className="block max-w-md overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-slate-500">
                  {Object.keys(r.details).length ? JSON.stringify(r.details) : "—"}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
