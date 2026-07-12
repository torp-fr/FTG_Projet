/**
 * Tests de CONFORMITÉ D'ENVELOPPE de l'engine E3 (La Forge), LLM MOCKÉ.
 *
 * Exécution : `pnpm --filter @ftg/engine-ideation-funnel test`
 *
 * Zéro appel réseau, zéro coût API. On vérifie la CONFORMITÉ STRUCTURELLE (passe
 * validateOutputEnvelope, bloc challenge 😈, règle des 3 🔀, garde-fou d'accès,
 * traçabilité funnel_journal) — PAS la qualité du contenu LLM (eval_runs, base réelle).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { EngineInputEnvelope, FounderProfileContext } from "@ftg/engine-sdk";
import { FORBIDDEN_FEASIBILITY_TERMS } from "@ftg/engine-sdk";
import { runIdeationFunnel } from "../src/run.js";
import type { CallModel } from "@ftg/engine-sdk";

function makeInput(
  taskType: string,
  structuredInput: Record<string, unknown>,
  founderProfile: FounderProfileContext = {},
): EngineInputEnvelope {
  return {
    runId: "run-test-e3",
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
      // E3 V1 : profondeur 1 = raisonnement paramétrique honnête (waterfall ≥ 3 au Lot 3).
      researchDepthMin: 1,
      outputLanguage: "fr",
      pedagogyLevels: ["beginner", "intermediate", "advanced"],
    },
  };
}

function mockModel(canned: unknown): CallModel {
  return async () => JSON.stringify(canned);
}

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (1) — idée déposée très saturée → 😈 le bloc challenge pose les faits + 3
// variantes latérales RÉELLES (threeWays/solutionPaths), AUCUN terme interdit,
// enveloppe conforme.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(1) — challenge d'une idée saturée : faits + 3 variantes latérales, zéro terme interdit", async () => {
  const input = makeInput("multi_dim_challenge", {
    idea: { title: "Boutique de vente de bougies artisanales en ligne", saturation_declaree: "très saturé" },
  });

  const canned = {
    challenge: {
      facts: [
        "Le segment des bougies artisanales en ligne compte de nombreux acteurs établis (hypothèse à vérifier, pas une donnée mesurée).",
      ],
      risks: [
        "Coût d'acquisition client potentiellement élevé sur un canal encombré.",
        "Différenciation produit difficile à établir rapidement.",
      ],
      conditions: ["Une proposition de valeur nettement distincte serait nécessaire."],
    },
    lateral_variants: [
      { label: "Niche adjacente", description: "Se spécialiser sur un usage précis (ex. bien-être en entreprise) plutôt que le grand public.", risks: ["Marché plus étroit"], conditions: ["Accès à des prescripteurs B2B"] },
      { label: "Canal alternatif", description: "Vendre en marque blanche à des boutiques physiques plutôt qu'en direct en ligne.", risks: ["Marge partagée"], conditions: ["Réseau de revendeurs"] },
      { label: "Modèle par abonnement", description: "Basculer d'une vente unitaire à une box mensuelle thématique.", risks: ["Logistique récurrente"], conditions: ["Rétention suffisante"] },
    ],
    summary_md:
      "Le canal en ligne du segment paraît encombré (hypothèse à vérifier). Trois angles latéraux permettent de reconfigurer l'idée. La décision vous appartient.",
    quality_self: 80,
  };

  const envelope = await runIdeationFunnel(input, { callModel: mockModel(canned) });

  assert.ok(envelope.challenge, "le bloc challenge doit être rempli");
  assert.ok(envelope.challenge!.facts.length >= 1, "des faits posés");
  assert.ok(envelope.challenge!.risks.length >= 1, "des risques posés");
  assert.ok(envelope.threeWays && envelope.threeWays.length === 3, "🔀 3 variantes latérales");
  assert.equal(envelope.solutionPaths.length, 3, "3 chemins de reconfiguration");
  // Aucun terme de jugement de faisabilité dans le livrable (sinon throw en amont).
  const lower = envelope.deliverable.contentMd.toLowerCase();
  for (const term of FORBIDDEN_FEASIBILITY_TERMS) {
    assert.ok(!lower.includes(term), `terme interdit présent: ${term}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (2) — Porte B, profil artisan sans un diplôme requis → aucune idée ne suppose
// ce diplôme sans chemin d'accès explicite (garde-fou même si le modèle omet le chemin).
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(2) — Porte B artisan : chemin d'accès garanti dès qu'une qualification est touchée", async () => {
  const input = makeInput(
    "idea_generation",
    { opportunities: "demande locale de services aux TPE" },
    {
      competencies: { metier: "artisan menuisier" },
      constraints: { qualifications_absentes: "pas de diplôme d'expertise comptable (DEC)" },
    },
  );

  const canned = {
    idea_cards: [
      {
        title: "Atelier de mobilier sur mesure pour commerces",
        rationale_anchor: "S'appuie directement sur le métier d'artisan menuisier déclaré.",
        problem: "Commerces cherchant un agencement bois personnalisé.",
        solution: "Conception et fabrication sur mesure.",
        target: "commerces de proximité",
        business_model: "prestation + marge matière",
        qualification_required: "",
        access_path: "",
      },
      {
        // Idée touchant une qualification ABSENTE, avec access_path VOLONTAIREMENT vide
        // (simule une omission du modèle) → le handler doit garantir un chemin.
        title: "Cabinet de conseil en gestion comptable pour artisans",
        rationale_anchor: "Proximité avec le monde des artisans.",
        problem: "Artisans mal outillés en gestion.",
        solution: "Accompagnement comptable.",
        target: "artisans",
        business_model: "abonnement",
        qualification_required: "diplôme d'expertise comptable (DEC)",
        access_path: "",
      },
    ],
    summary_md: "Deux pistes ancrées sur le profil artisan. La décision vous appartient.",
    quality_self: 75,
  };

  const envelope = await runIdeationFunnel(input, { callModel: mockModel(canned) });
  const cards = (envelope.structuredData as {
    idea_cards: Array<{ qualification_required: string; access_path: string }>;
  }).idea_cards;

  // Garde-fou : toute idée touchant une qualification a un chemin d'accès non vide.
  for (const c of cards) {
    if (c.qualification_required !== "") {
      assert.ok(c.access_path.trim().length > 0, `chemin d'accès manquant pour une qualification requise`);
    }
  }
  const constrained = cards.find((c) => c.qualification_required !== "");
  assert.ok(constrained, "au moins une idée touche une qualification (cas de test)");
  assert.ok(constrained!.access_path.length > 0, "le chemin d'accès a bien été garanti");
  assert.equal(envelope.deliverable.type, "idea_portfolio");
});

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN (3) — Sélection multi-idées → top-3 comparé, motivations tracées dans
// funnel_journal ; conformité STRUCTURELLE de l'enveloppe.
// ─────────────────────────────────────────────────────────────────────────────
test("GOLDEN(3) — selection_brief : top-3 comparé + motivations tracées dans funnel_journal", async () => {
  const input = makeInput("selection_brief", {
    scored_ideas: [
      { idea: "A", weighted_total: 78 },
      { idea: "B", weighted_total: 71 },
      { idea: "C", weighted_total: 64 },
      { idea: "D", weighted_total: 40 },
    ],
  });

  const canned = {
    selection: {
      chosen: "A",
      rationale: "Meilleur alignement profil × demande présumée.",
      top3: [
        { idea: "A", score: 78, rationale: "Alignement fort, exécution simple." },
        { idea: "B", score: 71, rationale: "Bonne marge, demande à confirmer." },
        { idea: "C", score: 64, rationale: "Différenciation intéressante." },
      ],
    },
    funnel_journal_additions: [
      { idea: "A", decision: "kept", motivation: "Retenue en tête : alignement + simplicité." },
      { idea: "B", decision: "kept", motivation: "Conservée comme alternative crédible." },
      { idea: "D", decision: "eliminated", motivation: "Écartée : score composite nettement inférieur." },
    ],
    three_ways: [
      { label: "Aller sur A maintenant", description: "…", risks: ["…"], conditions: ["…"] },
      { label: "Tester A et B en parallèle", description: "…", risks: ["…"], conditions: ["…"] },
      { label: "Approfondir C avant de choisir", description: "…", risks: ["…"], conditions: ["…"] },
    ],
    decision_letter_md: "Trois directions restent défendables ; la décision finale vous appartient.",
    quality_self: 82,
  };

  const envelope = await runIdeationFunnel(input, { callModel: mockModel(canned) });
  const sd = envelope.structuredData as {
    selection: { top3: Array<{ idea: string; rationale: string }> };
    funnel_journal: Array<{ idea: string; decision: string; motivation: string }>;
  };

  assert.equal(sd.selection.top3.length, 3, "top-3 comparé");
  assert.ok(sd.selection.top3.every((t) => t.rationale.length > 0), "chaque idée du top-3 motivée");
  assert.ok(sd.funnel_journal.length >= 1, "funnel_journal tracé");
  assert.ok(sd.funnel_journal.every((j) => j.motivation.length > 0), "chaque décision motivée");
  assert.ok(envelope.threeWays && envelope.threeWays.length === 3, "🔀 règle des 3");
  assert.equal(envelope.deliverable.type, "selection_brief");
});
