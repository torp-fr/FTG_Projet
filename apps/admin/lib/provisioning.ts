import "server-only";
import type { Json } from "@ftg/database";
import { getServiceClient } from "./supabase";
import { writeAudit } from "./audit";

/**
 * Provisioning de comptes pilotes B2B2C (Étape 4 JC-07).
 *
 * L'opérateur crée un compte pilote (users) + son parcours (projects) avec un niveau d'accès
 * configurable (freemium / partiel / complet), rattaché à une organisation (incubateur/CCI)
 * pour le cockpit B2B, ou en B2C direct (sans org). Chaque création est tracée (audit).
 * L'accès (visibilité) est reflété par les RLS existantes (owner + membres org) ; le niveau
 * d'accès (portée) est additif (colonne projects.access_level, cf. migration 014).
 */

export type AccessLevel = "freemium" | "partiel" | "complet";
export const ACCESS_LEVELS: AccessLevel[] = ["freemium", "partiel", "complet"];
export const ACCESS_LABEL: Record<AccessLevel, string> = {
  freemium: "Freemium (P0 gratuit)",
  partiel: "Partiel (périmètre sélectionné)",
  complet: "Complet",
};

export interface OrgOption { id: string; name: string; type: string | null }
export interface SegmentOption { id: string; name: string }

export async function getOrgOptions(): Promise<OrgOption[]> {
  const c = getServiceClient();
  const { data } = await c.from("organizations").select("id, name, type").order("name");
  return ((data ?? []) as Array<{ id: string; name: string; type: string | null }>).map((o) => ({ id: o.id, name: o.name, type: o.type }));
}

export async function getSegmentOptions(): Promise<SegmentOption[]> {
  const c = getServiceClient();
  const { data } = await c.from("segments").select("id, name").order("name");
  return ((data ?? []) as Array<{ id: string; name: string }>).map((s) => ({ id: s.id, name: s.name }));
}

export interface ProvisionInput {
  name: string;
  email: string;
  orgId: string | null;
  entryDoor: "A" | "B";
  accessLevel: AccessLevel;
  scopePhases: string[]; // pour 'partiel'
  projectName: string;
  segmentId: string | null;
}

export interface ProvisionResult {
  userId: string;
  projectId: string;
  accessLevel: AccessLevel;
}

/** Crée le compte pilote (user) + son parcours (project) et trace la création (audit). */
export async function provisionAccount(input: ProvisionInput): Promise<ProvisionResult> {
  const c = getServiceClient();

  // Référentiel actif (projects.ref_version_id NOT NULL — comme les scripts de seed/smoke).
  const { data: refv, error: refErr } = await c
    .from("referential_versions")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (refErr || !refv) throw new Error(`provisionAccount: référentiel actif introuvable (${refErr?.message ?? ""})`);
  const refVersionId = (refv as { id: string }).id;

  // 1. Compte pilote (users.profile jsonb)
  const { data: user, error: uErr } = await c
    .from("users")
    .insert({ profile: { name: input.name, email: input.email, note: "compte pilote provisionné (JC-07)", access_level: input.accessLevel } as unknown as Json })
    .select("id")
    .single();
  if (uErr || !user) throw new Error(`provisionAccount: création user échouée (${uErr?.message ?? ""})`);
  const userId = user.id as string;

  // 2. Parcours (project) avec niveau d'accès. access_scope = phases pour 'partiel'.
  const accessScope = input.accessLevel === "partiel" ? { phases: input.scopePhases } : {};
  const { data: proj, error: pErr } = await c
    .from("projects")
    .insert({
      owner_user_id: userId,
      org_id: input.orgId,
      entry_door: input.entryDoor,
      name: input.projectName,
      status: "active",
      segment_primary_id: input.segmentId,
      ref_version_id: refVersionId,
      access_level: input.accessLevel,
      access_scope: accessScope as unknown as Json,
    })
    .select("id")
    .single();
  if (pErr || !proj) {
    // rollback best-effort du user pour ne pas laisser d'orphelin
    await c.from("users").delete().eq("id", userId);
    throw new Error(`provisionAccount: création project échouée (${pErr?.message ?? ""})`);
  }
  const projectId = proj.id as string;

  // 3. Trace (audit) — création non contournable
  await writeAudit({
    action: "account.provision",
    targetType: "user",
    targetId: userId,
    targetLabel: `${input.name} <${input.email}>`,
    details: {
      projectId,
      projectName: input.projectName,
      orgId: input.orgId,
      entryDoor: input.entryDoor,
      accessLevel: input.accessLevel,
      accessScope,
    },
  });

  return { userId, projectId, accessLevel: input.accessLevel };
}

export interface PilotRow {
  projectId: string;
  projectName: string;
  ownerName: string;
  email: string;
  orgName: string | null;
  accessLevel: string;
  entryDoor: string;
  createdAt: string;
}

/** Comptes pilotes provisionnés (projets créés via la console — repérés par l'audit account.provision). */
export async function listPilotAccounts(): Promise<PilotRow[]> {
  const c = getServiceClient();
  const { data: auditRows } = await c
    .from("admin_audit_log")
    .select("target_id, details, created_at")
    .eq("action", "account.provision")
    .order("created_at", { ascending: false })
    .limit(200);
  const audits = (auditRows ?? []) as Array<{ target_id: string | null; details: Record<string, unknown>; created_at: string }>;
  const projectIds = [...new Set(audits.map((a) => (a.details?.projectId as string) ?? null).filter((x): x is string => !!x))];
  if (projectIds.length === 0) return [];

  const { data: projRaw } = await c.from("projects").select("id, name, owner_user_id, org_id, access_level, entry_door, created_at").in("id", projectIds);
  const projects = (projRaw ?? []) as Array<{ id: string; name: string; owner_user_id: string; org_id: string | null; access_level: string; entry_door: string; created_at: string }>;
  const projById = new Map(projects.map((p) => [p.id, p]));

  const { data: usersRaw } = await c.from("users").select("id, profile").in("id", projects.map((p) => p.owner_user_id));
  const userById = new Map<string, { name?: string; email?: string }>();
  for (const u of (usersRaw ?? []) as Array<{ id: string; profile: { name?: string; email?: string } | null }>) userById.set(u.id, u.profile ?? {});

  const { data: orgsRaw } = await c.from("organizations").select("id, name").in("id", projects.map((p) => p.org_id).filter((x): x is string => !!x));
  const orgById = new Map<string, string>();
  for (const o of (orgsRaw ?? []) as Array<{ id: string; name: string }>) orgById.set(o.id, o.name);

  const rows: PilotRow[] = [];
  for (const a of audits) {
    const pid = a.details?.projectId as string | undefined;
    if (!pid) continue;
    const p = projById.get(pid);
    if (!p) continue;
    const u = userById.get(p.owner_user_id) ?? {};
    rows.push({
      projectId: p.id,
      projectName: p.name,
      ownerName: u.name ?? "—",
      email: u.email ?? "—",
      orgName: p.org_id ? orgById.get(p.org_id) ?? null : null,
      accessLevel: p.access_level,
      entryDoor: p.entry_door,
      createdAt: a.created_at,
    });
  }
  return rows;
}
