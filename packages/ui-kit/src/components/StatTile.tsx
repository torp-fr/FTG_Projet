import type { ReactNode } from "react";

/** Tuile KPI (valeur + label + indice). Source UNIQUE — auparavant `Stat` inline dans cockpit + admin. */
export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="font-display text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
