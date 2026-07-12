/**
 * Test d'intégration JC-08a — matrice rôles → accès via AUTH RÉELLE + RLS (Étape 1 / Étape 4).
 *
 *   npx tsx scripts/jc08-auth-matrix-test.ts
 *
 * Se connecte RÉELLEMENT (signInWithPassword, clé anon) comme chaque rôle et vérifie que la
 * RLS scoppe correctement — le socle de sécurité, indépendant du rendu Next :
 *   • Non authentifié → ne voit AUCUN projet.
 *   • Porteur (Karim) → voit SON projet, PAS ceux des autres, PAS le projet B2C hors-org.
 *   • Conseiller → voit la cohorte de SON org, PAS un projet hors-org ; lit les noms des
 *     porteurs de sa cohorte (policy additive) ; ne voit pas la cohorte d'une autre org.
 *   • Opérateur → is_operator=true (accès console admin).
 * Exit ≠ 0 si un invariant est violé. Ne modifie rien (lecture seule).
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

const PASSWORD = "FtgDemo2026!";

async function signedInClient(url: string, anon: string, email: string): Promise<SupabaseClient> {
  const c = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return c;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  console.log("════════ JC-08a · MATRICE RÔLES → ACCÈS (auth réelle + RLS) ════════");

  // 0. Non authentifié → aucun projet
  const anonClient = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const anonProjects = await anonClient.from("projects").select("id");
  assert((anonProjects.data?.length ?? 0) === 0, "non authentifié : voit 0 projet (RLS deny)");

  // 1. Porteur (Karim) → son projet uniquement
  const porteur = await signedInClient(url, anon, "karim.demo@ftg.test");
  const pProjects = (await porteur.from("projects").select("id, name, org_id")).data ?? [];
  assert(pProjects.length >= 1, `porteur : voit au moins 1 projet (${pProjects.length})`);
  assert(pProjects.every((p: { name: string }) => p.name.includes("Atelier menuiserie")), "porteur : ne voit QUE son projet (Atelier menuiserie)");
  assert(!pProjects.some((p: { name: string }) => p.name.includes("Café-atelier") || p.name.includes("SaaS TPE") || p.name.includes("SMOKE")), "porteur : ne voit ni le B2C hors-org ni les autres porteurs");
  // porteur ne lit que sa propre ligne users
  const pUsers = (await porteur.from("users").select("id")).data ?? [];
  assert(pUsers.length === 1, "porteur : ne lit que sa propre ligne users (users_select_self)");

  // 2. Conseiller → cohorte de son org
  const conseiller = await signedInClient(url, anon, "conseiller.demo@ftg.test");
  const cProjects = (await conseiller.from("projects").select("id, name, org_id")).data ?? [];
  const names = cProjects.map((p: { name: string }) => p.name);
  assert(cProjects.length >= 2, `conseiller : voit la cohorte de son org (${cProjects.length} projets)`);
  assert(names.some((n: string) => n.includes("Atelier menuiserie")) && names.some((n: string) => n.includes("SaaS TPE")), "conseiller : voit les porteurs de sa cohorte (Atelier + SaaS TPE)");
  assert(!names.some((n: string) => n.includes("Café-atelier")), "conseiller : ne voit PAS le projet B2C hors-org (Café-atelier)");
  assert(cProjects.every((p: { org_id: string | null }) => p.org_id !== null), "conseiller : tous les projets vus sont rattachés à une org");
  // conseiller lit les noms des porteurs de sa cohorte (policy additive users_select_org_cohort)
  const cUsers = (await conseiller.from("users").select("id, profile")).data ?? [];
  assert(cUsers.length >= 2, `conseiller : lit les lignes users des porteurs de sa cohorte (${cUsers.length})`);

  // 3. Opérateur → is_operator=true
  const operateur = await signedInClient(url, anon, "ops@ftg.test");
  const opRow = (await operateur.from("users").select("is_operator").eq("auth_ref", (await operateur.auth.getUser()).data.user?.id ?? "")).data ?? [];
  assert(opRow.length === 1 && (opRow[0] as { is_operator: boolean }).is_operator === true, "opérateur : is_operator=true (accès console admin)");

  console.log("\n✅ Matrice rôles → accès : porteur/conseiller/opérateur/non-auth scoppés correctement par la RLS.");
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
