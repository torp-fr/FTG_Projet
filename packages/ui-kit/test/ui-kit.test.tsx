/**
 * Tests de composants ui-kit (JC-09) — rendu/props via renderToStaticMarkup (léger, pas de
 * navigateur ni de bundler). Vérifie que le markup/les classes des composants factorisés sont
 * ceux attendus (identité de rendu vs les copies d'origine des apps).
 *
 *   pnpm --filter @ftg/ui-kit test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  VerdictBadge,
  StateBadge,
  RunStatusBadge,
  Section,
  StatTile,
  ProgressHero,
  PhaseDag,
  DeliverableBody,
  AgentBoard,
  verdictMeta,
  VERDICTS,
  type PhaseNode,
  type AgentView,
} from "../src/index.js";

test("verdictMeta : mapping neutre + fallback", () => {
  assert.equal(VERDICTS.validated.label, "Validé");
  assert.equal(verdictMeta("validated").label, "Validé");
  assert.equal(verdictMeta("conditions_not_met").label, "Conditions non réunies");
  assert.equal(verdictMeta("inconnu").label, "—");
  assert.equal(verdictMeta(null).label, "—");
});

test("VerdictBadge : libellé + outline (bordure+texte état) + pastille ●", () => {
  const html = renderToStaticMarkup(<VerdictBadge verdict="validated_with_reserves" />);
  assert.match(html, /Validé avec réserves/);
  assert.match(html, /border-amber-300 text-amber-700/); // JC-08c : outline (plus de fond bg-*-50)
  assert.doesNotMatch(html, /bg-amber-50/); // fond doux retiré
  assert.match(html, /rounded-full border/);
  assert.match(html, /●/); // pastille en tête
  // « alternatives détectées » garde l'accent (bleu d'encre)
  assert.match(renderToStaticMarkup(<VerdictBadge verdict="alternatives_detected" />), /border-violet-300 text-violet-700/);
});

test("StateBadge / RunStatusBadge : états connus + fallback + sémantique JC-08c", () => {
  assert.match(renderToStaticMarkup(<StateBadge state="done" />), /Fait/);
  assert.match(renderToStaticMarkup(<StateBadge state="locked" />), /Verrouillé/);
  assert.match(renderToStaticMarkup(<StateBadge state="zzz" />), /zzz/);
  // JC-08c : complétude (done) = accent (violet) ; en cours = warn (ambre)
  assert.match(renderToStaticMarkup(<StateBadge state="done" />), /border-violet-300 bg-violet-50 text-violet-700/);
  assert.match(renderToStaticMarkup(<StateBadge state="in_progress" />), /border-amber-300 bg-amber-50 text-amber-700/);
  // run : done reste vert (succès), failed reste rose (stop), en cours passe en warn
  assert.match(renderToStaticMarkup(<RunStatusBadge status="done" />), /border-emerald-300/);
  assert.match(renderToStaticMarkup(<RunStatusBadge status="failed" />), /border-rose-300/);
  assert.match(renderToStaticMarkup(<RunStatusBadge status="running" />), /border-amber-300 bg-amber-50 text-amber-700/);
});

test("Section : titre, note, markup carte", () => {
  const html = renderToStaticMarkup(<Section title="Mes livrables" note="3"><p>x</p></Section>);
  assert.match(html, /Mes livrables/);
  assert.match(html, /rounded-lg border border-slate-200 bg-white p-5/);
  assert.match(html, /<span[^>]*>3<\/span>/);
  assert.match(html, /font-display[^>]*>Mes livrables/); // JC-08c : titre de section en serif (Newsreader)
});

test("StatTile : valeur + label + hint", () => {
  const html = renderToStaticMarkup(<StatTile label="Porteurs" value={12} hint="actifs" />);
  assert.match(html, /12/);
  assert.match(html, /Porteurs/);
  assert.match(html, /actifs/);
  assert.match(html, /font-display[^>]*>12/); // JC-08c : grand nombre en serif
});

test("ProgressHero : pct + jalons + phase courante surlignée", () => {
  const html = renderToStaticMarkup(
    <ProgressHero pct={42} doneCount={5} seededCount={12} currentPhase="P2" currentPhaseName="Cadrage" phaseCodes={["P0", "P1", "P2", "P3"]} />,
  );
  assert.match(html, /42%/);
  assert.match(html, /5\/12 jalons validés/);
  assert.match(html, /Cadrage/);
  assert.match(html, /width:42%/);
  // phase courante en gras
  assert.match(html, /font-semibold text-slate-700[^>]*>P2/);
  // JC-08c : jauge de complétude en accent (bleu d'encre), grand nombre en serif, labels P en mono
  assert.match(html, /bg-violet-700/);
  assert.doesNotMatch(html, /bg-emerald-400/);
  assert.match(html, /font-display[^>]*>42%/);
  assert.match(html, /justify-between font-mono/); // rangée des labels P0–P9 en mono
});

test("PhaseDag : phases + jalons rendus", () => {
  const phases: PhaseNode[] = [
    { code: "P0", name: "Amorçage", state: "done", jalons: [{ code: "P0-J0", state: "done", quality: 95, recommended: false }] },
    { code: "P1", name: "Cadrage", state: "locked", reason: "À venir", jalons: [] },
  ];
  const html = renderToStaticMarkup(<PhaseDag phases={phases} />);
  assert.match(html, /P0/);
  assert.match(html, /Amorçage/);
  assert.match(html, /J0/); // code.split("-")[1]
  assert.match(html, /· 95/); // quality
  assert.match(html, /À venir/); // phase vide
  // JC-08c : jalon « fait » = accent (violet) ; code de phase P en mono
  assert.match(html, /border-violet-300/);
  assert.doesNotMatch(html, /bg-emerald-50/);
  assert.match(html, /font-mono[^>]*>P0/);
  // « en cours » = warn (ambre) + anneau du nœud courant en ambre
  const enCours: PhaseNode[] = [
    { code: "P2", name: "Cadrage", state: "in_progress", jalons: [{ code: "P2-J0", state: "in_progress", quality: null, recommended: true }] },
  ];
  const htmlEnCours = renderToStaticMarkup(<PhaseDag phases={enCours} />);
  assert.match(htmlEnCours, /bg-amber-50 text-amber-700 border-amber-200/);
  assert.match(htmlEnCours, /ring-amber-300/);
});

test("DeliverableBody : match_report / selection_brief / fallback md", () => {
  const match = renderToStaticMarkup(
    <DeliverableBody deliverable={{ type: "match_report", data: { composite_v3: 18, v3_scores_by_dimension: { A: 20 }, gap_map: [] } }} />,
  );
  assert.match(match, /Composite V3/);
  assert.match(match, /18/);
  assert.match(match, /font-display[^>]*>18/); // JC-08c : grand nombre (composite) en serif

  const md = renderToStaticMarkup(<DeliverableBody deliverable={{ type: "other", data: { contentMd: "Bonjour" } }} />);
  assert.match(md, /Bonjour/);
  assert.match(md, /whitespace-pre-wrap/);
});

test("AgentBoard : cartes agents + livrables", () => {
  const agents: AgentView[] = [
    { persona: "Le Miroir", code: "founder_profiler", latestRunStatus: "done", runsCount: 2, outputs: [{ label: "Profil", deliverableId: "d1" }] },
    { persona: "La Vigie", code: "competitive_watch", latestRunStatus: null, runsCount: 0, outputs: [] },
  ];
  const html = renderToStaticMarkup(<AgentBoard agents={agents} />);
  assert.match(html, /Le Miroir/);
  assert.match(html, /2 exécution\(s\)/);
  assert.match(html, /#deliverable-d1/);
  assert.match(html, /en veille/);
  assert.match(html, /Aucun livrable pour ce projet/);
  assert.match(html, /font-mono[^>]*>founder_profiler/); // JC-08c : code technique en mono
});
