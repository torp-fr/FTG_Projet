/**
 * Tests de CONFORMITÉ D'ENVELOPPE de l'engine E1 (Le Miroir), LLM MOCKÉ.
 *
 * Exécution : `pnpm --filter @ftg/engine-founder-profiler test`
 *   (ou : `npx tsx --test packages/engine-founder-profiler/test/run.test.ts`)
 *
 * Aucun appel réseau, aucun coût API : chaque test injecte un `callModel` factice
 * qui renvoie une réponse canée. On vérifie que l'enveloppe produite passe
 * validateOutputEnvelope SANS violation (neutralité factuelle, sourcing, orientation
 * solution) et respecte les invariants structurels attendus.
 *
 * ⚠️ Hors scope de ces tests : la QUALITÉ du contenu généré (le LLM a-t-il vraiment
 * bien reformulé l'écart, la nature intrinsèque, etc.). Cette évaluation qualitative
 * relève des golden_cases / eval_runs rejoués sur base réelle (Chantier 5), pas de ce
 * test de conformité structurelle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { EngineInputEnvelope } from "@ftg/engine-sdk";
import { runFounderProfiler } from "../src/run.js";
import type { CallModel } from "@ftg/engine-sdk";

/** Construit une enveloppe d'entrée minimale et valide pour E1. */
function makeInput(
  taskType: string,
  structuredInput: Record<string, unknown>,
): EngineInputEnvelope {
  return {
    runId: "run-test-e1",
    taskType,
    projectContext: {
      canonicalState: {},
      dependencyDigests: [],
      founderProfile: {},
      segmentProfile: { code: "generic", name: "Générique", config: {} },
      geoLenses: ["france"],
      decisionsHistory: [],
    },
    structuredInput,
    constraints: {
      quotas: {},
      llmChannel: "pooled",
      // E1 est un engine réflexif (aucune recherche waterfall) → profondeur min = 0.
      researchDepthMin: 0,
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"],
    },
  };
}

/** Fabrique un callModel factice renvoyant systématiquement `canned` (sérialisé JSON). */
function mockModel(canned: unknown): CallModel {
  return async () => JSON.stringify(canned);
}

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN CASE (Chantier 5, E1) — salarié, 10 h/semaine, 5 000 € de capital,
// objectif déclaré « remplacer mon salaire en 3 mois ». Écart ambition/moyens.
//
// Ce que l'on vérifie : l'enveloppe passe validateOutputEnvelope SANS violation, ET
// solutionPaths contient ≥ 1 entrée — l'engine signale l'écart FACTUELLEMENT avec un
// chemin, jamais un simple constat de blocage.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN — écart ambition/moyens : enveloppe conforme + solution_path ≥ 1", async () => {
  const input = makeInput("incarnation_report", {
    employment_status: "salarié",
    objective_declared: "remplacer mon salaire en 3 mois",
    engagement: { hours_week: 10, capital: 5000, horizon_months: 3 },
    competencies: { metier: "développeur" },
    resources: { reseau: "limité" },
    constraints: { emploi: "plein temps" },
    risk_appetite: "modéré",
  });

  const canned = {
    intrinsic_nature: { moteur: "autonomie", preference_travail: "terrain" },
    mantra: "Avancer par petits pas mesurables.",
    internal_objectives: { revenu_cible: "remplacer le salaire" },
    builder_vs_opportunist_reading:
      "Vos réponses indiquent une orientation bâtisseur progressive.",
    deliverable_md:
      "# Rapport d'incarnation\n\nVos réponses indiquent un objectif de remplacement de revenu à horizon court, avec 10 h/semaine et 5 000 € de capital. Un chemin de progression par paliers est proposé ci-dessous.",
    ambition_moyens_gap: {
      detected: true,
      reading:
        "Vos réponses indiquent un objectif de remplacement de salaire à 3 mois pour 10 h/semaine et 5 000 € — un écart entre l'échéance annoncée et les moyens déclarés.",
    },
    solution_paths: [
      {
        title: "Progression par paliers de revenu",
        description: "Décomposer l'objectif en paliers mensuels calibrés sur 10 h/semaine.",
        actions: [
          "Fixer un premier palier à 30 jours",
          "Mesurer le revenu réel obtenu",
          "Réévaluer l'échéance à 3 mois",
        ],
      },
    ],
    three_ways: [],
    challenge: {
      facts: ["10 h/semaine déclarées"],
      risks: ["échéance serrée"],
      conditions: ["disponibilité maintenue"],
    },
    pedagogy: {
      profil: {
        beginner: "Un profil, c'est votre point de départ.",
        intermediate: "Votre profil met en regard objectifs et moyens.",
        advanced: "Le profil alimente le séquencement des jalons P0.",
      },
    },
    quality_self: 78,
    reserves_suggested: ["Préciser le revenu mensuel cible"],
    followups_suggested: ["Quel revenu mensuel précis visez-vous ?"],
  };

  const envelope = await runFounderProfiler(input, { callModel: mockModel(canned) });

  // Pas de throw ⇒ validateOutputEnvelope n'a retourné aucune violation.
  assert.ok(envelope.solutionPaths.length >= 1, "au moins un solution_path attendu");
  assert.equal(envelope.deliverable.type, "incarnation_report");
  assert.equal(envelope.sources.length >= 1, true, "sources non vides");
  // Aucun terme de jugement de faisabilité dans le livrable (sinon throw en amont).
  assert.doesNotMatch(envelope.deliverable.contentMd.toLowerCase(), /impossible/);
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 2 — profil simple SANS écart : l'enveloppe reste conforme, aucun obstacle,
// solution_paths peut légitimement être vide.
// ─────────────────────────────────────────────────────────────────────────────
test("CONFORMITÉ — cas simple sans écart : enveloppe conforme, pas d'obstacle imposé", async () => {
  const input = makeInput("incarnation_report", {
    employment_status: "indépendant",
    objective_declared: "un complément de revenu régulier",
    engagement: { hours_week: 20, capital: 15000, horizon_months: 12 },
    competencies: { metier: "consultant" },
  });

  const canned = {
    intrinsic_nature: { moteur: "complément de revenu" },
    mantra: "Tester sans pression.",
    internal_objectives: {},
    builder_vs_opportunist_reading:
      "Vos réponses indiquent une démarche exploratoire.",
    deliverable_md:
      "# Rapport d'incarnation\n\nVos réponses indiquent un objectif de complément de revenu compatible avec les moyens déclarés.",
    ambition_moyens_gap: { detected: false, reading: "" },
    solution_paths: [],
    three_ways: [],
    pedagogy: {
      profil: { beginner: "A", intermediate: "B", advanced: "C" },
    },
    quality_self: 70,
    reserves_suggested: [],
    followups_suggested: [],
  };

  const envelope = await runFounderProfiler(input, { callModel: mockModel(canned) });

  assert.equal(envelope.solutionPaths.length, 0, "aucun chemin imposé sans écart");
  assert.equal(envelope.deliverable.type, "incarnation_report");
});

// ─────────────────────────────────────────────────────────────────────────────
// CAS 3 — incohérence (« temps illimité + 2 enfants + emploi plein ») : l'engine doit
// produire des QUESTIONS DE CLARIFICATION, pas une validation complaisante.
// ─────────────────────────────────────────────────────────────────────────────
test("CONFORMITÉ — incohérence : questions de clarification, pas de validation complaisante", async () => {
  const input = makeInput("coherence_check", {
    time_declared: "temps illimité",
    dependents: 2,
    employment_status: "emploi à plein temps",
  });

  const canned = {
    coherent: false,
    incoherences: [
      "Le temps déclaré « illimité » semble en tension avec un emploi à plein temps et deux enfants à charge déclarés.",
    ],
    clarification_questions: [
      "Combien d'heures par semaine pouvez-vous réellement consacrer, compte tenu de votre emploi et de vos enfants ?",
      "Sur quels créneaux ce temps est-il disponible ?",
    ],
    summary_md:
      "Vos réponses indiquent une tension entre le temps annoncé et vos autres engagements déclarés.",
    quality_self: 65,
  };

  const envelope = await runFounderProfiler(input, { callModel: mockModel(canned) });

  // Enveloppe conforme (pas de throw) + clarifications présentes = pas de complaisance.
  assert.ok(
    envelope.followupsSuggested.length >= 1,
    "des questions de clarification sont attendues",
  );
  assert.equal(
    (envelope.structuredData as { coherent?: boolean }).coherent,
    false,
    "l'incohérence est signalée, pas validée",
  );
});
