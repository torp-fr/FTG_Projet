/**
 * Seed des 3 comptes de login (JC-08a Étape 1) — relie les rôles à une auth Supabase réelle.
 *
 *   npx tsx scripts/jc08-seed-auth.ts
 *
 * Crée/relie (idempotent) via l'admin API service_role :
 *   • Porteur    — karim.demo@ftg.test → public.users « Karim B. » (possède un projet de la
 *                  cohorte DEMO). Voit SON projet.
 *   • Conseiller — conseiller.demo@ftg.test → public.users « Conseiller Démo » + org_member
 *                  (advisor) de l'org DEMO. Voit la cohorte de son org.
 *   • Opérateur  — ops@ftg.test → public.users « Opérateur FTG » + is_operator=true. Accède
 *                  à la console admin.
 * Mot de passe commun (démo) : FtgDemo2026!  (à changer hors démo).
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const PASSWORD = "FtgDemo2026!";
const DEMO_ORG = "Incubateur Démo — CCI Test";

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  console.log("════════ JC-08a · SEED AUTH (3 rôles) ════════");

  // Résout l'auth user par email (idempotent) — crée si absent, renvoie l'id.
  async function ensureAuthUser(email: string): Promise<string> {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`);
    console.log(`  + auth user créé : ${email}`);
    return data.user.id;
  }

  // Lie une ligne public.users à un auth id.
  async function link(publicUserId: string, authId: string): Promise<void> {
    const { error } = await admin.from("users").update({ auth_ref: authId }).eq("id", publicUserId);
    if (error) throw new Error(`link auth_ref: ${error.message}`);
  }

  // ── Porteur (relie un porteur existant de la cohorte) ────────────────────────
  const porteurEmail = "karim.demo@ftg.test";
  const { data: karim } = await admin.from("users").select("id").eq("profile->>email", porteurEmail).maybeSingle();
  if (!karim) throw new Error(`porteur ${porteurEmail} introuvable (cohorte DEMO attendue)`);
  const porteurAuth = await ensureAuthUser(porteurEmail);
  await link(karim.id, porteurAuth);
  console.log(`✓ Porteur     : ${porteurEmail} → users ${karim.id}`);

  // ── Conseiller (org_member advisor de l'org DEMO) ────────────────────────────
  const { data: org } = await admin.from("organizations").select("id").eq("name", DEMO_ORG).maybeSingle();
  if (!org) throw new Error(`org « ${DEMO_ORG} » introuvable`);
  const conseillerEmail = "conseiller.demo@ftg.test";
  let { data: conseiller } = await admin.from("users").select("id").eq("profile->>email", conseillerEmail).maybeSingle();
  if (!conseiller) {
    const ins = await admin.from("users").insert({ profile: { name: "Conseiller Démo", email: conseillerEmail, note: "conseiller B2B (JC-08a)" } }).select("id").single();
    if (ins.error || !ins.data) throw new Error(`create conseiller: ${ins.error?.message}`);
    conseiller = ins.data;
  }
  const conseillerAuth = await ensureAuthUser(conseillerEmail);
  await link(conseiller.id, conseillerAuth);
  await admin.from("org_members").upsert({ org_id: org.id, user_id: conseiller.id, role: "advisor" }, { onConflict: "org_id,user_id" });
  console.log(`✓ Conseiller  : ${conseillerEmail} → users ${conseiller.id} (advisor de « ${DEMO_ORG} »)`);

  // ── Opérateur (is_operator=true) ─────────────────────────────────────────────
  const opEmail = "ops@ftg.test";
  let { data: op } = await admin.from("users").select("id").eq("profile->>email", opEmail).maybeSingle();
  if (!op) {
    const ins = await admin.from("users").insert({ profile: { name: "Opérateur FTG", email: opEmail, note: "opérateur console admin (JC-08a)" }, is_operator: true }).select("id").single();
    if (ins.error || !ins.data) throw new Error(`create opérateur: ${ins.error?.message}`);
    op = ins.data;
  } else {
    await admin.from("users").update({ is_operator: true }).eq("id", op.id);
  }
  const opAuth = await ensureAuthUser(opEmail);
  await link(op.id, opAuth);
  console.log(`✓ Opérateur   : ${opEmail} → users ${op.id} (is_operator=true)`);

  console.log(`\n✅ 3 comptes de login prêts (mot de passe démo : ${PASSWORD}).`);
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
