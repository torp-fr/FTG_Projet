/**
 * Handler task_type = competitor_mapping (RÉEL, N1).
 * Dérive activité+zone (LLM) → Recherche d'Entreprises FILTRÉE PAR CODE NAF + Sirene →
 * ≥5 concurrents directs géolocalisés réels QUALIFIÉS PAR LEUR ACTIVITÉ, OU absence
 * CHALLENGÉE (jamais accepter « aucun concurrent » tel quel).
 *
 * Un concurrent se qualifie par son ACTIVITÉ (code NAF), pas par son nom : la recherche
 * plein-texte ramène des faux positifs matchés sur la dénomination (ex. SIREN 479678757
 * « MENUISERIE » codé 68.20B « location immobilière » — PAS un menuisier). On filtre donc
 * sur une liste de codes NAF sectoriels et on ÉCARTE explicitement les hors-activité.
 */
import type { SolutionPath, SourceCitation } from "@ftg/engine-sdk";
import { guaranteeSolutionPath, modelCallEntry, normalizeSolutionPaths, parseJsonObject } from "@ftg/engine-sdk";
import type { Competitor, EstablishmentInfo, SourceResult } from "@ftg/data-sources";
import { citationToSource, waterfallDepth, type E5Handler } from "../deps.js";
import { ACTIVITY_DERIVATION_SYSTEM } from "../prompts/activity-derivation.js";
import { ABSENCE_CHALLENGE_SYSTEM } from "../prompts/absence-challenge.js";

const MIN_DIRECTS = 5;
const ENRICH_TOP = 3;

interface NafCode {
  code?: string;
  label?: string;
}
interface DerivationJson {
  keywords?: string;
  naf_codes?: Array<NafCode | string>;
  departement?: string;
  code_commune?: string;
  rationale?: string;
}
interface AbsenceJson {
  hypotheses?: string[];
  reformulations?: unknown;
  summary_md?: string;
}

/** Concurrent enrichi de son libellé NAF et d'un drapeau de pertinence d'activité. */
type QualifiedCompetitor = Competitor & { nafLabel: string | null; relevant: boolean };

/** Normalise un code NAF pour comparaison : « 43.32A » → « 4332A ». */
function normNaf(s: string): string {
  return s.replace(/[^0-9a-z]/gi, "").toUpperCase();
}
/** Classe NAF (4 premiers caractères, ex. « 4332 ») — granularité de pertinence sectorielle. */
function nafClass(s: string): string {
  return normNaf(s).slice(0, 4);
}

export const competitorMapping: E5Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;

  // 1) Dérivation des paramètres de recherche (LLM, intermédiaire) — dont la LISTE de codes NAF.
  const derivPrompt = [
    "Contexte projet (JSON) :",
    JSON.stringify({ segment: si.segment, idee_retenue: si.idee ?? si.idea ?? si.selection, zone: si.zone }, null, 2),
    "",
    "Dérive les paramètres de recherche de concurrents, selon le schéma JSON.",
  ].join("\n");
  const deriv = parseJsonObject<DerivationJson>(await deps.callModel("intermediaire", ACTIVITY_DERIVATION_SYSTEM, derivPrompt));
  const keywords = (deriv.keywords || (typeof si.keywords === "string" ? si.keywords : "") || "").trim();
  const departement = ((deriv.departement || (typeof si.departement === "string" ? si.departement : "")) || "").trim() || undefined;
  const codeCommune = (deriv.code_commune || "").trim() || undefined;

  // Normalise la liste des NAF sectoriels (accepte objets {code,label} ou chaînes).
  const nafList: NafCode[] = Array.isArray(deriv.naf_codes)
    ? deriv.naf_codes.map((n) => (typeof n === "string" ? { code: n } : n)).filter((n) => (n.code ?? "").trim())
    : [];
  const nafCodes = nafList.map((n) => (n.code ?? "").trim()).filter(Boolean);
  const nafClassSet = new Set(nafCodes.map(nafClass));
  const nafClassLabel = new Map<string, string>();
  for (const n of nafList) {
    const cls = nafClass(n.code ?? "");
    if (cls && n.label && !nafClassLabel.has(cls)) nafClassLabel.set(cls, n.label);
  }
  // On ne peut filtrer par activité que si le LLM a produit des codes NAF fiables.
  const nafFiltering = nafClassSet.size > 0;

  // 2) Recherche des concurrents (RÉEL, N1).
  //    Le filtre NAF (activite_principale) QUALIFIE l'activité : combiné en AND avec le
  //    nom (mots-clés), il surface les concurrents nommés (ex. RIDORET MENUISERIE) tout en
  //    REJETANT les faux positifs matchés sur le nom (ex. « MENUISERIE » codée 68.20B).
  const nafArg = nafFiltering ? { nafCodes } : {};
  const mergeInto = (base: SourceResult<Competitor[]>, add: SourceResult<Competitor[]>): SourceResult<Competitor[]> => {
    if (add.degraded) return base;
    const seen = new Set(base.data.map((c) => c.siren));
    return { ...base, data: [...base.data, ...add.data.filter((c) => c.siren && !seen.has(c.siren))] };
  };

  // Primaire : activité (NAF) + nom (mots-clés) en AND — précis.
  let re = await deps.sources.rechercheEntreprises({ q: keywords || undefined, ...nafArg, departement, codeCommune, perPage: 25 });

  // Repli 1 : élargir le mot-clé EN GARDANT le filtre NAF (jamais relâcher la qualification d'activité).
  if (!re.degraded && re.data.length < MIN_DIRECTS && keywords) {
    const broad = (keywords.split(/\s+/).find((w) => w.length >= 4) ?? keywords).trim();
    if (broad && broad.toLowerCase() !== keywords.toLowerCase()) {
      re = mergeInto(re, await deps.sources.rechercheEntreprises({ q: broad, ...nafArg, departement, codeCommune, perPage: 25 }));
    }
  }
  // Repli 2 (rappel) : si le nom sur-restreint, requête par ACTIVITÉ SEULE (sans nom) — reste qualifiée par NAF.
  if (!re.degraded && re.data.length < MIN_DIRECTS && nafFiltering) {
    re = mergeInto(re, await deps.sources.rechercheEntreprises({ nafCodes, departement, codeCommune, perPage: 25 }));
  }

  // 3) Enrichissement Sirene des premiers (RÉEL, N1) — peut corriger le NAF réel.
  const enrichResults: SourceResult<EstablishmentInfo | null>[] = [];
  const enriched: Competitor[] = [];
  for (const c of re.data.slice(0, ENRICH_TOP)) {
    if (!c.siret) {
      enriched.push(c);
      continue;
    }
    const s = await deps.sources.sireneInsee(c.siret);
    enrichResults.push(s);
    enriched.push(
      !s.degraded && s.data
        ? { ...c, denomination: s.data.denomination ?? c.denomination, naf: s.data.naf ?? c.naf, commune: s.data.commune ?? c.commune }
        : c,
    );
  }
  const rawCompetitors: Competitor[] = [...enriched, ...re.data.slice(ENRICH_TOP)];

  // 4) FILTRE DE PERTINENCE — qualifie chaque entreprise par son ACTIVITÉ (code NAF).
  //    Un résultat dont le NAF n'est pas dans le set sectoriel est écarté (hors activité),
  //    quel que soit son nom. Ex. 479678757 « MENUISERIE » (68.20B) → écarté.
  const qualified: QualifiedCompetitor[] = rawCompetitors.map((c) => {
    const cls = c.naf ? nafClass(c.naf) : "";
    const relevant = nafFiltering ? Boolean(cls) && nafClassSet.has(cls) : true;
    const nafLabel = cls ? nafClassLabel.get(cls) ?? null : null;
    return { ...c, nafLabel, relevant };
  });
  const competitors: QualifiedCompetitor[] = qualified.filter((c) => c.relevant);
  const excluded = qualified
    .filter((c) => !c.relevant)
    .map((c) => ({ siren: c.siren, denomination: c.denomination, naf: c.naf, commune: c.commune, reason: "Hors activité : code NAF hors du périmètre sectoriel dérivé (matché sur le nom, pas l'activité)." }));

  // 5) Challenge d'absence si < 5 directs QUALIFIÉS (on ne relâche pas le filtre pour gonfler le compte).
  const gapDetected = competitors.length < MIN_DIRECTS;
  let solutionPaths: SolutionPath[] = [];
  let absence: { hypotheses: string[]; summary: string } | undefined;
  const modelCalls = [modelCallEntry("intermediaire", input.constraints.llmChannel)];
  if (gapDetected) {
    const absPrompt = [
      `Concurrents directs QUALIFIÉS PAR ACTIVITÉ (code NAF) trouvés : ${competitors.length} (< ${MIN_DIRECTS}).`,
      `Codes NAF sectoriels retenus : ${nafCodes.join(", ") || "(aucun code NAF fiable dérivé)"}.`,
      excluded.length ? `${excluded.length} résultat(s) écarté(s) car hors activité (matchés sur le nom).` : "",
      `Mots-clés d'appoint : « ${keywords} »${departement ? ` · dép. ${departement}` : ""}.`,
      "",
      "Challenge factuellement cette absence, selon le schéma JSON.",
    ].filter(Boolean).join("\n");
    const abs = parseJsonObject<AbsenceJson>(await deps.callModel("intermediaire", ABSENCE_CHALLENGE_SYSTEM, absPrompt));
    absence = { hypotheses: Array.isArray(abs.hypotheses) ? abs.hypotheses : [], summary: abs.summary_md ?? "" };
    solutionPaths = guaranteeSolutionPath(normalizeSolutionPaths(abs.reformulations), true);
    modelCalls.push(modelCallEntry("intermediaire", input.constraints.llmChannel));
  }

  const sources: SourceCitation[] = [
    citationToSource(
      re.citation,
      nafFiltering
        ? `Recherche de concurrents par activité (NAF ${nafCodes.join(", ")})${departement ? ` — dép. ${departement}` : ""}.`
        : `Recherche de concurrents « ${keywords} »${departement ? ` (dép. ${departement})` : ""}.`,
    ),
    {
      claim: "Dérivation des codes NAF sectoriels / de la zone de recherche.",
      source: "Raisonnement E5 (La Vigie)",
      date: deps.now(),
      url: null,
      isEstimate: true,
      method: "Dérivation des codes NAF/zone par raisonnement à partir du segment et de l'idée retenue (pas une donnée mesurée). Le filtrage effectif des concurrents s'appuie sur le code activite_principale renvoyé par le registre.",
    },
    ...enrichResults.map((s) => citationToSource(s.citation, "Vérification d'établissement (Sirene INSEE).")),
  ];

  const nafNote = nafFiltering
    ? `filtrés sur les codes NAF ${nafCodes.join(", ")}${excluded.length ? `, ${excluded.length} hors-activité écarté(s)` : ""}`
    : "sans filtre NAF fiable (dérivation de codes NAF indisponible — pertinence non vérifiée par l'activité)";
  const coverage_note = gapDetected
    ? `${competitors.length} concurrent(s) direct(s) qualifié(s) par activité (< ${MIN_DIRECTS}, ${nafNote}) — absence CHALLENGÉE (hypothèses + reformulations), non validée telle quelle.`
    : `${competitors.length} concurrent(s) direct(s) géolocalisés qualifiés par activité (${nafNote}) via ${re.citation.source}${re.degraded ? " (source dégradée)" : ""}.`;

  return {
    partial: {
      deliverable: { title: "Cartographie concurrentielle (E5 · La Vigie)", contentMd: coverage_note, type: "competitor_mapping" },
      structuredData: {
        competitors,
        excluded,
        coverage_note,
        activity_derivation: {
          keywords,
          naf_codes: nafList,
          naf_filtering: nafFiltering,
          departement: departement ?? null,
          rationale: deriv.rationale ?? "",
        },
        ...(absence ? { absence_challenge: absence } : {}),
      },
      sources,
      solutionPaths,
      scores: { qualitySelf: gapDetected ? 55 : 80, vectorContributions: {} },
      telemetry: { researchDepthReached: waterfallDepth([re, ...enrichResults]), modelCalls },
    },
    obstacleDetected: gapDetected,
  };
};
