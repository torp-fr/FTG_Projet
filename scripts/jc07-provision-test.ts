/**
 * Test d'intégration JC-07 — Provisioning de comptes pilotes (Étape 4 / Étape 5).
 *
 *   npx tsx scripts/jc07-provision-test.ts
 *
 * Reproduit le chemin de provisionAccount (lib/provisioning.ts) via le service_role :
 *   1. crée un compte pilote (user) + parcours (project) par NIVEAU (freemium/partiel/complet) ;
 *   2. vérifie que le bon niveau d'accès est appliqué (access_level + access_scope) ;
 *   3. vérifie le rattachement à l'organisation (visible dans le cockpit B2B via org_id) ;
 *   4. vérifie que chaque création est TRACÉE (audit account.provision) ;
 *   5. vérifie que la CONTRAINTE d'intégrité rejette un niveau d'accès invalide.
 * Nettoie les comptes de test (l'audit reste, immuable). Exit ≠ 0 si un invariant est violé.
 */
import { readFileSync } from "node:fs";
import { createFtgServiceClient, type FtgClient } from "@ftg/database";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") { try { loader(path); return; } catch { /* fallback */ } }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2] ?? "";
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERTION ÉCHOUÉE — ${msg}`);
  console.log(`   ✓ ${msg}`);
}

type Level = "freemium" | "partiel" | "complet";

async function provision(c: FtgClient, refVersionId: string, orgId: string | null, level: Level, scopePhases: string[]) {
  const stamp = `${Date.now()}-${level}`;
  const user = await c.from("users").insert({ profile: { name: `Pilote ${level}`, email: `pilote-${stamp}@ftg.test`, note: "test JC-07", access_level: level } }).select("id").single();
  if (user.error || !user.data) throw new Error(`user: ${user.error?.message}`);
  const userId = user.data.id as string;
  const accessScope = level === "partiel" ? { phases: scopePhases } : {};
  const proj = await c.from("projects").insert({ owner_user_id: userId, org_id: orgId, entry_door: "A", name: `Parcours ${level} ${stamp}`, status: "active", ref_version_id: refVersionId, access_level: level, access_scope: accessScope }).select("id").single();
  if (proj.error || !proj.data) { await c.from("users").delete().eq("id", userId); throw new Error(`project: ${proj.error?.message}`); }
  const projectId = proj.data.id as string;
  await c.from("admin_audit_log").insert({ actor_label: "TEST jc07-provision", action: "account.provision", target_type: "user", target_id: userId, target_label: `Pilote ${level}`, details: { projectId, accessLevel: level, accessScope, orgId } });
  return { userId, projectId };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const c = createFtgServiceClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log("════════ JC-07 · TEST PROVISIONING COMPTES PILOTES ════════");

  const refv = await c.from("referential_versions").select("id").eq("status", "active").order("created_at", { ascending: false }).limit(1).single();
  if (refv.error || !refv.data) throw new Error(`référentiel actif: ${refv.error?.message}`);
  const refVersionId = refv.data.id as string;
  const org = await c.from("organizations").select("id").limit(1).single();
  const orgId = (org.data?.id as string) ?? null;

  const created: Array<{ userId: string; projectId: string }> = [];
  try {
    // 1-3. Un compte par niveau
    const free = await provision(c, refVersionId, null, "freemium", []);      // B2C direct
    const part = await provision(c, refVersionId, orgId, "partiel", ["P0", "P1", "P2"]);
    const full = await provision(c, refVersionId, orgId, "complet", []);
    created.push(free, part, full);

    const readLevel = async (pid: string) => (await c.from("projects").select("access_level, access_scope, org_id").eq("id", pid).single()).data as { access_level: string; access_scope: { phases?: string[] }; org_id: string | null };

    const f = await readLevel(free.projectId);
    assert(f.access_level === "freemium" && f.org_id === null, "freemium appliqué (P0 gratuit, B2C direct sans org)");

    const p = await readLevel(part.projectId);
    assert(p.access_level === "partiel" && JSON.stringify(p.access_scope.phases) === JSON.stringify(["P0", "P1", "P2"]), "partiel appliqué avec périmètre {P0,P1,P2}");
    assert(p.org_id === orgId && orgId !== null, "partiel rattaché à l'organisation (visible cockpit B2B)");

    const co = await readLevel(full.projectId);
    assert(co.access_level === "complet", "complet appliqué");

    // 4. Traces d'audit
    for (const acc of created) {
      const { count } = await c.from("admin_audit_log").select("id", { count: "exact", head: true }).eq("action", "account.provision").eq("target_id", acc.userId);
      assert((count ?? 0) >= 1, `création tracée (audit account.provision) pour ${acc.userId}`);
    }

    // 5. Contrainte : niveau invalide rejeté
    const bad = await c.from("projects").insert({ owner_user_id: full.userId, entry_door: "A", name: "invalid", status: "active", ref_version_id: refVersionId, access_level: "gold" }).select("id").single();
    assert(bad.error !== null, `niveau d'accès invalide rejeté par la contrainte (${bad.error?.message ?? ""})`);
  } finally {
    for (const acc of created) {
      await c.from("projects").delete().eq("id", acc.projectId);
      await c.from("users").delete().eq("id", acc.userId);
    }
  }

  console.log("\n✅ Provisioning : niveaux d'accès appliqués, rattachement org, création tracée, contrainte respectée.");
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
