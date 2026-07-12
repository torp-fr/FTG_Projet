import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectSupervision } from "@/lib/data";
import { VerdictBadge } from "@/components/VerdictBadge";
import { StateBadge, RunStatusBadge } from "@/components/StateBadge";
import { fmtDateTime, fmtCost } from "@/lib/format";

export const dynamic = "force-dynamic";

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

export default async function ProjectSupervisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProjectSupervision(id);
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Supervision</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{p.name}</h1>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{p.status}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>{p.ownerName}</span>
          <span>Org : {p.orgName ?? "—"}</span>
          <span>Segment : {p.segment ?? "—"}</span>
          <span>Ambition : {p.ambition ? AMBITION_LABEL[p.ambition] ?? p.ambition : "—"}</span>
          <span>Porte : {p.entryDoor}</span>
          <span>Phase courante : <span className="font-medium text-slate-700">{p.currentPhase}</span></span>
        </div>
      </div>

      {/* Progression */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-semibold text-slate-900">{p.progression.pct}%</div>
          <div className="flex-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${p.progression.pct}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-500">{p.progression.doneCount}/{p.progression.seededCount} jalons validés</div>
          </div>
        </div>
      </section>

      {/* Jalons (states dérivés) */}
      <Section title="Jalons (project_milestones — états dérivés)" note={`${p.jalons.length} jalons`}>
        {p.jalons.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun jalon instancié.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-1.5 pr-4 font-medium">Jalon</th>
                  <th className="py-1.5 pr-4 font-medium">Phase</th>
                  <th className="py-1.5 pr-4 font-medium">État</th>
                  <th className="py-1.5 pr-4 font-medium">Qualité</th>
                  <th className="py-1.5 pr-4 font-medium">Terminé</th>
                  <th className="py-1.5 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.jalons.map((j) => (
                  <tr key={j.code}>
                    <td className="py-1.5 pr-4 font-mono text-xs text-slate-700">{j.code}</td>
                    <td className="py-1.5 pr-4 text-slate-500">{j.phase}</td>
                    <td className="py-1.5 pr-4"><StateBadge state={j.state} /></td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{j.quality ?? "—"}</td>
                    <td className="py-1.5 pr-4 text-xs text-slate-400">{fmtDateTime(j.doneAt)}</td>
                    <td className="py-1.5 text-xs text-slate-500">{j.forcedReason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Gates & verdicts + réserves */}
      <Section title="Gates & verdicts (gate_evaluations)">
        {p.gates.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun gate évalué.</p>
        ) : (
          <div className="space-y-4">
            {p.gates.map((g) => (
              <div key={g.code} className="rounded-md border border-slate-100 p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-slate-900">{g.code}</span>
                  <VerdictBadge verdict={g.verdict} />
                  <span className="text-xs text-slate-400">{fmtDateTime(g.evaluatedAt)}</span>
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
                    <div className="text-xs font-medium uppercase text-slate-400">Options (faits + chemins)</div>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {g.solutionPaths.map((sp, i) => (
                        <li key={i}><span className="font-medium text-slate-700">{sp.title}</span>{sp.description ? <span> — {sp.description}</span> : null}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Engine runs : coût / tokens / quality_self */}
      <Section title="Runs d’engines (engine_runs — coût / tokens / qualité)" note={`${p.runs.length} runs`}>
        {p.runs.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun run.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-1.5 pr-4 font-medium">Engine</th>
                  <th className="py-1.5 pr-4 font-medium">Tâche</th>
                  <th className="py-1.5 pr-4 font-medium">Statut</th>
                  <th className="py-1.5 pr-4 font-medium">Qualité</th>
                  <th className="py-1.5 pr-4 font-medium">Appels</th>
                  <th className="py-1.5 pr-4 font-medium">Tokens</th>
                  <th className="py-1.5 pr-4 font-medium">Coût</th>
                  <th className="py-1.5 pr-4 font-medium">Prof.</th>
                  <th className="py-1.5 font-medium">Fini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {p.runs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-4 font-medium text-slate-700">{r.engineCode}</td>
                    <td className="py-1.5 pr-4 text-slate-500">{r.taskType}</td>
                    <td className="py-1.5 pr-4"><RunStatusBadge status={r.status} /></td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{r.qualitySelf ?? "—"}</td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{r.modelCalls}</td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{r.tokens || "—"}</td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{fmtCost(r.costEstimate)}</td>
                    <td className="py-1.5 pr-4 tabular-nums text-slate-600">{r.researchDepth}</td>
                    <td className="py-1.5 text-xs text-slate-400">{fmtDateTime(r.finishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Livrables (résumé) */}
      <Section title="Livrables (deliverables)" note={`${p.deliverables.length}`}>
        {p.deliverables.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun livrable.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {p.deliverables.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{d.title}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{d.type}</span>
                <span className="text-xs text-slate-400">v{d.version} · {d.status} · {fmtDateTime(d.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Journal + events (deux colonnes) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Journal de bord (project_journal)" note={`${p.journal.length}`}>
          {p.journal.length === 0 ? (
            <p className="text-sm text-slate-400">Vide.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.journal.map((j) => (
                <li key={j.id} className="border-l-2 border-slate-100 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">{j.eventType}</span>
                    <span className="text-xs text-slate-400">{fmtDateTime(j.createdAt)}</span>
                    {j.actor ? <span className="text-xs text-slate-400">· {j.actor}</span> : null}
                  </div>
                  <div className="mt-0.5 text-slate-600">{j.digest}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Événements machine (events — socle EOS)" note={`${p.events.length}`}>
          {p.events.length === 0 ? (
            <p className="text-sm text-slate-400">Vide.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {p.events.map((e) => (
                <li key={e.id} className="border-l-2 border-slate-100 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-700">{e.type}</span>
                    <span className="text-xs text-slate-400">{fmtDateTime(e.createdAt)}</span>
                    {e.actor ? <span className="text-xs text-slate-400">· {e.actor}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
