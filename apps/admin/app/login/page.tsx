"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const forbidden = params.get("error") === "forbidden";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Identifiants invalides.");
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function onSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-900">FTG · Console Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Connexion opérateur FTG.</p>
      {forbidden ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Accès réservé aux opérateurs FTG. Ce compte n’a pas les droits d’accès à la console.
          <button onClick={onSignOut} className="mt-2 block text-xs underline">Se déconnecter et changer de compte</button>
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-xs text-slate-500">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" autoComplete="email" />
        </label>
        <label className="block text-xs text-slate-500">
          Mot de passe
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" autoComplete="current-password" />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button type="submit" disabled={loading}
          className="w-full rounded-md border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
