export const dynamic = "force-dynamic";

export default function ComitePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-slate-900">Comité</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        <p className="text-sm">Vue Comité — <span className="font-medium">v1 (structure posée, à enrichir)</span>.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
          <li>Ordre du jour de comité (porteurs à passer en revue).</li>
          <li>Synthèse des verdicts de gate à examiner, présentés en faits &amp; options.</li>
          <li>Décisions et suites (à brancher ultérieurement).</li>
        </ul>
      </div>
    </div>
  );
}
