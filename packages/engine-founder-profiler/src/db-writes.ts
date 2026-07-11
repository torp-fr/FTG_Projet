/**
 * Écritures Supabase de l'engine E1. Appelé UNIQUEMENT côté serveur : utilise
 * createFtgServiceClient (clé service_role, bypass RLS) — jamais le client anonyme.
 */
import { createFtgServiceClient, type FtgClient, type Json } from "@ftg/database";

/** Champs du profil fondateur écrits dans founder_profiles. */
export interface FounderProfileData {
  competencies?: unknown;
  resources?: unknown;
  constraints?: unknown;
  risk_appetite?: string | null;
  intrinsic_nature?: unknown;
  mantra?: string | null;
  internal_objectives?: unknown;
  builder_vs_opportunist_reading?: string | null;
  engagement?: unknown;
  validated_at?: string | null;
}

/**
 * Normalise l'URL Supabase vers l'ORIGINE du projet (ce qu'attend supabase-js).
 * Tolère les configurations où l'URL colle déjà le chemin PostgREST « /rest/v1 » ou un
 * slash final (sinon la requête part sur « /rest/v1//rest/v1/… » → « Invalid path »).
 */
export function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/+$/, "");
}

/**
 * Construit un client Supabase service_role depuis l'environnement.
 * Ne JAMAIS instancier côté navigateur.
 */
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
 * Upsert (on conflict project_id) du profil fondateur. La version est incrémentée à
 * chaque mise à jour (lecture de la version courante puis +1).
 */
export async function writeFounderProfile(
  client: FtgClient,
  projectId: string,
  profile: FounderProfileData,
) {
  const { data: existing } = await client
    .from("founder_profiles")
    .select("version")
    .eq("project_id", projectId)
    .maybeSingle();
  const nextVersion = (existing?.version ?? 0) + 1;

  const row = {
    project_id: projectId,
    competencies: (profile.competencies ?? {}) as Json,
    resources: (profile.resources ?? {}) as Json,
    constraints: (profile.constraints ?? {}) as Json,
    risk_appetite: profile.risk_appetite ?? null,
    intrinsic_nature: (profile.intrinsic_nature ?? {}) as Json,
    mantra: profile.mantra ?? null,
    internal_objectives: (profile.internal_objectives ?? {}) as Json,
    builder_vs_opportunist_reading: profile.builder_vs_opportunist_reading ?? null,
    engagement: (profile.engagement ?? {}) as Json,
    version: nextVersion,
    validated_at: profile.validated_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("founder_profiles")
    .upsert(row, { onConflict: "project_id" })
    .select()
    .single();
  if (error) throw new Error(`writeFounderProfile: ${error.message}`);
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
