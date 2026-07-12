import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Charge le .env.local de la RACINE du monorepo (secrets serveur) sans dépendance.
// La console admin lit SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// côté serveur uniquement. Le service key n'est JAMAIS préfixé NEXT_PUBLIC_ → jamais exposé.
try {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const content = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2] ?? "";
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
} catch {
  /* .env.local absent : erreur claire au premier accès data. */
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ftg/ui-kit"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
