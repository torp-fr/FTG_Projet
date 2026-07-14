import type { AgentView } from "../types";

/**
 * Grille des agents du Board (persona, état, livrables). Source UNIQUE (JC-09) — auparavant
 * dupliquée porteur (Dashboard) + admin (ImpersonationDashboard). À placer dans une Section.
 */
export function AgentBoard({ agents }: { agents: AgentView[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {agents.map((a) => (
        <div key={a.code} className="rounded-md border border-slate-100 p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{a.persona}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">Actif</span>
          </div>
          <div className="font-mono text-xs text-slate-400">{a.code}</div>
          <div className="mt-1 text-xs text-slate-500">
            {a.runsCount > 0 ? `${a.runsCount} exécution(s) · dernier run : ${a.latestRunStatus ?? "—"}` : "en veille"}
          </div>
          {a.outputs.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {a.outputs.map((o, i) => (
                <li key={i}>
                  {o.deliverableId ? (
                    <a href={`#deliverable-${o.deliverableId}`} className="text-slate-600 hover:text-slate-900 hover:underline">↳ {o.label}</a>
                  ) : (
                    <span className="text-slate-500">↳ {o.label}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-xs text-slate-400">Aucun livrable pour ce projet.</div>
          )}
        </div>
      ))}
    </div>
  );
}
