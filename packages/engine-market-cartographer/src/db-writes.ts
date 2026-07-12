/**
 * Écritures/lectures Supabase de l'engine E4. Serveur uniquement (createFtgServiceClient).
 * E4 N'ÉCRIT PAS dans gate_evaluations. Helpers db locaux au package (pattern E1/E2/E3/E5 :
 * seuls le llm-client et la couche data-sources sont factorisés).
 */
import { createFtgServiceClient, type FtgClient, type Json } from "@ftg/database";

export function normalizeSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
}

export function createServiceClientFromEnv(): FtgClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl) throw new Error("createServiceClientFromEnv: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) manquant.");
  if (!key) throw new Error("createServiceClientFromEnv: SUPABASE_SERVICE_ROLE_KEY manquant.");
  return createFtgServiceClient(normalizeSupabaseUrl(rawUrl), key);
}

/** Contexte projet utile à E4 : segment + idée retenue (selection_brief) + lentilles géo. */
export async function readProjectForE4(
  client: FtgClient,
  projectId: string,
): Promise<{ segment: string | null; idea: string | null; geoLenses: string[] }> {
  const { data: proj } = await client
    .from("projects")
    .select("segment_primary_id, geo_lenses")
    .eq("id", projectId)
    .maybeSingle();
  const p = proj as { segment_primary_id: string | null; geo_lenses: string[] | null } | null;

  let segment: string | null = null;
  const segId = p?.segment_primary_id ?? null;
  if (segId) {
    const { data: seg } = await client.from("segments").select("name").eq("id", segId).maybeSingle();
    segment = (seg as { name: string } | null)?.name ?? null;
  }

  const { data: del } = await client
    .from("deliverables")
    .select("structured_data")
    .eq("project_id", projectId)
    .eq("type", "selection_brief")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sd = (del as { structured_data: { selection?: { chosen?: string } } | null } | null)?.structured_data ?? null;

  return { segment, idea: sd?.selection?.chosen ?? null, geoLenses: p?.geo_lenses ?? [] };
}

export interface MarketStudyInput {
  projectId: string;
  projectMilestoneId?: string | null;
  engineRunId: string;
  title: string;
  structuredData: Record<string, unknown>;
  sources?: Json;
  pedagogy?: Json;
}

/**
 * Insère l'étude de marché (type='market_study', status='delivered' — 'ready' interdit
 * par deliverables_status_check). version incrémentée par (project_id, type).
 */
export async function writeMarketStudy(client: FtgClient, d: MarketStudyInput) {
  const { data: existing } = await client
    .from("deliverables")
    .select("version")
    .eq("project_id", d.projectId)
    .eq("type", "market_study")
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
      type: "market_study",
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
  if (error) throw new Error(`writeMarketStudy: ${error.message}`);
  return data;
}

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
