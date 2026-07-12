import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { getSessionOperator } from "@/lib/auth";
import { signOut } from "@/app/actions";

export const metadata = {
  title: "Console Admin — FTG",
  description: "Supervision, impersonation tracée, promotion de versions, comptes pilotes (accès opérateur authentifié).",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const operator = await getSessionOperator();
  const isOperator = operator?.isOperator === true;
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {/* Bandeau global : visible sur toutes les pages pendant une session d'impersonation. */}
        {isOperator ? <ImpersonationBanner /> : null}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="font-semibold text-slate-900">FTG · Console Admin</Link>
            {isOperator ? (
              <>
                <nav className="flex gap-4 text-sm text-slate-600">
                  <Link href="/" className="hover:text-slate-900">Supervision</Link>
                  <Link href="/engines" className="hover:text-slate-900">Engines</Link>
                  <Link href="/comptes" className="hover:text-slate-900">Comptes</Link>
                  <Link href="/audit" className="hover:text-slate-900">Audit</Link>
                </nav>
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                  <span>{operator?.name ?? operator?.email}</span>
                  <form action={signOut}>
                    <button type="submit" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50">
                      Se déconnecter
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <span className="ml-auto text-xs text-slate-400">v1 — opérateur FTG</span>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
