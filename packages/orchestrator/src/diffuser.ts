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

// ============================================================
// Couche d'ÉCRITURE runtime (JC-05) — serveur uniquement (service_role, bypass RLS).
// Le Diffuser matérialise l'état à partir des sorties d'engine : deliverables (versionné),
// project_milestones (état dérivé, upsert IDEMPOTENT), project_journal, events (socle EOS).
// Client injecté (@ftg/database) — jamais appelé côté client.
// ============================================================
import type { FtgClient, Json } from "@ftg/database";
import type { MilestoneState } from "./types.js";

export interface DeliverableWrite {
  projectId: string;
  engineRunId: string | null;
  projectMilestoneId?: string | null;
  type: string;
  title: string;
  structuredData: Record<string, unknown>;
  sources?: unknown;
  pedagogy?: unknown;
}

/**
 * Écrit un deliverable générique (n'importe quel engine), VERSIONNÉ par (project_id, type).
 * status='delivered'. Idempotent au niveau version : un re-run produit v+1, jamais un doublon
 * de la même version.
 */
export async function writeDeliverableRow(client: FtgClient, d: DeliverableWrite) {
  const { data: existing } = await client
    .from("deliverables")
    .select("version")
    .eq("project_id", d.projectId)
    .eq("type", d.type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((existing as { version: number } | null)?.version ?? 0) + 1;

  const { data, error } = await client
    .from("deliverables")
    .insert({
      project_id: d.projectId,
      project_milestone_id: d.projectMilestoneId ?? null,
      engine_run_id: d.engineRunId,
      type: d.type,
      title: d.title,
      version: nextVersion,
      content_ref: null,
      structured_data: d.structuredData as unknown as Json,
      sources: (d.sources ?? []) as unknown as Json,
      pedagogy: (d.pedagogy ?? {}) as unknown as Json,
      status: "delivered",
    })
    .select()
    .single();
  if (error) throw new Error(`writeDeliverableRow(${d.type}): ${error.message}`);
  return data;
}

const DONE_STATES = new Set<MilestoneState>(["done", "forced"]);

/**
 * Upsert IDEMPOTENT de l'état d'un jalon (contrainte UNIQUE project_id+milestone_id).
 * `opened_at` posé à l'ouverture, `done_at` à l'achèvement (done/forced). Un re-run ne
 * duplique jamais la ligne.
 */
export async function upsertMilestoneState(
  client: FtgClient,
  params: { projectId: string; milestoneId: string; state: MilestoneState; qualityScore?: number | null; forcedReason?: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  const isDone = DONE_STATES.has(params.state);
  const { error } = await client
    .from("project_milestones")
    .upsert(
      {
        project_id: params.projectId,
        milestone_id: params.milestoneId,
        state: params.state,
        quality_score: params.qualityScore ?? null,
        forced_reason: params.forcedReason ?? null,
        opened_at: now,
        done_at: isDone ? now : null,
      },
      { onConflict: "project_id,milestone_id" },
    );
  if (error) throw new Error(`upsertMilestoneState(${params.milestoneId}): ${error.message}`);
}

/** Append au journal de bord (project_journal). */
export async function writeJournal(
  client: FtgClient,
  projectId: string,
  eventType: JournalEventType,
  digest: string,
  actor: string,
  payloadRef: string | null = null,
) {
  const { data, error } = await client
    .from("project_journal")
    .insert({ project_id: projectId, event_type: eventType, digest, payload_ref: payloadRef, actor })
    .select("id")
    .single();
  if (error) throw new Error(`writeJournal: ${error.message}`);
  return data;
}

/** Émet un événement machine (table `events`, socle EOS — aucun consommateur en JC-05). */
export async function emitEvent(
  client: FtgClient,
  params: { projectId: string | null; type: string; payload: Record<string, unknown>; actor: string },
) {
  const { data, error } = await client
    .from("events")
    .insert({ project_id: params.projectId, type: params.type, payload: params.payload as unknown as Json, actor: params.actor })
    .select("id")
    .single();
  if (error) throw new Error(`emitEvent(${params.type}): ${error.message}`);
  return data;
}
