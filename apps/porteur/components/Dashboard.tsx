import type { ReactNode } from "react";
import { getPorteurDashboard } from "@/lib/data";
import { Section, ProgressHero, PhaseDag, AgentBoard, DeliverableBody, VerdictBadge } from "@ftg/ui-kit";

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

function Stub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        <span className="text-xs text-slate-400">v1 — à enrichir</span>
      </div>
      <div className="text-sm text-slate-500">{children}</div>
    </section>
  );
}

export async function Dashboard({ projectId }: { projectId: string }) {
  const d = await getPorteurDashboard(projectId);
  if (!d) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Projet introuvable.</div>;
  }
  const { project, progression, phases, gates, deliverables, agents, mantra } = d;

  return (
    <div className="space-y-6">
      {/* En-tête projet */}
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

      {/* Héros — « le verre d'eau » */}
      <ProgressHero
        pct={progression.pct}
        doneCount={progression.doneCount}
        seededCount={progression.seededCount}
        currentPhase={progression.currentPhase}
        currentPhaseName={progression.currentPhaseName}
        phaseCodes={phases.map((ph) => ph.code)}
      />

      {/* 1. Mon parcours (DAG jalons) */}
      <Section title="Mon parcours (P0 → P9)" note="chemin recommandé surligné">
        <PhaseDag phases={phases} />
      </Section>

      {/* 2. Le Board (agents actifs) */}
      <Section title="Le Board — mes agents">
        <AgentBoard agents={agents} />
        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          Objectifs OKR — activés au branchement de l’orchestrateur (aucun OKR fabriqué en v1).
        </div>
      </Section>

      {/* 3. Mes livrables (le coffre) */}
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
                <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">Chat de feedback sur ce livrable — à venir.</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 4. Gates & verdicts */}
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
                {g.solutionPaths.length > 0 ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium uppercase text-slate-400">Options (faits + chemins, pas un jugement)</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {g.solutionPaths.map((sp, i) => (
                        <li key={i}>
                          <span className="font-medium text-slate-700">{sp.title}</span>
                          {sp.description ? <span> — {sp.description}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Stubs honnêtes */}
      <Stub title="Budget Réel">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Obligatoire", "Recommandé", "Alternative"].map((col) => (
            <div key={col} className="rounded-md border border-dashed border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500">{col}</div>
              <div className="mt-1 text-xs text-slate-400">—</div>
            </div>
          ))}
        </div>
        <p className="mt-3">Registre de Budget Réel — activé au branchement de l’Engine Finance. Aucun chiffre n’est affiché tant que la source budgétaire réelle n’est pas connectée.</p>
      </Stub>

      <div className="grid gap-6 sm:grid-cols-2">
        <Stub title="Pédagogie">Modules et quiz (3 niveaux) — à venir.</Stub>
        <Stub title="Actions &amp; CRM">Tâches, contacts et suivi — à venir.</Stub>
        <Stub title="Alertes">Veille et signaux du projet — à venir.</Stub>
        <Stub title="Consommation / quotas">Suivi de la consommation LLM et des quotas — à venir.</Stub>
      </div>

      <p className="text-xs text-slate-400">
        Données réelles Supabase (lecture serveur). Livrables produits par les agents E1/E2/E3, verdicts calculés par le Gatekeeper.
        L’état de progression des jalons est une donnée de démonstration seedée.
      </p>
    </div>
  );
}
