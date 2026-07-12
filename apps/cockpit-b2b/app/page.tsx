import type { ReactNode } from "react";
import Link from "next/link";
import { getCohort } from "@/lib/data";
import { VerdictBadge } from "@/components/VerdictBadge";

export const dynamic = "force-dynamic";

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

export default async function CohortPage() {
  const { rows, kpis, orgName, orgId } = await getCohort();

  if (!orgId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        Organisation « {orgName} » introuvable. Lance d’abord{" "}
        <code className="rounded bg-slate-100 px-1">scripts/seed-demo-cohort.ts</code>.
      </div>
    );
  }

  const byPhase = Object.entries(kpis.byPhase).sort(([a], [b]) => (a < b ? -1 : 1));
  const byVerdict = Object.entries(kpis.byVerdict);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cohorte</h1>
          <p className="text-sm text-slate-500">{orgName}</p>
        </div>
        <a
          href="/api/export"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Exporter CSV
        </a>
      </div>

      {/* Bandeau KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Porteurs" value={kpis.total} />
        <Stat label="À surveiller" value={kpis.watch} hint="V3 bas · gate à surveiller · en pause" />
        <Stat
          label="Par phase"
          value={<span className="text-base font-medium text-slate-700">{byPhase.map(([p, n]) => `${p}·${n}`).join("   ") || "—"}</span>}
        />
        <Stat
          label="Par verdict"
          value={<span className="text-xs font-normal leading-tight text-slate-600">{byVerdict.map(([v, n]) => `${n}× ${v}`).join(" · ")}</span>}
        />
      </div>

      {/* Tableau des porteurs */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Porteur</th>
              <th className="px-4 py-2.5 font-medium">Ambition</th>
              <th className="px-4 py-2.5 font-medium">Porte</th>
              <th className="px-4 py-2.5 font-medium">Phase</th>
              <th className="px-4 py-2.5 font-medium">Dernier verdict</th>
              <th className="px-4 py-2.5 font-medium">V3</th>
              <th className="px-4 py-2.5 font-medium">Livrables</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/projet/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {r.name}
                  </Link>
                  <div className="text-xs text-slate-400">{r.ownerName} · {r.segment ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.ambition ? AMBITION_LABEL[r.ambition] ?? r.ambition : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.entryDoor}</td>
                <td className="px-4 py-3 text-slate-600">{r.currentPhase}</td>
                <td className="px-4 py-3"><VerdictBadge verdict={r.verdict} /></td>
                <td className="px-4 py-3 text-slate-700">{r.v3 ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.nDeliverables}</td>
                <td className="px-4 py-3">
                  {r.watch ? (
                    <span
                      title={r.watchReasons.join(" · ")}
                      className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                    >
                      À surveiller
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Données réelles Supabase (lecture serveur). Livrables produits par les engines E1/E2/E3 ; verdicts calculés par le
        Gatekeeper. L’état de progression des jalons est une donnée de démonstration seedée.
      </p>
    </div>
  );
}
