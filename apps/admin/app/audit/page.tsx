import { readRecentAudit } from "@/lib/audit";
import { AuditTable } from "@/components/AuditTable";

export const dynamic = "force-dynamic";

/**
 * Journal d'audit opérateur — preuve visible que l'audit trail existe et n'est pas
 * contournable. La table `admin_audit_log` est append-only et immuable (trigger anti
 * UPDATE/DELETE/TRUNCATE, service_role inclus). Rien n'est modifiable depuis cette vue.
 */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; q?: string }> }) {
  const { action, q } = await searchParams;
  const all = await readRecentAudit(500);
  const rows = all.filter(
    (r) =>
      (!action || r.action === action) &&
      (!q || `${r.actorLabel} ${r.action} ${r.targetLabel ?? ""} ${JSON.stringify(r.details)}`.toLowerCase().includes(q.toLowerCase())),
  );

  const actions = [...new Set(all.map((r) => r.action))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Journal d’audit opérateur</h1>
        <p className="text-sm text-slate-500">
          Trace append-only et <span className="font-medium">immuable</span> de chaque acte opérateur (impersonation,
          promotion/refus/rollback de version, provisioning). Aucune ligne ne peut être modifiée ni supprimée — trigger base.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4" method="get">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Recherche
          <input name="q" defaultValue={q ?? ""} placeholder="opérateur, cible, détails…" className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Action
          <select name="action" defaultValue={action ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="">Toutes</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Filtrer</button>
        <span className="text-xs text-slate-400">{rows.length}/{all.length} lignes</span>
      </form>

      <AuditTable rows={rows} emptyLabel="Aucun acte opérateur enregistré pour l’instant." />
    </div>
  );
}
