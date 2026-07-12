import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, type DeliverableView, type PhaseStep } from "@/lib/data";
import { VerdictBadge } from "@/components/VerdictBadge";

export const dynamic = "force-dynamic";

const AMBITION_LABEL: Record<string, string> = {
  complement: "Complément",
  independance: "Indépendance",
  croissance: "Croissance",
  scale: "Scale",
};

const STEP_CLS: Record<PhaseStep["state"], string> = {
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-700",
  available: "border-slate-300 bg-white text-slate-600",
  locked: "border-slate-200 bg-slate-50 text-slate-400",
};
const STEP_LABEL: Record<PhaseStep["state"], string> = {
  done: "Fait",
  in_progress: "En cours",
  available: "Ouvert",
  locked: "Verrouillé",
};

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
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

function DeliverableBody({ d }: { d: DeliverableView }) {
  if (d.type === "match_report") return <MatchReport data={d.data} />;
  if (d.type === "selection_brief") return <SelectionBrief data={d.data} />;
  const md = typeof d.data.contentMd === "string" ? d.data.contentMd : null;
  return md ? <p className="whitespace-pre-wrap text-sm text-slate-600">{md}</p> : <p className="text-sm text-slate-400">—</p>;
}

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(id);
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Cohorte</Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{p.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>{p.ownerName}</span>
          <span>Segment : {p.segment ?? "—"}</span>
          <span>Ambition : {p.ambition ? AMBITION_LABEL[p.ambition] ?? p.ambition : "—"}</span>
          <span>Porte : {p.entryDoor}</span>
          <span>Statut : {p.status}</span>
        </div>
      </div>

      {/* Timeline DAG P0 → P9 */}
      <Section title="Parcours (P0 → P9)">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {p.phases.map((ph) => (
            <div key={ph.code} title={ph.reason ?? STEP_LABEL[ph.state]} className={`flex min-w-[92px] flex-col rounded-md border px-2.5 py-2 ${STEP_CLS[ph.state]}`}>
              <span className="text-xs font-semibold">{ph.code}</span>
              <span className="truncate text-[11px] leading-tight">{ph.name}</span>
              <span className="mt-1 text-[10px] uppercase tracking-wide opacity-70">{STEP_LABEL[ph.state]}</span>
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
                <DeliverableBody d={d} />
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
