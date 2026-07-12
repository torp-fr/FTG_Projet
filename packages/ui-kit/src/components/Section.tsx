import type { ReactNode } from "react";

/** Carte de section (titre + note optionnelle). Source UNIQUE — auparavant inline dans 5+ pages. */
export function Section({ title, children, note, id }: { title: string; children: ReactNode; note?: string; id?: string }) {
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {note ? <span className="text-xs text-slate-400">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}
