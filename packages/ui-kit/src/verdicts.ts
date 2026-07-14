/**
 * Libellés et couleurs NEUTRES des verdicts de gate (principe D25 — ne jamais dramatiser,
 * jamais de rouge « échec » ni de vocabulaire de jugement).
 *
 * Source UNIQUE (JC-09) — auparavant dupliquée dans apps/porteur, apps/cockpit-b2b, apps/admin.
 */
export type Verdict =
  | "validated"
  | "validated_with_reserves"
  | "conditions_not_met"
  | "alternatives_detected"
  | "facts_and_options";

// JC-08c — badge de verdict en OUTLINE : bordure + texte à la couleur de l'état, fond
// transparent (posé par VerdictBadge). Le vert reste réservé au verdict « validé » ;
// « alternatives détectées » garde l'accent (bleu d'encre = violet). Aucune 2e teinte.
export const VERDICTS: Record<Verdict, { label: string; cls: string }> = {
  validated: {
    label: "Validé",
    cls: "border-emerald-300 text-emerald-700",
  },
  validated_with_reserves: {
    label: "Validé avec réserves",
    cls: "border-amber-300 text-amber-700",
  },
  conditions_not_met: {
    label: "Conditions non réunies",
    cls: "border-slate-300 text-slate-600",
  },
  alternatives_detected: {
    label: "Alternatives détectées",
    cls: "border-violet-300 text-violet-700",
  },
  facts_and_options: {
    label: "Faits & options",
    cls: "border-slate-300 text-slate-600",
  },
};

export function verdictMeta(v: string | null | undefined) {
  if (v && v in VERDICTS) return VERDICTS[v as Verdict];
  return { label: "—", cls: "border-slate-200 text-slate-400" };
}
