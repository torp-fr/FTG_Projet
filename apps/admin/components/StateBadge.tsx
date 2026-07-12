const STATE_CLS: Record<string, string> = {
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
  forced: "border-emerald-300 bg-emerald-50 text-emerald-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-700",
  awaiting_proof: "border-blue-300 bg-blue-50 text-blue-700",
  awaiting_review: "border-blue-300 bg-blue-50 text-blue-700",
  recommended: "border-slate-300 bg-white text-slate-700",
  available: "border-slate-300 bg-white text-slate-600",
  locked: "border-slate-200 bg-slate-50 text-slate-400",
};
const STATE_LABEL: Record<string, string> = {
  done: "Fait",
  forced: "Forcé",
  in_progress: "En cours",
  awaiting_proof: "Preuve attendue",
  awaiting_review: "Revue attendue",
  recommended: "Recommandé",
  available: "Ouvert",
  locked: "Verrouillé",
};

/** Badge d'état de jalon (project_milestones.state) — palette neutre, réutilise le design system. */
export function StateBadge({ state }: { state: string }) {
  const cls = STATE_CLS[state] ?? "border-slate-200 bg-slate-50 text-slate-400";
  const label = STATE_LABEL[state] ?? state;
  return <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-xs ${cls}`}>{label}</span>;
}

/** Badge de statut de run (engine_runs.status). */
export function RunStatusBadge({ status }: { status: string }) {
  const cls =
    status === "done"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : status === "failed"
        ? "border-rose-300 bg-rose-50 text-rose-700"
        : status === "running" || status === "queued" || status === "awaiting_user"
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-500";
  return <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-xs ${cls}`}>{status}</span>;
}
