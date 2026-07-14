export const dynamic = "force-dynamic";

export default function ParametresPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-slate-900">Paramètres structure</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        <p className="text-sm">Paramètres de la structure — <span className="font-medium">v1 (structure posée, à enrichir)</span>.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
          <li>Organisation, plan, canal LLM (byok / pooled).</li>
          <li>Membres et rôles d’accompagnement.</li>
          <li>Mode de gate (strict / free) et seuils personnalisés (à brancher ultérieurement).</li>
        </ul>
      </div>
    </div>
  );
}
