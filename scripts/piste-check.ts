/**
 * Diagnostic PISTE / Légifrance — vérifie que la couche legifrancePiste bascule de la
 * dégradation [E] vers l'extraction RÉELLE dès que PISTE_CLIENT_SECRET est présent, SANS
 * modifier le code du client.
 *
 *   npx tsx scripts/piste-check.ts
 *
 * (1) test BRUT du flux OAuth client_credentials → code HTTP exact + token obtenu ou non ;
 * (2) appel du CLIENT legifrancePiste (@ftg/data-sources) sur des articles connus → réel
 *     (available=true, isEstimate=false) ou toujours [E]. Extrait + date affichés.
 */
import { readFileSync } from "node:fs";
import { legifrancePiste } from "../packages/data-sources/src/index.js";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try {
      loader(path);
      return;
    } catch {
      /* fallback */
    }
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2] ?? "";
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
  }
}

const OAUTH_URL = "https://oauth.piste.gouv.fr/api/oauth/token";

const CANDIDATES = [
  { articleId: "LEGIARTI000006309427", label: "CGI art. 293 B — franchise en base de TVA (défaut E8)" },
  { articleId: "LEGIARTI000006451473", label: "Loi 96-603 art. 16 — qualification artisanale (défaut E7)" },
  { articleId: "LEGIARTI000032041571", label: "Code civil art. 1240 — responsabilité (sanity, en vigueur)" },
  { articleId: "LEGIARTI000006419288", label: "Code civil art. 9 — vie privée (sanity)" },
];

async function rawTokenCheck(): Promise<boolean> {
  const combined = process.env.PISTE_LEGIFRANCE_API_KEY ?? "";
  const [ck, cs] = combined.includes(":") ? combined.split(":", 2) : [combined, ""];
  const clientId = (process.env.PISTE_CLIENT_ID ?? process.env.PISTE_OAUTH_CLIENT_ID ?? ck ?? "").trim();
  const clientSecret = (process.env.PISTE_CLIENT_SECRET ?? process.env.PISTE_OAUTH_CLIENT_SECRET ?? cs ?? "").trim();
  console.log(`• Identifiants lus par la logique du client :`);
  console.log(`   client_id  : ${clientId ? `présent (len ${clientId.length})` : "ABSENT"}  ← ${process.env.PISTE_CLIENT_ID ? "PISTE_CLIENT_ID" : "PISTE_LEGIFRANCE_API_KEY"}`);
  console.log(`   client_secret : ${clientSecret ? `présent (len ${clientSecret.length})` : "ABSENT"}  ← PISTE_CLIENT_SECRET`);
  if (!clientId || !clientSecret) {
    console.log("  → identifiants incomplets, le token ne peut pas être demandé.");
    return false;
  }
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope: "openid" });
  const res = await fetch(OAUTH_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: body.toString() });
  const txt = await res.text();
  console.log(`\n• RAW OAuth client_credentials → HTTP ${res.status}`);
  try {
    const j = JSON.parse(txt) as { access_token?: string; expires_in?: number; error?: string; error_description?: string; scope?: string };
    if (j.access_token) {
      console.log(`   ✅ token OBTENU (expires_in=${j.expires_in}s, scope="${j.scope ?? ""}")`);
      return true;
    }
    console.log(`   ❌ PAS de token — error="${j.error}" desc="${(j.error_description ?? "").slice(0, 200)}"`);
    return false;
  } catch {
    console.log(`   réponse brute (non-JSON) : ${txt.slice(0, 300)}`);
    return false;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ DIAGNOSTIC PISTE / Légifrance ════════\n");
  const tokenOk = await rawTokenCheck();

  console.log("\n• Appels du CLIENT legifrancePiste (@ftg/data-sources) — code inchangé :");
  for (const c of CANDIDATES) {
    const r = await legifrancePiste(c);
    const d = r.data;
    const verdict = r.degraded ? "❌ [E] DÉGRADÉ" : d.available ? "✅ RÉEL" : "⚠️ token OK mais article vide";
    console.log(`\n  ── ${c.articleId} · ${c.label}`);
    console.log(`     ${verdict} · degraded=${r.degraded} · available=${d.available} · isEstimate=${r.citation.isEstimate}`);
    console.log(`     dateVersion=${d.dateVersion ?? "—"} · source="${r.citation.source}"`);
    if (d.excerpt) console.log(`     extrait: « ${d.excerpt.slice(0, 220).replace(/\s+/g, " ")}… »`);
    else if (r.citation.method) console.log(`     method: ${r.citation.method.slice(0, 200)}`);
  }

  console.log(`\n════════ VERDICT : token=${tokenOk ? "OK" : "ÉCHEC"} ════════`);
}

main().catch((err) => {
  console.error("❌ piste-check échoué:", err);
  process.exit(1);
});
