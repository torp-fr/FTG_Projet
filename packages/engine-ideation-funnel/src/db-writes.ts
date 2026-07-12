/**
 * Écritures/lectures Supabase de l'engine E3. Appelé UNIQUEMENT côté serveur : utilise
 * createFtgServiceClient (clé service_role, bypass RLS) — jamais le client anonyme.
 *
 * E3 N'ÉCRIT PAS dans gate_evaluations. (Helpers db génériques volontairement locaux au
 * package, comme E1/E2 — le pattern factorise le llm-client, pas les writes.)
 */
import { createFtgServiceClient, type FtgClient, type Json } from "@ftg/database";

/** Normalise l'URL Supabase vers l'origine du projet (tolère « /rest/v1 » / slash final). */
export function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/+$/, "");
}

/** Construit un client Supabase service_role depuis l'environnement (serveur only). */
export function createServiceClientFromEnv(): FtgClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) {
    throw new Error("createServiceClientFromEnv: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) manquant.");
  }
  if (!key) {
    throw new Error("createServiceClientFromEnv: SUPABASE_SERVICE_ROLE_KEY manquant.");
  }
  return createFtgServiceClient(normalizeSupabaseUrl(rawUrl), key);
}

/** Lit le founder_profile réel d'un projet (source de l'ancrage Porte B). null si absent. */
export async function readFounderProfile(client: FtgClient, projectId: string) {
  const { data, error } = await client
    .from("founder_profiles")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(`readFounderProfile: ${error.message}`);
  return data;
}

/** structured_data d'un livrable d'idéation (contrat E3). */
export interface IdeationStructuredData {
  idea_cards?: unknown[];
  funnel_journal?: unknown[];
  scoring_matrix?: unknown[];
  selection?: unknown;
  three_ways?: unknown[];
  [key: string]: unknown;
}

export type IdeationDeliverableType = "idea_portfolio" | "selection_brief";

export interface IdeationDeliverableInput {
  projectId: string;
  projectMilestoneId?: string | null;
  engineRunId: string;
  type: IdeationDeliverableType;
  title: string;
  structuredData: IdeationStructuredData;
  sources?: Json;
  pedagogy?: Json;
}

/**
 * Insère un livrable d'idéation dans deliverables (type='idea_portfolio' ou
 * 'selection_brief'). status='delivered' (deliverables_status_check n'autorise pas
 * 'ready' : draft|delivered|enriched|superseded). content_ref null : le markdown est
 * inline dans structured_data.contentMd. version incrémentée par (project_id, type).
 */
export async function writeIdeationDeliverable(client: FtgClient, d: IdeationDeliverableInput) {
  const { data: existing } = await client
    .from("deliverables")
    .select("version")
    .eq("project_id", d.projectId)
    .eq("type", d.type)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (existing?.version ?? 0) + 1;

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
      sources: d.sources ?? [],
      pedagogy: d.pedagogy ?? {},
      status: "delivered",
    })
    .select()
    .single();
  if (error) throw new Error(`writeIdeationDeliverable: ${error.message}`);
  return data;
}

/** Insère un événement dans project_journal (id + created_at générés par la base). */
export async function writeJournalEvent(
  client: FtgClient,
  projectId: string,
  eventType: string,
  digest: string,
  payloadRef: string | null,
  actor: string | null,
) {
  const { data, error } = await client
    .from("project_journal")
    .insert({ project_id: projectId, event_type: eventType, digest, payload_ref: payloadRef, actor })
    .select()
    .single();
  if (error) throw new Error(`writeJournalEvent: ${error.message}`);
  return data;
}

/** Paramètres d'insertion d'un engine_run. */
export interface EngineRunInput {
  projectId: string;
  agentId?: string | null;
  engineVersionId: string;
  taskType: string;
  inputEnvelope: Json;
  inputStructuredValidated: boolean;
  researchDepth: number;
  modelCalls: Json;
  llmChannel: string;
  costEstimate?: number | null;
  outputEnvelopeRef?: string | null;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

/** Insère une trace d'exécution dans engine_runs (id + created_at générés par la base). */
export async function writeEngineRun(client: FtgClient, run: EngineRunInput) {
  const { data, error } = await client
    .from("engine_runs")
    .insert({
      project_id: run.projectId,
      agent_id: run.agentId ?? null,
      engine_version_id: run.engineVersionId,
      task_type: run.taskType,
      input_envelope: run.inputEnvelope,
      input_structured_validated: run.inputStructuredValidated,
      research_depth: run.researchDepth,
      model_calls: run.modelCalls,
      llm_channel: run.llmChannel,
      cost_estimate: run.costEstimate ?? null,
      output_envelope_ref: run.outputEnvelopeRef ?? null,
      status: run.status,
      started_at: run.startedAt ?? null,
      finished_at: run.finishedAt ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`writeEngineRun: ${error.message}`);
  return data;
}
