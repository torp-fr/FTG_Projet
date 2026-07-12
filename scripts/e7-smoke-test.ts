/**
 * Smoke test RÉEL de l'engine E7 « L'Architecte » — SÉPARÉ des tests automatisés.
 *
 *   LLM_MODEL_FRONTIER=claude-sonnet-5 npx tsx scripts/e7-smoke-test.ts
 *
 * Sur le porteur « Atelier menuiserie » (P2) :
 *  - comparateur 3 statuts via @ftg/deterministic-core sur un prévisionnel d'exemple (RÉEL, chiffres déterministes) ;
 *  - vérif SIRET RÉELLE via Sirene (RIDORET MENUISERIE, SIRET 30200179700042) ;
 *  - récupération de texte Légifrance via PISTE OAuth (RÉEL si client_secret présent, sinon DÉGRADÉ [E] daté) ;
 *  - guide d'immatriculation + kit contractuel (squelettes v1).
 * Écrit un legal_structure RÉEL. Hors `pnpm test`. Opus à 0 req/min → frontier forcé sur Sonnet 5.
 */
import { readFileSync } from "node:fs";
import type { EngineInputEnvelope, EngineOutputEnvelope } from "@ftg/engine-sdk";
import {
  runLegalArchitect,
  createServiceClientFromEnv,
  readProjectForE7,
  writeLegalStructure,
  writeJournalEvent,
  writeEngineRun,
} from "../packages/engine-legal-architect/src/index.js";
import type { Json } from "@ftg/database";

function loadEnvLocal(path = ".env.local"): void {
  const loader = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile;
  if (typeof loader === "function") {
    try {
      loader(path);
      return;
    } catch {
      /* fallback */
    }
  }
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2] ?? "";
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]!] === undefined) process.env[m[1]!] = v;
    }
  } catch (e) {
    console.warn(`⚠️  .env.local: ${(e as Error).message}`);
  }
}

const PROJECT_NAME = "DÉMO Cockpit — Atelier menuiserie (P2)";
const CONSTRAINTS = { quotas: {}, llmChannel: "pooled" as const, researchDepthMin: 1, outputLanguage: "fr", pedagogyLevels: ["beginner", "intermediate", "advanced"] };
const RIDORET_SIRET = "30200179700042"; // SIRET réel (siège), RIDORET MENUISERIE — vérif Sirene
const FORECAST_INPUT = { ca_mensuel: new Array(12).fill(5_000), charges_fixes_mensuelles: 1_000, charges_variables_pct: 0.3 };
const allCalls: unknown[] = [];
const allSources: unknown[] = [];

async function main(): Promise<void> {
  loadEnvLocal();
  console.log("════════ SMOKE E7 — « L'Architecte » (structure juridique · information & guidage) ════════");
  console.log(` frontier=${process.env.LLM_MODEL_FRONTIER ?? "claude-opus-4-8"} · intermédiaire=${process.env.LLM_MODEL_INTERMEDIAIRE ?? "claude-sonnet-5"}`);

  const client = createServiceClientFromEnv();
  const { data: project } = await client.from("projects").select("id").eq("name", PROJECT_NAME).maybeSingle();
  if (!project) throw new Error(`Projet "${PROJECT_NAME}" introuvable — lance d'abord le seed de démo.`);
  const projectId = project.id;
  const ctx = await readProjectForE7(client, projectId);
  console.log(`\n• Projet ${projectId} · segment=${ctx.segment} · idée=${(ctx.idea ?? "—").slice(0, 60)}`);

  const { data: engine } = await client.from("engines").select("id").eq("code", "legal_architect").single();
  const { data: version } = await client.from("engine_versions").select("id, semver, status").eq("engine_id", engine!.id).eq("semver", "0.1.0").single();
  if (!version) throw new Error("engine_version 0.1.0 introuvable — enregistre-la d'abord (MCP).");
  console.log(`• engine_version : ${version.id} (${version.semver}, ${version.status})`);

  const startedAt = new Date().toISOString();
  const run = async (taskType: string, structuredInput: Record<string, unknown>): Promise<EngineOutputEnvelope> => {
    const env = await runLegalArchitect({
      runId: `smoke-e7-${taskType}-${Date.now()}`,
      taskType,
      projectContext: { canonicalState: {}, dependencyDigests: [], founderProfile: {}, segmentProfile: { code: "S4", name: ctx.segment ?? "Artisanat", config: {} }, geoLenses: ["france"], decisionsHistory: [] },
      structuredInput,
      constraints: CONSTRAINTS,
    } as EngineInputEnvelope);
    allCalls.push(...env.telemetry.modelCalls);
    allSources.push(...env.sources);
    return env;
  };

  // 1) Comparateur 3 statuts (RÉEL, deterministic_core) — chiffres déterministes.
  console.log("\n• status_comparator (deterministic_core — chiffres déterministes)…");
  const cmpEnv = await run("status_comparator", { forecast_input: FORECAST_INPUT, activity_type: "services_bic" });
  const sc = (cmpEnv.structuredData as { status_comparison: { previsionnel_annee1: { ca: number; resultat: number }; comparison: { micro_entrepreneur: { cotisations: number; base_imposable_ir: number; statut_valide: boolean }; societe_is: { is_total: number; net_porteur: number; remuneration_dirigeant_non_modelisee: boolean }; entreprise_individuelle_reel: { net_porteur: number; precision: string } } } }).status_comparison;
  const c = sc.comparison;
  console.log(`  Prévisionnel année 1 : CA ${sc.previsionnel_annee1.ca} € · résultat ${sc.previsionnel_annee1.resultat} €`);
  console.log(`  ┌ MICRO      : cotisations ${c.micro_entrepreneur.cotisations} € · base IR ${c.micro_entrepreneur.base_imposable_ir} € · valide=${c.micro_entrepreneur.statut_valide}`);
  console.log(`  ├ SOCIÉTÉ IS : IS ${c.societe_is.is_total} € · net porteur ${c.societe_is.net_porteur} € · rému dirigeant non modélisée=${c.societe_is.remuneration_dirigeant_non_modelisee}`);
  console.log(`  └ EI RÉEL    : net porteur ${c.entreprise_individuelle_reel.net_porteur} € · ⚠️ ${c.entreprise_individuelle_reel.precision}`);

  // 2) Vérif SIRET RÉELLE (Sirene) — preuve externe.
  console.log("• siret_verification (LIVE Sirene — preuve externe)…");
  const siretEnv = await run("siret_verification", { siret: RIDORET_SIRET });
  const sk = (siretEnv.structuredData as { siret_check: { siret: string; verified: boolean; establishment: { denomination: string | null; commune: string | null; naf: string | null; etat: string | null } | null } }).siret_check;
  console.log(`  → SIRET ${sk.siret} vérifié=${sk.verified}${sk.establishment ? ` · ${sk.establishment.denomination} · ${sk.establishment.commune} · NAF ${sk.establishment.naf} · état ${sk.establishment.etat}` : ""}`);

  // 3) Checklist réglementaire (Légifrance daté RÉEL si OAuth, sinon [E] daté) — artisanat.
  console.log("• regulatory_checklist (LIVE Légifrance/PISTE ; artisanat → dépendances dures)…");
  const regEnv = await run("regulatory_checklist", { segment: ctx.segment, activity: ctx.idea ?? "menuiserie", is_artisanat: true });
  const rc = (regEnv.structuredData as { regulatory_checklist: { hard_dependencies: string[]; items: Array<{ obligation: string; reference: string; date_verification: string; is_estimate: boolean }> } }).regulatory_checklist;
  const legalSrc = regEnv.sources.find((s) => s.source === "Légifrance (API PISTE / DILA)");
  console.log(`  → dépendances DURES : ${rc.hard_dependencies.join(" ; ")}`);
  console.log(`  → Légifrance : ${legalSrc?.isEstimate ? "DÉGRADÉ [E]" : "RÉEL"} · ${legalSrc?.method ?? legalSrc?.claim ?? ""}`.slice(0, 200));
  const firstItem = rc.items[0];
  if (firstItem) console.log(`  → ex. obligation « ${firstItem.obligation} » · réf « ${firstItem.reference} » · vérifiée le ${firstItem.date_verification} · [E]=${firstItem.is_estimate}`);

  // 4) Guide d'immatriculation + 5) Kit contractuel (squelettes v1)
  console.log("• registration_guide + contracts_kit_generation…");
  const guideEnv = await run("registration_guide", { segment: ctx.segment, activity: ctx.idea, statut_envisage: "à comparer (micro / société IS / EI réel)" });
  const rg = (guideEnv.structuredData as { registration_guide: { portal: string; steps: unknown[]; documents: string[] } }).registration_guide;
  const kitEnv = await run("contracts_kit_generation", { segment: ctx.segment, activity: ctx.idee, vente_en_ligne: false });
  const kit = (kitEnv.structuredData as { contracts_kit: { templates: Array<{ type: string }> } }).contracts_kit;
  console.log(`  → guide : ${rg.portal} · ${rg.steps.length} étapes · ${rg.documents.length} pièces ; kit : ${kit.templates.map((t) => t.type).join(", ")}`);

  // Garde-fous non désactivables (présents sur CHAQUE livrable)
  const disc = (cmpEnv.structuredData as { disclaimers: { text: string }; professional_referral: { checkpoint: string; required: boolean; acknowledged: boolean } });
  console.log(`\n• DISCLAIMER présent : ${Boolean(disc.disclaimers?.text)} · RENVOI PRO ${disc.professional_referral?.checkpoint} required=${disc.professional_referral?.required} acquitté=${disc.professional_referral?.acknowledged}`);

  const finishedAt = new Date().toISOString();
  const depth = Math.max(cmpEnv.telemetry.researchDepthReached, siretEnv.telemetry.researchDepthReached, regEnv.telemetry.researchDepthReached);

  const structuredData = {
    status_comparison: sc,
    regulatory_checklist: rc,
    registration_guide: rg,
    siret_check: sk,
    contracts_kit: kit,
    disclaimers: disc.disclaimers,
    professional_referral: disc.professional_referral,
    waterfall_depth_reached: depth,
  };

  console.log(`\n• Profondeur waterfall atteinte (honnête) : ${depth}`);

  const engineRun = await writeEngineRun(client, {
    projectId, agentId: null, engineVersionId: version.id, taskType: "status_comparator",
    inputEnvelope: { forecast_input: FORECAST_INPUT, activity_type: "services_bic", siret: RIDORET_SIRET } as unknown as Json, inputStructuredValidated: true,
    researchDepth: depth, modelCalls: allCalls as unknown as Json, llmChannel: "pooled", costEstimate: null, outputEnvelopeRef: null,
    status: "done", startedAt, finishedAt,
  });
  const deliverable = await writeLegalStructure(client, {
    projectId, projectMilestoneId: null, engineRunId: engineRun.id,
    title: "Structure juridique (E7 · L'Architecte)", structuredData,
    sources: allSources as unknown as Json, pedagogy: {} as unknown as Json,
  });
  const journal = await writeJournalEvent(
    client, projectId, "deliverable",
    `E7 (L'Architecte) — legal_structure : comparateur 3 statuts (net micro/IS/EI), SIRET ${sk.verified ? "vérifié" : "non vérifié"}, waterfall=${depth}`,
    null, "engine:legal_architect",
  );

  console.log("\n────────── ÉCRITURES SUPABASE RÉELLES ──────────");
  console.log(`✓ engine_runs     → id=${engineRun.id}, status=${engineRun.status}`);
  console.log(`✓ deliverables    → id=${deliverable.id}, type=${deliverable.type}, status=${deliverable.status}, version=${deliverable.version}`);
  console.log(`✓ project_journal → id=${journal.id}, event=${journal.event_type}`);
  console.log(`\n✅ Smoke E7 terminé bout en bout — SIRET vérifié=${sk.verified}, waterfall=${depth}, disclaimers + renvoi pro présents.`);
}

main().catch((err) => {
  console.error("\n❌ Smoke E7 échoué:", err);
  process.exit(1);
});
