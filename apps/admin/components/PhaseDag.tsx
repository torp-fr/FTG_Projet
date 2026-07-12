import type { PhaseNode } from "@/lib/porteur-view";

const JALON_STYLE: Record<string, { label: string; cls: string }> = {
  done: { label: "Fait", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  forced: { label: "Forcé", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "En cours", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  awaiting_proof: { label: "Preuve attendue", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  awaiting_review: { label: "Revue attendue", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  recommended: { label: "Recommandé", cls: "bg-violet-50 text-violet-700 border-violet-300" },
  available: { label: "Disponible", cls: "bg-white text-slate-600 border-slate-300" },
  locked: { label: "Verrouillé", cls: "bg-slate-50 text-slate-400 border-slate-200" },
};
const jalonStyle = (s: string) => JALON_STYLE[s] ?? JALON_STYLE.locked;

const PHASE_HEADER: Record<PhaseNode["state"], string> = {
  done: "text-emerald-700",
  in_progress: "text-blue-700",
  available: "text-slate-700",
  locked: "text-slate-400",
};
const PHASE_TAG: Record<PhaseNode["state"], string> = {
  done: "fait",
  in_progress: "en cours",
  available: "ouvert",
  locked: "verrouillé",
};

export function PhaseDag({ phases }: { phases: PhaseNode[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {phases.map((ph) => (
        <div key={ph.code} className="min-w-[152px] shrink-0 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-baseline justify-between">
            <span className={`text-sm font-semibold ${PHASE_HEADER[ph.state]}`}>{ph.code}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">{PHASE_TAG[ph.state]}</span>
          </div>
          <div className="mb-2 truncate text-xs text-slate-500" title={ph.name}>{ph.name}</div>
          {ph.jalons.length === 0 ? (
            <div className="rounded border border-dashed border-slate-200 px-2 py-1.5 text-[11px] text-slate-400" title={ph.reason}>
              {ph.reason ?? "À venir"}
            </div>
          ) : (
            <ul className="space-y-1">
              {ph.jalons.map((j) => {
                const st = jalonStyle(j.state);
                return (
                  <li
                    key={j.code}
                    title={j.reason ?? st.label}
                    className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${st.cls} ${j.recommended ? "ring-1 ring-violet-300" : ""}`}
                  >
                    <span className="font-medium">{j.code.split("-")[1] ?? j.code}</span>
                    <span className="opacity-80">
                      {st.label}
                      {typeof j.quality === "number" ? ` · ${j.quality}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
