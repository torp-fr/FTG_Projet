/**
 * Rendu lisible du structured_data d'un livrable (identique au cockpit) :
 *  - match_report   → composite V3 + scores par dimension + gap map.
 *  - selection_brief → idée retenue + top-3 + journal d'entonnoir.
 */

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-slate-600">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="w-10 shrink-0 text-right text-sm tabular-nums text-slate-700">{value}</div>
    </div>
  );
}

function MatchReport({ data }: { data: Record<string, unknown> }) {
  const scores = (data.v3_scores_by_dimension ?? {}) as Record<string, number>;
  const composite = data.composite_v3 as number | undefined;
  const gaps = (data.gap_map ?? []) as Array<{ dimension?: string; score?: number; reading?: string }>;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Composite V3</span>
        <span className="text-2xl font-semibold text-slate-900">{composite ?? "—"}</span>
      </div>
      <div className="space-y-2">
        {Object.entries(scores).map(([dim, v]) => (
          <ScoreBar key={dim} label={dim} value={Number(v)} />
        ))}
      </div>
      {gaps.length > 0 ? (
        <div>
          <div className="mb-1 text-xs font-medium uppercase text-slate-400">Écarts identifiés</div>
          <ul className="space-y-1 text-sm text-slate-600">
            {gaps.map((g, i) => (
              <li key={i}>
                <span className="font-medium text-slate-700">{g.dimension}</span>
                {typeof g.score === "number" ? ` (${g.score})` : ""} — {g.reading}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SelectionBrief({ data }: { data: Record<string, unknown> }) {
  const selection = (data.selection ?? {}) as { chosen?: string; rationale?: string; top3?: Array<{ idea?: string; score?: number; rationale?: string }> };
  const journal = (data.funnel_journal ?? []) as Array<{ decision?: string; idea?: string; motivation?: string }>;
  return (
    <div className="space-y-4">
      {selection.chosen ? (
        <div>
          <div className="text-xs font-medium uppercase text-slate-400">Idée retenue</div>
          <div className="font-medium text-slate-900">{selection.chosen}</div>
          {selection.rationale ? <p className="mt-1 text-sm text-slate-600">{selection.rationale}</p> : null}
        </div>
      ) : null}
      {selection.top3 && selection.top3.length > 0 ? (
        <div>
          <div className="mb-1 text-xs font-medium uppercase text-slate-400">Top 3 comparé</div>
          <ul className="space-y-1 text-sm text-slate-600">
            {selection.top3.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">{i + 1}.</span>
                <span className="font-medium text-slate-700">{t.idea}</span>
                {typeof t.score === "number" ? <span className="text-slate-400">({t.score})</span> : null}
                <span className="text-slate-500">— {t.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {journal.length > 0 ? (
        <div>
          <div className="mb-1 text-xs font-medium uppercase text-slate-400">Journal d’entonnoir</div>
          <ul className="space-y-1 text-sm text-slate-600">
            {journal.map((j, i) => (
              <li key={i}>
                <span className={`mr-2 rounded px-1.5 py-0.5 text-xs ${j.decision === "eliminated" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                  {j.decision === "eliminated" ? "écartée" : "conservée"}
                </span>
                <span className="font-medium text-slate-700">{j.idea}</span> — {j.motivation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function DeliverableBody({ deliverable }: { deliverable: { type: string; data: Record<string, unknown> } }) {
  if (deliverable.type === "match_report") return <MatchReport data={deliverable.data} />;
  if (deliverable.type === "selection_brief") return <SelectionBrief data={deliverable.data} />;
  const md = typeof deliverable.data.contentMd === "string" ? deliverable.data.contentMd : null;
  return md ? <p className="whitespace-pre-wrap text-sm text-slate-600">{md}</p> : <p className="text-sm text-slate-400">—</p>;
}
