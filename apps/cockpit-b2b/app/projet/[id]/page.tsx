import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, type PhaseStep } from "@/lib/data";
import { Section, VerdictBadge, DeliverableBody } from "@ftg/ui-kit";

export const dynamic = "force-dynamic";

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

// JC-08c — même sémantique que le ui-kit : complétude (done) = accent (bleu d'encre = violet),
// en cours = warn (ambre). Le vert n'est plus une couleur d'étape (réservé au verdict « validé »).
const STEP_CLS: Record<PhaseStep["state"], string> = {
  done: "border-violet-300 bg-violet-50 text-violet-700",
  in_progress: "border-amber-300 bg-amber-50 text-amber-700",
  available: "border-slate-300 bg-white text-slate-600",
  locked: "border-slate-200 bg-slate-50 text-slate-400",
};
const STEP_LABEL: Record<PhaseStep["state"], string> = {
  done: "Fait",
  in_progress: "En cours",
  available: "Ouvert",
  locked: "Verrouillé",
};

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(id);
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Cohorte</Link>
        <h1 className="mt-1 font-display text-xl font-semibold text-slate-900">{p.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>{p.ownerName}</span>
          <span>Segment : {p.segment ?? "—"}</span>
          <span>Ambition : {p.ambition ? AMBITION_LABEL[p.ambition] ?? p.ambition : "—"}</span>
          <span>Porte : {p.entryDoor}</span>
          <span>Statut : {p.status}</span>
        </div>
      </div>

      {/* Timeline DAG P0 → P9 (spécifique cockpit — vue conseiller) */}
      <Section title="Parcours (P0 → P9)">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {p.phases.map((ph) => (
            <div key={ph.code} title={ph.reason ?? STEP_LABEL[ph.state]} className={`flex min-w-[92px] flex-col rounded-md border px-2.5 py-2 ${STEP_CLS[ph.state]}`}>
              <span className="font-mono text-xs font-semibold">{ph.code}</span>
              <span className="truncate text-[11px] leading-tight">{ph.name}</span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-wide opacity-70">{STEP_LABEL[ph.state]}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Gates & verdicts */}
      <Section title="Gates & verdicts">
        {p.gates.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun gate évalué pour l’instant.</p>
        ) : (
          <div className="space-y-4">
            {p.gates.map((g) => (
              <div key={g.code} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{g.code}</span>
                  <VerdictBadge verdict={g.verdict} />
                  <span className="ml-auto text-xs text-slate-400">
                    {Object.entries(g.computedScores).map(([k, v]) => `${k} ${typeof v === "number" ? Math.round(v * 10) / 10 : v}`).join(" · ")}
                  </span>
                </div>
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

      {/* Livrables */}
      <Section title="Livrables">
        {p.deliverables.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun livrable.</p>
        ) : (
          <div className="space-y-4">
            {p.deliverables.map((d) => (
              <div key={d.id} className="rounded-md border border-slate-100 p-4">
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

      {/* Budget Réel — placeholder honnête */}
      <Section title="Registre de Budget Réel" note="à venir">
        <p className="text-sm text-slate-500">
          Registre de Budget Réel — activé au branchement de l’Engine Finance (à venir). Aucun chiffre n’est affiché tant que
          la source budgétaire réelle n’est pas connectée.
        </p>
      </Section>
    </div>
  );
}
