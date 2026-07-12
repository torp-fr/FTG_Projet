/**
 * Test d'intégration JC-07 — Audit trail non contournable & IMMUABLE (Étape 2 / Étape 5).
 *
 *   npx tsx scripts/jc07-audit-test.ts
 *
 * Écrit RÉELLEMENT dans Supabase (admin_audit_log) via le service_role, comme le fait la
 * console admin (lib/audit.ts). Vérifie :
 *   1. une ligne d'audit s'insère (acte opérateur tracé) ;
 *   2. UPDATE d'une ligne d'audit est REJETÉ (immuabilité — trigger base) ;
 *   3. DELETE d'une ligne d'audit est REJETÉ (append-only strict).
 * Séparé de `pnpm test` (touche la vraie base). Exit ≠ 0 si un invariant est violé.
 */
import { readFileSync } from "node:fs";
import { createFtgServiceClient } from "@ftg/database";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try { loader(path); return; } catch { /* fallback */ }
  }
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

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const c = createFtgServiceClient(url, key);

  console.log("════════ JC-07 · TEST AUDIT IMMUABLE ════════");

  // 1. Insertion d'un acte opérateur (même chemin que lib/audit.ts writeAudit)
  const stamp = new Date().toISOString();
  const ins = await c
    .from("admin_audit_log")
    .insert({ actor_label: `TEST jc07-audit <${stamp}>`, action: "impersonation.view", target_type: "porteur", target_id: "test-target", target_label: "cible de test", details: { scope: { probe: true } } })
    .select("id")
    .single();
  if (ins.error || !ins.data) throw new Error(`insert audit: ${ins.error?.message}`);
  const id = ins.data.id as string;
  assert(true, `ligne d'audit insérée (id=${id})`);

  // 2. UPDATE rejeté (immuabilité)
  const upd = await c.from("admin_audit_log").update({ action: "tampered" }).eq("id", id);
  assert(upd.error !== null, `UPDATE rejeté par le trigger d'immuabilité (${upd.error?.message ?? ""})`);

  // 3. DELETE rejeté (append-only)
  const del = await c.from("admin_audit_log").delete().eq("id", id);
  assert(del.error !== null, `DELETE rejeté par le trigger d'immuabilité (${del.error?.message ?? ""})`);

  // 4. La ligne est bien toujours là, inchangée
  const check = await c.from("admin_audit_log").select("action").eq("id", id).single();
  assert(!check.error && (check.data as { action: string }).action === "impersonation.view", "la ligne d'audit est intacte (action inchangée)");

  console.log("\n✅ Audit trail non contournable et immuable — vérifié bout en bout.");
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
