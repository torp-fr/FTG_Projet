/**
 * Diffuser — Chantier 4 §4
 *
 * À chaque événement : génère le digest, l'ajoute au journal
 * (project_journal), met à jour l'état canonique (vue matérialisée). Aucun
 * broadcast brut ; lecture sélective à l'invocation par le Router.
 *
 * Lot 1 : fonctions pures de construction de digest + réduction de l'état
 * canonique à partir d'une liste d'événements (le branchement DB — écriture
 * réelle dans project_journal via service_role — arrive avec le premier
 * engine au Lot 2, car il n'y a rien à journaliser tant qu'aucun run n'existe).
 */

export type JournalEventType = "deliverable" | "gate" | "decision" | "message" | "alert" | "override";

export interface JournalEvent {
  eventType: JournalEventType;
  digest: string;
  payloadRef?: string;
  actor: string;
  createdAt: string;
}

export function buildDigest(eventType: JournalEventType, summary: string): string {
  return `[${eventType}] ${summary}`;
}

/**
 * Réduit une liste d'événements en un état canonique synthétique consommé
 * par le Router (ProjectContext.canonicalState). Réduction naïve V1 : les N
 * digests les plus récents par type d'événement. Affiné au Lot 2/3 avec un
 * vrai résumé structuré (probablement LLM-assisté pour les threads longs).
 */
export function reduceCanonicalState(
  events: JournalEvent[],
  maxPerType = 5
): Record<JournalEventType, string[]> {
  const byType: Record<string, string[]> = {};
  const sorted = [...events].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const e of sorted) {
    if (!byType[e.eventType]) byType[e.eventType] = [];
    if (byType[e.eventType].length < maxPerType) byType[e.eventType].push(e.digest);
  }
  return byType as Record<JournalEventType, string[]>;
}
