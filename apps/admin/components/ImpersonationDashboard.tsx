import type { ReactNode } from "react";
import type { PorteurView } from "@/lib/porteur-view";
import { PhaseDag } from "@/components/PhaseDag";
import { DeliverableBody } from "@/components/DeliverableBody";
import { VerdictBadge } from "@/components/VerdictBadge";

/**
 * Rendu READ-ONLY du dashboard porteur (« voir-comme ») — reproduit apps/porteur/Dashboard.
 * Aucune interaction : l'opérateur observe, il n'agit sur rien.
 */

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {note ? <span className="text-xs text-slate-400">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function ImpersonationDashboard({ view }: { view: PorteurView }) {
  const { project, progression, phases, gates, deliverables, agents, mantra } = view;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>{project.ownerName}</span>
          <span>Segment : {project.segment ?? "—"}</span>
          <span>Ambition : {project.ambition ? AMBITION_LABEL[project.ambition] ?? project.ambition : "—"}</span>
          <span>Porte : {project.entryDoor}</span>
        </div>
        {mantra ? <p className="mt-2 text-sm italic text-slate-600">« {mantra} »</p> : null}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="sm:w-56">
            <div className="text-4xl font-semibold text-slate-900">{progression.pct}%</div>
            <div className="mt-1 text-sm text-slate-500">de mon parcours ({progression.doneCount}/{progression.seededCount} jalons validés)</div>
            <div className="mt-1 text-sm text-slate-600">
              Phase courante : <span className="font-medium">{progression.currentPhase}</span> — {progression.currentPhaseName}
            </div>
          </div>
          <div className="flex-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progression.pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              {phases.map((ph) => (
                <span key={ph.code} className={ph.code === progression.currentPhase ? "font-semibold text-slate-700" : ""}>{ph.code}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section title="Mon parcours (P0 → P9)" note="chemin recommandé surligné">
        <PhaseDag phases={phases} />
      </Section>

      <Section title="Le Board — mes agents">
        <div className="grid gap-3 sm:grid-cols-3">
          {agents.map((a) => (
            <div key={a.code} className="rounded-md border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{a.persona}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">Actif</span>
              </div>
              <div className="text-xs text-slate-400">{a.code}</div>
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
      </Section>

      <Section title="Mes livrables (le coffre)">
        {deliverables.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun livrable.</p>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <div key={d.id} id={`deliverable-${d.id}`} className="scroll-mt-4 rounded-md border border-slate-100 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{d.title}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{d.type}</span>
                  <span className="text-xs text-slate-400">v{d.version} · {d.status} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <DeliverableBody deliverable={{ type: d.type, data: d.data }} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Gates & verdicts">
        {gates.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun gate évalué pour l’instant.</p>
        ) : (
          <div className="space-y-4">
            {gates.map((g) => (
              <div key={g.code} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{g.code}</span>
                  <VerdictBadge verdict={g.verdict} />
                  <span className="ml-auto text-xs text-slate-400">
                    {Object.entries(g.computedScores).map(([k, v]) => `${k} ${typeof v === "number" ? Math.round(v * 10) / 10 : v}`).join(" · ")}
                  </span>
                </div>
                {g.reserves.length > 0 ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium uppercase text-slate-400">Réserves ouvertes</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {g.reserves.map((r, i) => (
                        <li key={i}>{r.vector ? <span className="font-medium text-slate-700">{r.vector} — </span> : null}{r.detail}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
