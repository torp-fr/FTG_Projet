import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

export const metadata = {
  title: "Console Admin — FTG",
  description: "Supervision, impersonation tracée, promotion de versions, comptes pilotes (données réelles Supabase).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {/* Bandeau global : visible sur toutes les pages pendant une session d'impersonation. */}
        <ImpersonationBanner />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="font-semibold text-slate-900">FTG · Console Admin</Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Supervision</Link>
              <Link href="/audit" className="hover:text-slate-900">Audit</Link>
            </nav>
            <span className="ml-auto text-xs text-slate-400">v1 — opérateur FTG</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
