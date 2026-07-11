/**
 * Tests de CONFORMITÉ D'ENVELOPPE de l'engine E2 (La Boussole), LLM MOCKÉ.
 *
 * Exécution : `pnpm --filter @ftg/engine-founder-project-matcher test`
 *
 * Aucun appel réseau, aucun coût API : chaque test injecte un `callModel` factice.
 * On vérifie la CONFORMITÉ STRUCTURELLE de l'enveloppe (passe validateOutputEnvelope,
 * D25 solution_paths, 🔀 three_ways) — PAS la qualité du contenu LLM, qui relève des
 * eval_runs rejoués sur base réelle (Chantier 5).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { EngineInputEnvelope, FounderProfileContext } from "@ftg/engine-sdk";
import { runFounderProjectMatcher } from "../src/run.js";
import type { CallModel } from "@ftg/engine-sdk";

function makeInput(
  taskType: string,
  structuredInput: Record<string, unknown>,
  founderProfile: FounderProfileContext = {},
): EngineInputEnvelope {
  return {
    runId: "run-test-e2",
    taskType,
    projectContext: {
      canonicalState: {},
      dependencyDigests: [],
      founderProfile,
      segmentProfile: { code: "generic", name: "Générique", config: {} },
      geoLenses: ["france"],
      decisionsHistory: [],
    },
    structuredInput,
    constraints: {
      quotas: {},
      llmChannel: "pooled",
      // E2 raisonne, ne fait pas de recherche waterfall → profondeur min = 0.
      researchDepthMin: 0,
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"],
    },
  };
}

function mockModel(canned: unknown): CallModel {
  return async () => JSON.stringify(canned);
}

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (1) — Introverti déclaré × projet 100% vente terrain → écart V3 signalé sur
// l'exposition, comblé par 3 voies RÉELLEMENT divergentes :
//   canal alternatif (adapter le projet) / partenariat commercial (déléguer) /
//   montée en compétence (acquérir).
// Vérifie : enveloppe passe validateOutputEnvelope, solution_paths ≥ 1, three_ways 🔀.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(1) — introverti × vente terrain : écart exposition + 3 voies divergentes", async () => {
  const input = makeInput(
    "gap_bridging",
    {
      requirements: {
        exposition: "Le projet exige une prospection et une vente en face-à-face intensives.",
      },
      gap_map: [
        { dimension: "exposition", score: 25, reading: "Le projet exige une exposition commerciale forte ; vos réponses indiquent une préférence pour le travail en retrait." },
      ],
    },
    { competencies: { profil_declare: "introverti déclaré" } },
  );

  const canned = {
    bridging_plans: [
      {
        dimension: "exposition",
        gap_reading:
          "Le projet exige une vente terrain intensive ; vos réponses indiquent une préférence pour un travail moins exposé.",
        voies: [
          {
            label: "Adapter le projet — canal alternatif",
            description: "Réorienter l'acquisition vers un canal à distance (inbound, contenu, ventes en ligne) qui réduit l'exposition terrain requise.",
            risks: ["Cycle d'acquisition potentiellement plus long"],
            conditions: ["Disposer d'un canal digital crédible"],
          },
          {
            label: "Déléguer — partenariat commercial",
            description: "S'associer à un profil commercial qui porte la vente terrain, le porteur restant sur la production.",
            risks: ["Partage de valeur et dépendance au partenaire"],
            conditions: ["Trouver un associé aligné"],
          },
          {
            label: "Acquérir — montée en compétence",
            description: "Se former progressivement à la prospection et à la vente en présentiel, par paliers.",
            risks: ["Courbe d'apprentissage sur la période de lancement"],
            conditions: ["Temps de formation dégagé"],
          },
        ],
      },
    ],
    summary_md:
      "Vos réponses indiquent une préférence pour un travail moins exposé, alors que le projet suppose une vente terrain intensive. Trois voies sont possibles ; la décision vous appartient.",
    quality_self: 80,
  };

  const envelope = await runFounderProjectMatcher(input, { callModel: mockModel(canned) });

  // Pas de throw ⇒ validateOutputEnvelope n'a retourné aucune violation.
  assert.ok(envelope.solutionPaths.length >= 1, "au moins un solution_path attendu");
  assert.equal(envelope.solutionPaths.length, 3, "les 3 voies deviennent 3 chemins");
  assert.ok(envelope.threeWays && envelope.threeWays.length === 3, "🔀 trois voies attendues");
  assert.equal(envelope.deliverable.type, "gap_bridging");
});

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (2) — Match parfait : dit SIMPLEMENT, sans inflation, aucun obstacle imposé.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(2) — match parfait : dit simplement, pas d'obstacle imposé", async () => {
  const input = makeInput(
    "match_scoring",
    { requirements: { competences: "…", exposition: "…", capital: "…", rythme: "…" } },
    { competencies: { metier: "aligné" } },
  );

  const canned = {
    scores_by_dimension: { competences: 90, exposition: 88, capital: 92, rythme: 90 },
    readings_by_dimension: {
      competences: "Le projet exige X ; vos réponses indiquent une correspondance.",
      exposition: "Exposition requise cohérente avec le profil.",
      capital: "Capital requis couvert.",
      rythme: "Rythme requis compatible.",
    },
    bridging_hints: [],
    summary_md:
      "Les quatre dimensions sont alignées avec ce que le projet exige. La décision d'engagement vous appartient.",
    quality_self: 85,
  };

  const envelope = await runFounderProjectMatcher(input, { callModel: mockModel(canned) });
  const sd = envelope.structuredData as { composite_v3: number; gap_map: unknown[] };

  assert.equal(envelope.solutionPaths.length, 0, "aucun chemin imposé sur un match aligné");
  assert.equal(sd.gap_map.length, 0, "aucun écart");
  assert.equal(sd.composite_v3, 90, "composite = moyenne des dimensions (90)");
  assert.equal(envelope.deliverable.type, "match_report");
});

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (3) — V3 n'est JAMAIS un veto seul : un écart au scoring est TOUJOURS
// accompagné d'au moins un solution_path (D25), enveloppe conforme.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(3) — écart au scoring : V3 jamais un veto, solution_path ≥ 1", async () => {
  const input = makeInput(
    "match_scoring",
    { requirements: { exposition: "vente terrain intensive" } },
    { competencies: { profil_declare: "introverti déclaré" } },
  );

  const canned = {
    scores_by_dimension: { competences: 80, exposition: 25, capital: 70, rythme: 75 },
    readings_by_dimension: {
      exposition: "Le projet exige une exposition commerciale forte ; vos réponses indiquent une préférence pour le retrait.",
    },
    bridging_hints: [
      { dimension: "exposition", hint: "Envisager un canal d'acquisition à distance ou un partenariat commercial." },
    ],
    summary_md:
      "Un écart est identifié sur l'exposition ; des pistes existent. La décision vous appartient.",
    quality_self: 78,
  };

  const envelope = await runFounderProjectMatcher(input, { callModel: mockModel(canned) });
  const sd = envelope.structuredData as {
    composite_v3: number;
    gap_map: Array<{ dimension: string }>;
  };

  assert.ok(envelope.solutionPaths.length >= 1, "un écart doit porter au moins un chemin (D25)");
  assert.equal(sd.gap_map.length, 1, "un seul écart (exposition)");
  assert.equal(sd.gap_map[0]?.dimension, "exposition");
  // composite = round((80+25+70+75)/4) = round(62.5) = 63
  assert.equal(sd.composite_v3, 63);
});
