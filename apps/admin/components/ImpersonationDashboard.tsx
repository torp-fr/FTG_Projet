import type { PorteurView } from "@/lib/porteur-view";
import { Section, ProgressHero, PhaseDag, AgentBoard, DeliverableBody, VerdictBadge } from "@ftg/ui-kit";

/**
 * Rendu READ-ONLY du dashboard porteur (« voir-comme ») — reproduit apps/porteur/Dashboard
 * via les composants ui-kit partagés (JC-09). Aucune interaction : l'opérateur observe.
 */

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

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

      <ProgressHero
        pct={progression.pct}
        doneCount={progression.doneCount}
        seededCount={progression.seededCount}
        currentPhase={progression.currentPhase}
        currentPhaseName={progression.currentPhaseName}
        phaseCodes={phases.map((ph) => ph.code)}
      />

      <Section title="Mon parcours (P0 → P9)" note="chemin recommandé surligné">
        <PhaseDag phases={phases} />
      </Section>

      <Section title="Le Board — mes agents">
        <AgentBoard agents={agents} />
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
