/**
 * Test d'intégration JC-07 — version.promote sous verrous (Étape 3 / Étape 5).
 *
 *   npx tsx scripts/jc07-promote-test.ts
 *
 * Exerce la fonction base `promote_engine_version` via le MÊME chemin que la console admin
 * (supabase-js .rpc, service_role) sur un engine JETABLE (les 8 engines réels ne sont pas
 * touchés). Vérifie :
 *   1. smoke ROUGE  → promotion REFUSÉE (aucune version active) + trace 'version.promote_refused' ;
 *   2. smoke VERT   → promotion (candidate→active) + trace 'version.promote' ;
 *   3. 2e promotion → swap, EXACTEMENT UNE version active ;
 *   4. rollback     → re-promotion d'une version antérieure, trace 'version.rollback' ;
 *   5. invariant    → l'index unique partiel interdit physiquement 2 versions actives.
 * Nettoie l'engine jetable en fin de test (l'audit reste, immuable). Exit ≠ 0 si un invariant
 * est violé. Séparé de `pnpm test` (touche la vraie base).
 */
import { readFileSync } from "node:fs";
import { createFtgServiceClient, type FtgClient } from "@ftg/database";

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

async function promote(c: FtgClient, versionId: string, passed: boolean, details: Record<string, unknown> = {}) {
  const { data, error } = await c.rpc("promote_engine_version", {
    p_version_id: versionId,
    p_actor_label: "TEST jc07-promote",
    p_smoke_passed: passed,
    p_smoke_details: details,
    p_regression_ok: true,
  });
  if (error) throw new Error(`rpc promote_engine_version: ${error.message}`);
  return data as unknown as { promoted: boolean; action?: string; reason?: string };
}

async function countActive(c: FtgClient, engineId: string): Promise<number> {
  const { count } = await c.from("engine_versions").select("id", { count: "exact", head: true }).eq("engine_id", engineId).eq("status", "active");
  return count ?? -1;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const c = createFtgServiceClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log("════════ JC-07 · TEST version.promote SOUS VERROUS ════════");

  // Engine jetable + 2 versions candidate
  const stamp = Date.now();
  const eng = await c.from("engines").insert({ code: `jc07_promote_test_${stamp}`, name: "JC07 Promote Test", status: "active" }).select("id, code").single();
  if (eng.error || !eng.data) throw new Error(`insert engine: ${eng.error?.message}`);
  const engineId = eng.data.id as string;
  const v1 = (await c.from("engine_versions").insert({ engine_id: engineId, semver: "0.0.1", status: "candidate" }).select("id").single()).data!.id as string;
  const v2 = (await c.from("engine_versions").insert({ engine_id: engineId, semver: "0.0.2", status: "candidate" }).select("id").single()).data!.id as string;

  try {
    // 1. Smoke ROUGE → refus
    const r1 = await promote(c, v1, false, { reason: "smoke rouge simulé" });
    assert(r1.promoted === false && r1.reason === "smoke_red", "smoke rouge → promotion REFUSÉE (reason=smoke_red)");
    assert((await countActive(c, engineId)) === 0, "aucune version active après un refus");

    // 2. Smoke VERT → promotion
    const r2 = await promote(c, v1, true, { deliverable: "ok" });
    assert(r2.promoted === true && r2.action === "version.promote", "smoke vert → PROMUE (action=version.promote)");
    assert((await countActive(c, engineId)) === 1, "exactement une version active après promotion");

    // 3. Promotion de v2 → swap, toujours une seule active
    const r3 = await promote(c, v2, true);
    assert(r3.promoted === true, "v2 promue");
    assert((await countActive(c, engineId)) === 1, "TOUJOURS exactement une version active après swap");
    assert(((await c.from("engine_versions").select("status").eq("id", v1).single()).data as { status: string }).status === "retired", "v1 retirée après swap");

    // 4. Rollback → re-promotion de v1
    const r4 = await promote(c, v1, true);
    assert(r4.promoted === true && r4.action === "version.rollback", "rollback → re-promotion (action=version.rollback)");
    assert((await countActive(c, engineId)) === 1, "exactement une active après rollback");

    // 5. Invariant physique : index unique partiel interdit 2 actives
    const forced = await c.from("engine_versions").update({ status: "active" }).eq("id", v2);
    assert(forced.error !== null, `index unique partiel : 2e version active rejetée (${forced.error?.message ?? ""})`);

    // 6. Trace complète en audit
    const { data: auditRows } = await c
      .from("admin_audit_log")
      .select("action")
      .like("target_label", `${eng.data.code}%`);
    const actions = ((auditRows ?? []) as Array<{ action: string }>).map((r) => r.action);
    assert(actions.includes("version.promote_refused"), "trace du refus présente");
    assert(actions.includes("version.promote"), "trace de la promotion présente");
    assert(actions.includes("version.rollback"), "trace du rollback présente");
  } finally {
    // Nettoyage (audit conservé, immuable)
    await c.from("engine_versions").delete().eq("engine_id", engineId);
    await c.from("engines").delete().eq("id", engineId);
  }

  console.log("\n✅ version.promote : verrous, refus, exactement-une-active, rollback, trace — vérifié bout en bout.");
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
