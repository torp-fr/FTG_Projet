import { getOrgOptions, getSegmentOptions, listPilotAccounts, ACCESS_LEVELS, ACCESS_LABEL } from "@/lib/provisioning";
import { provisionAccountAction } from "@/app/actions";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACCESS_CLS: Record<string, string> = {
  freemium: "border-slate-300 bg-slate-100 text-slate-600",
  partiel: "border-amber-300 bg-amber-50 text-amber-700",
  complet: "border-emerald-300 bg-emerald-50 text-emerald-700",
};
const PHASES = ["P0", "P1", "P2", "P3", "P4", "P5", "P6"];

function ResultBanner({ status, level, reason, email, pwd }: { status?: string; level?: string; reason?: string; email?: string; pwd?: string }) {
  if (status === "created")
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Compte pilote créé (niveau {level}). Création tracée dans l’audit.
        {pwd ? (
          <div className="mt-1 text-emerald-900">
            Login : <code className="rounded bg-white/70 px-1">{email}</code> · mot de passe temporaire (à communiquer une fois) :{" "}
            <code className="rounded bg-white/70 px-1 font-semibold">{pwd}</code>
          </div>
        ) : (
          <div className="mt-1 text-emerald-900">Login relié à un compte existant pour {email}.</div>
        )}
      </div>
    );
  if (status === "error") return <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">Échec : {reason || "données invalides"}.</div>;
  return null;
}

export default async function ComptesPage({ searchParams }: { searchParams: Promise<{ status?: string; level?: string; reason?: string; email?: string; pwd?: string }> }) {
  const { status, level, reason, email, pwd } = await searchParams;
  const [orgs, segments, pilots] = await Promise.all([getOrgOptions(), getSegmentOptions(), listPilotAccounts()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Comptes pilotes B2B2C</h1>
        <p className="text-sm text-slate-500">
          Provisioning d’un compte pilote (porteur + parcours) avec niveau d’accès configurable, rattaché à une organisation
          (incubateur / CCI) pour le cockpit B2B. Chaque création est tracée dans l’audit.
        </p>
      </div>

      <ResultBanner status={status} level={level} reason={reason} email={email} pwd={pwd} />

      <form action={provisionAccountAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Nom du porteur *
          <input name="name" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" placeholder="Prénom N." />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Email *
          <input name="email" type="email" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" placeholder="porteur@exemple.fr" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Organisation (cockpit B2B)
          <select name="orgId" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="">Aucune (B2C direct)</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}{o.type ? ` · ${o.type}` : ""}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Porte d’entrée
          <select name="entryDoor" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="A">A — j’ai une idée</option>
            <option value="B">B — je cherche une idée</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Nom du parcours
          <input name="projectName" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700" placeholder="Parcours pilote" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Segment (optionnel)
          <select name="segmentId" className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700">
            <option value="">—</option>
            {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-xs text-slate-500">Niveau d’accès *</legend>
          <div className="flex flex-wrap gap-4">
            {ACCESS_LEVELS.map((lvl, i) => (
              <label key={lvl} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="accessLevel" value={lvl} defaultChecked={i === 0} /> {ACCESS_LABEL[lvl]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-xs text-slate-500">Périmètre (niveau « partiel » uniquement)</legend>
          <div className="flex flex-wrap gap-3">
            {PHASES.map((ph) => (
              <label key={ph} className="flex items-center gap-1.5 text-sm text-slate-600">
                <input type="checkbox" name="scopePhases" value={ph} /> {ph}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sm:col-span-2">
          <button type="submit" className="rounded-md border border-slate-800 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Créer le compte pilote
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">Comptes pilotes provisionnés</h2>
        {pilots.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Aucun compte pilote provisionné pour l’instant.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Porteur</th>
                  <th className="px-4 py-2.5 font-medium">Organisation</th>
                  <th className="px-4 py-2.5 font-medium">Niveau d’accès</th>
                  <th className="px-4 py-2.5 font-medium">Porte</th>
                  <th className="px-4 py-2.5 font-medium">Créé</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pilots.map((p) => (
                  <tr key={p.projectId} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{p.ownerName}</div>
                      <div className="text-xs text-slate-400">{p.email} · {p.projectName}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{p.orgName ?? "B2C direct"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-xs ${ACCESS_CLS[p.accessLevel] ?? "border-slate-200 bg-slate-50 text-slate-500"}`}>{p.accessLevel}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{p.entryDoor}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDateTime(p.createdAt)}</td>
                    <td className="px-4 py-2.5"><a href={`/projet/${p.projectId}`} className="text-xs text-slate-500 hover:underline">superviser →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        La visibilité du compte est régie par les RLS existantes (le porteur voit son projet ; l’org le voit dans son cockpit).
        Le niveau d’accès (portée des phases/engines) est additif (projects.access_level) et consommé par le gate orchestrateur.
      </p>
    </div>
  );
}
