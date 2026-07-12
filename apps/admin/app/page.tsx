import Link from "next/link";
import { getSupervisionOverview, type SupervisionRow } from "@/lib/data";
import { VerdictBadge, StatTile } from "@ftg/ui-kit";

export const dynamic = "force-dynamic";

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

function VectorChips({ vectors }: { vectors: Record<string, number> }) {
  const entries = Object.entries(vectors).sort(([a], [b]) => (a < b ? -1 : 1));
  if (entries.length === 0) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-600">
          {k} {Math.round(Number(v) * 10) / 10}
        </span>
      ))}
    </div>
  );
}

function Row({ r }: { r: SupervisionRow }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <Link href={`/projet/${r.id}`} className="font-medium text-slate-900 hover:underline">{r.name}</Link>
        <div className="text-xs text-slate-400">{r.ownerName} · {r.segment ?? "—"} · Porte {r.entryDoor}</div>
      </td>
      <td className="px-4 py-3 text-slate-600">{r.ambition ? AMBITION_LABEL[r.ambition] ?? r.ambition : "—"}</td>
      <td className="px-4 py-3 text-slate-600">{r.currentPhase}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${r.pct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-slate-500">{r.doneCount}/{r.seededCount}</span>
        </div>
      </td>
      <td className="px-4 py-3"><VerdictBadge verdict={r.verdict} /></td>
      <td className="px-4 py-3"><VectorChips vectors={r.vectors} /></td>
      <td className="px-4 py-3 text-center text-slate-600">{r.nDeliverables}</td>
      <td className="px-4 py-3 text-center text-slate-600">{r.nRuns}</td>
    </tr>
  );
}

export default async function SupervisionPage({ searchParams }: { searchParams: Promise<{ phase?: string; verdict?: string; q?: string }> }) {
  const { phase, verdict, q } = await searchParams;
  const { orgs, kpis } = await getSupervisionOverview();

  const matches = (r: SupervisionRow) =>
    (!phase || r.currentPhase === phase) &&
    (!verdict || (r.verdict ?? "—") === verdict) &&
    (!q || `${r.name} ${r.ownerName} ${r.segment ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const filteredOrgs = orgs
    .map((o) => ({ ...o, rows: o.rows.filter(matches) }))
    .filter((o) => o.rows.length > 0);

  const byPhase = Object.entries(kpis.byPhase).sort(([a], [b]) => (a < b ? -1 : 1));
  const byVerdict = Object.entries(kpis.byVerdict);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Supervision</h1>
        <p className="text-sm text-slate-500">
          Vue opérateur sur les vrais états produits par l’orchestrateur (JC-05) — lecture pure, aucune écriture.
        </p>
      </div>

      {/* KPI globaux */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Organisations" value={kpis.orgs} />
        <StatTile label="Projets" value={kpis.projects} />
        <StatTile label="Par phase" value={<span className="text-base font-medium text-slate-700">{byPhase.map(([p, n]) => `${p}·${n}`).join("  ") || "—"}</span>} />
        <StatTile label="Par verdict" value={<span className="text-xs font-normal leading-tight text-slate-600">{byVerdict.map(([v, n]) => `${n}× ${v}`).join(" · ") || "—"}</span>} />
      </div>

      {/* Filtres basiques (GET, sans JS) */}
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4" method="get">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Recherche
          <input name="q" defaultValue={q ?? ""} placeholder="porteur, projet, segment…" className="w-56 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Phase
          <select name="phase" defaultValue={phase ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="">Toutes</option>
            {["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Verdict
          <select name="verdict" defaultValue={verdict ?? ""} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="">Tous</option>
            {Object.keys(kpis.byVerdict).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Filtrer</button>
        {(phase || verdict || q) ? <Link href="/" className="text-xs text-slate-400 hover:underline">réinitialiser</Link> : null}
      </form>

      {/* Tableaux par organisation */}
      {filteredOrgs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Aucun projet ne correspond aux filtres.</div>
      ) : (
        filteredOrgs.map((o) => (
          <div key={o.orgId ?? "orphan"} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-slate-800">{o.orgName}</h2>
              {o.orgType ? <span className="text-xs text-slate-400">{o.orgType}</span> : null}
              <span className="text-xs text-slate-400">· {o.rows.length} projet(s)</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Projet</th>
                    <th className="px-4 py-2.5 font-medium">Ambition</th>
                    <th className="px-4 py-2.5 font-medium">Phase</th>
                    <th className="px-4 py-2.5 font-medium">Progression</th>
                    <th className="px-4 py-2.5 font-medium">Dernier verdict</th>
                    <th className="px-4 py-2.5 font-medium">Vecteurs</th>
                    <th className="px-4 py-2.5 text-center font-medium">Livr.</th>
                    <th className="px-4 py-2.5 text-center font-medium">Runs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {o.rows.map((r) => <Row key={r.id} r={r} />)}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-slate-400">
        Données réelles Supabase (lecture serveur, service_role). États dérivés de project_milestones / gate_evaluations /
        engine_runs / deliverables. Supervision pure — la console n’écrit rien sur ces tables.
      </p>
    </div>
  );
}
