/**
 * Le « verre d'eau » : jauge de progression du parcours + phases P0→P9.
 * Source UNIQUE (JC-09) — auparavant dupliquée porteur (Dashboard) + admin (ImpersonationDashboard).
 */
export function ProgressHero({
  pct,
  doneCount,
  seededCount,
  currentPhase,
  currentPhaseName,
  phaseCodes,
}: {
  pct: number;
  doneCount: number;
  seededCount: number;
  currentPhase: string;
  currentPhaseName: string;
  phaseCodes: string[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="sm:w-56">
          <div className="text-4xl font-semibold text-slate-900">{pct}%</div>
          <div className="mt-1 text-sm text-slate-500">de mon parcours ({doneCount}/{seededCount} jalons validés)</div>
          <div className="mt-1 text-sm text-slate-600">
            Phase courante : <span className="font-medium">{currentPhase}</span> — {currentPhaseName}
          </div>
        </div>
        <div className="flex-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {phaseCodes.map((code) => (
              <span key={code} className={code === currentPhase ? "font-semibold text-slate-700" : ""}>{code}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
