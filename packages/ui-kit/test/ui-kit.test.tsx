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

test("VerdictBadge : libellé + classes neutres", () => {
  const html = renderToStaticMarkup(<VerdictBadge verdict="validated_with_reserves" />);
  assert.match(html, /Validé avec réserves/);
  assert.match(html, /bg-amber-50 text-amber-700 border-amber-200/);
  assert.match(html, /rounded-full border/);
});

test("StateBadge / RunStatusBadge : états connus + fallback", () => {
  assert.match(renderToStaticMarkup(<StateBadge state="done" />), /Fait/);
  assert.match(renderToStaticMarkup(<StateBadge state="locked" />), /Verrouillé/);
  assert.match(renderToStaticMarkup(<StateBadge state="zzz" />), /zzz/);
  assert.match(renderToStaticMarkup(<RunStatusBadge status="done" />), /border-emerald-300/);
  assert.match(renderToStaticMarkup(<RunStatusBadge status="failed" />), /border-rose-300/);
});

test("Section : titre, note, markup carte", () => {
  const html = renderToStaticMarkup(<Section title="Mes livrables" note="3"><p>x</p></Section>);
  assert.match(html, /Mes livrables/);
  assert.match(html, /rounded-lg border border-slate-200 bg-white p-5/);
  assert.match(html, /<span[^>]*>3<\/span>/);
});

test("StatTile : valeur + label + hint", () => {
  const html = renderToStaticMarkup(<StatTile label="Porteurs" value={12} hint="actifs" />);
  assert.match(html, /12/);
  assert.match(html, /Porteurs/);
  assert.match(html, /actifs/);
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
});

test("DeliverableBody : match_report / selection_brief / fallback md", () => {
  const match = renderToStaticMarkup(
    <DeliverableBody deliverable={{ type: "match_report", data: { composite_v3: 18, v3_scores_by_dimension: { A: 20 }, gap_map: [] } }} />,
  );
  assert.match(match, /Composite V3/);
  assert.match(match, /18/);

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
});
