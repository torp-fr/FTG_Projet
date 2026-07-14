import "@ftg/ui-kit/tokens.css";
import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/app/actions";

// Habillage « Le Cabinet » (JC-08b) — 3 familles, déclarées UNE fois, exposées en vars CSS et
// référencées par le fontFamily du preset ui-kit. IBM Plex Sans = corps/UI (défaut) ; Newsreader
// (display) et IBM Plex Mono (mesure) sont chargées et disponibles (application par rôle : JC-08c).
const fontBody = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--ftg-font-body" });
const fontDisplay = Newsreader({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--ftg-font-display" });
const fontMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--ftg-font-mono" });
const fontVars = `${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable}`;

export const metadata = {
  title: "Mon parcours — FTG",
  description: "Dashboard porteur : la vue sur mon projet (données réelles Supabase, accès authentifié).",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="fr" className={fontVars}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
            <Link href="/" className="font-semibold text-slate-900">FTG · Mon parcours</Link>
            {user ? (
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                <span>{user.name ?? user.email}</span>
                <form action={signOut}>
                  <button type="submit" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50">
                    Se déconnecter
                  </button>
                </form>
              </div>
            ) : (
              <span className="ml-auto text-xs text-slate-400">v1 — démo</span>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
