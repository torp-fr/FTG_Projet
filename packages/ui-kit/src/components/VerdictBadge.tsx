import { verdictMeta } from "../verdicts";

export function VerdictBadge({ verdict }: { verdict: string | null }) {
  const m = verdictMeta(verdict);
  // JC-08c — outline : bordure + texte à la couleur de l'état, fond transparent, pastille ● en tête.
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span aria-hidden="true" className="text-[0.7em] leading-none">●</span>
      {m.label}
    </span>
  );
}
