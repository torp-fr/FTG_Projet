import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/app/actions";

export const metadata = {
  title: "Cockpit B2B — FTG",
  description: "Cockpit d'accompagnement de cohorte (données réelles Supabase, accès authentifié).",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="font-semibold text-slate-900">
              FTG · Cockpit B2B
            </Link>
            {user ? (
              <>
                <nav className="flex gap-4 text-sm text-slate-600">
                  <Link href="/" className="hover:text-slate-900">Cohorte</Link>
                  <Link href="/comite" className="hover:text-slate-900">Comité</Link>
                  <Link href="/parametres" className="hover:text-slate-900">Paramètres</Link>
                </nav>
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                  <span>{user.name ?? user.email}</span>
                  <form action={signOut}>
                    <button type="submit" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50">
                      Se déconnecter
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <span className="ml-auto text-xs text-slate-400">v1 — démo</span>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
