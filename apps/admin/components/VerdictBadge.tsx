import { verdictMeta } from "@/lib/verdicts";

export function VerdictBadge({ verdict }: { verdict: string | null }) {
  const m = verdictMeta(verdict);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
