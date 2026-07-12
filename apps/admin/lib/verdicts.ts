/**
 * Libellés et couleurs NEUTRES des verdicts de gate (principe D25 — ne jamais
 * dramatiser, jamais de rouge « échec » ni de vocabulaire de jugement).
 *
 * ⚠️ Table IDENTIQUE à apps/porteur/lib/verdicts.ts et apps/cockpit-b2b/lib/verdicts.ts.
 * (Candidate à une extraction dans packages/ui-kit — hors périmètre coût-neutre JC-07.)
 */
export type Verdict =
  | "validated"
  | "validated_with_reserves"
  | "conditions_not_met"
  | "alternatives_detected"
  | "facts_and_options";

export const VERDICTS: Record<Verdict, { label: string; cls: string }> = {
  validated: {
    label: "Validé",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  validated_with_reserves: {
    label: "Validé avec réserves",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  conditions_not_met: {
    label: "Conditions non réunies",
    cls: "bg-slate-100 text-slate-600 border-slate-300",
  },
  alternatives_detected: {
    label: "Alternatives détectées",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  facts_and_options: {
    label: "Faits & options",
    cls: "bg-slate-100 text-slate-600 border-slate-300",
  },
};

export function verdictMeta(v: string | null | undefined) {
  if (v && v in VERDICTS) return VERDICTS[v as Verdict];
  return { label: "—", cls: "bg-slate-50 text-slate-400 border-slate-200" };
}
