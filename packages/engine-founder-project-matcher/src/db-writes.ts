/**
 * Écritures/lectures Supabase de l'engine E2. Appelé UNIQUEMENT côté serveur : utilise
 * createFtgServiceClient (clé service_role, bypass RLS) — jamais le client anonyme.
 *
 * E2 N'ÉCRIT PAS dans gate_evaluations : la contribution V3 est produite dans le
 * deliverable + journalisée ; elle est CONSOMMÉE par le Gatekeeper au moment de
 * l'évaluation d'un gate (branchement hors E2).
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

/**
 * Lit le founder_profile réel d'un projet (source de l'incarnation pour le scoring V3).
 * Retourne null si aucun profil n'existe encore.
 */
export async function readFounderProfile(client: FtgClient, projectId: string) {
  const { data, error } = await client
    .from("founder_profiles")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(`readFounderProfile: ${error.message}`);
  return data;
}

/** structured_data d'un match_report (contrat E2). */
export interface MatchStructuredData {
  v3_scores_by_dimension: Record<string, number>;
  gap_map: unknown[];
  bridging_plans: unknown[];
  composite_v3: number;
  [key: string]: unknown;
}

export interface MatchDeliverableInput {
  projectId: string;
  projectMilestoneId?: string | null;
  engineRunId: string;
  title: string;
  structuredData: MatchStructuredData;
  sources?: Json;
  pedagogy?: Json;
}

/**
 * Insère le livrable de matching dans deliverables (type='match_report').
 * content_ref reste null : le markdown est stocké inline dans structured_data.contentMd.
 * version : incrémentée par (project_id, type='match_report'), commence à 1.
 *
 * NB statut : deliverables_status_check n'autorise que draft|delivered|enriched|superseded.
 * On écrit donc 'delivered' (livrable produit) plutôt que 'ready' (non autorisé en base).
 */
export async function writeMatchDeliverable(client: FtgClient, d: MatchDeliverableInput) {
  const { data: existing } = await client
    .from("deliverables")
    .select("version")
    .eq("project_id", d.projectId)
    .eq("type", "match_report")
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
      type: "match_report",
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
  if (error) throw new Error(`writeMatchDeliverable: ${error.message}`);
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
    .insert({
      project_id: projectId,
      event_type: eventType,
      digest,
      payload_ref: payloadRef,
      actor,
    })
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
