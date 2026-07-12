import "server-only";
import type { Json } from "@ftg/database";
import { getServiceClient } from "./supabase";
import { getOperator } from "./operator";

/**
 * Écriture / lecture de l'audit trail opérateur (`admin_audit_log`).
 *
 * La table est APPEND-ONLY et IMMUABLE côté base (trigger anti UPDATE/DELETE/TRUNCATE, cf.
 * migration 012) : ce module ne peut donc qu'INSÉRER. Chaque acte opérateur (impersonation,
 * promotion/refus/rollback de version, provisioning) passe par `writeAudit` — impossible d'agir
 * sans trace. Service_role uniquement (RLS deny-by-default pour le client).
 */
export type AuditAction =
  | "impersonation.start"
  | "impersonation.view"
  | "impersonation.end"
  | "version.promote"
  | "version.promote_refused"
  | "version.rollback"
  | "account.provision";

export interface AuditInput {
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  details?: Record<string, unknown>;
}

export interface AuditRow {
  id: string;
  createdAt: string;
  actorLabel: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  details: Record<string, unknown>;
}

/** Insère une ligne d'audit horodatée, opérateur identifié. Lève si l'écriture échoue (fail-closed). */
export async function writeAudit(input: AuditInput): Promise<{ id: string; created_at: string }> {
  const c = getServiceClient();
  const op = getOperator();
  const { data, error } = await c
    .from("admin_audit_log")
    .insert({
      actor_user_id: null,
      actor_label: op.label,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      target_label: input.targetLabel ?? null,
      details: (input.details ?? {}) as unknown as Json,
    })
    .select("id, created_at")
    .single();
  if (error) throw new Error(`writeAudit(${input.action}): ${error.message}`);
  return data as { id: string; created_at: string };
}

function mapRow(r: Record<string, unknown>): AuditRow {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    actorLabel: r.actor_label as string,
    action: r.action as string,
    targetType: (r.target_type as string | null) ?? null,
    targetId: (r.target_id as string | null) ?? null,
    targetLabel: (r.target_label as string | null) ?? null,
    details: (r.details as Record<string, unknown>) ?? {},
  };
}

export async function readRecentAudit(limit = 200): Promise<AuditRow[]> {
  const c = getServiceClient();
  const { data } = await c
    .from("admin_audit_log")
    .select("id, created_at, actor_label, action, target_type, target_id, target_label, details")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
}

export async function readAuditForTarget(targetType: string, targetId: string, limit = 100): Promise<AuditRow[]> {
  const c = getServiceClient();
  const { data } = await c
    .from("admin_audit_log")
    .select("id, created_at, actor_label, action, target_type, target_id, target_label, details")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
}
