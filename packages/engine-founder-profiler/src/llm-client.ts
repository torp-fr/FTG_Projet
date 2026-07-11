/**
 * Fondation de l'engine E1 : wrapper LLM (Anthropic) + utilitaires partagés par les
 * task-handlers.
 *
 * Routage sobre (Chantier 5 §0, garantie #5) : chaque tâche déclare son tier
 * (petit / intermédiaire / frontier), mappé vers un modèle Claude via trois variables
 * d'environnement à défauts raisonnables. `callModel` est INJECTABLE/MOCKABLE : les
 * tests unitaires passent un faux `callModel` — zéro appel réseau, zéro coût API.
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  EngineInputEnvelope,
  EngineOutputEnvelope,
  LlmChannel,
  SolutionPath,
  ThreeWayOption,
} from "@ftg/engine-sdk";

// ============================================================
// Tiers & routage modèle
// ============================================================

export type LlmTier = "petit" | "intermediaire" | "frontier";

/** Signature injectable/mockable. Retourne le texte concaténé de la réponse du modèle. */
export type CallModel = (
  tier: LlmTier,
  systemPrompt: string,
  userPrompt: string,
) => Promise<string>;

/**
 * Mapping tier → modèle Claude. Défauts = modèles Claude actuels (vérifiés sur la doc
 * Anthropic le 11/07/2026) : petit = Haiku 4.5, intermédiaire = Sonnet 5,
 * frontier = Opus 4.8. Surchargeable par LLM_MODEL_PETIT / LLM_MODEL_INTERMEDIAIRE /
 * LLM_MODEL_FRONTIER.
 */
export function resolveModel(
  tier: LlmTier,
  overrides?: Partial<Record<LlmTier, string>>,
): string {
  const fromEnv: Record<LlmTier, string | undefined> = {
    petit: process.env.LLM_MODEL_PETIT,
    intermediaire: process.env.LLM_MODEL_INTERMEDIAIRE,
    frontier: process.env.LLM_MODEL_FRONTIER,
  };
  const defaults: Record<LlmTier, string> = {
    petit: "claude-haiku-4-5",
    intermediaire: "claude-sonnet-5",
    frontier: "claude-opus-4-8",
  };
  return overrides?.[tier] ?? fromEnv[tier] ?? defaults[tier];
}

/** Budget de sortie par tier (non-streaming, sous le seuil de timeout SDK). */
const MAX_TOKENS_BY_TIER: Record<LlmTier, number> = {
  petit: 4096,
  intermediaire: 4096,
  frontier: 8000,
};

export interface CallModelDeps {
  /** Client Anthropic injectable (défaut : new Anthropic(), lit ANTHROPIC_API_KEY). */
  client?: Anthropic;
  /** Surcharge du mapping tier→modèle (sinon env puis défauts). */
  models?: Partial<Record<LlmTier, string>>;
}

/**
 * Fabrique un CallModel réel. Le client Anthropic n'est construit qu'au PREMIER appel
 * (lazy) afin que l'import du module en test n'exige jamais de clé API.
 */
export function createCallModel(deps: CallModelDeps = {}): CallModel {
  let client = deps.client ?? null;
  return async (tier, systemPrompt, userPrompt) => {
    if (!client) client = new Anthropic(); // lit ANTHROPIC_API_KEY
    const model = resolveModel(tier, deps.models);
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS_BY_TIER[tier],
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  };
}

/** CallModel réel par défaut (client construit à la première invocation). */
export const callModel: CallModel = createCallModel();

// ============================================================
// Contrat des task-handlers
// ============================================================

export interface EngineDeps {
  callModel: CallModel;
  /** Horodatage ISO injectable (déterminisme des tests) ; défaut new Date().toISOString(). */
  now?: () => string;
}

export interface HandlerResult {
  /** Morceaux de l'enveloppe produits par ce handler (assemblés/validés par run.ts). */
  partial: Partial<EngineOutputEnvelope>;
  /**
   * Un obstacle factuel (ex. écart ambition/moyens) a-t-il été identifié ? Si oui, le
   * contrat D25 impose au moins un solution_path — garanti par le handler lui-même.
   */
  obstacleDetected?: boolean;
}

export type TaskHandler = (
  input: EngineInputEnvelope,
  deps: Required<EngineDeps>,
) => Promise<HandlerResult>;

// ============================================================
// Utilitaires partagés
// ============================================================

/**
 * Extrait un objet JSON de la sortie brute d'un modèle (tolère les fences Markdown et
 * le texte parasite autour). Lève si aucun JSON exploitable n'est trouvé.
 */
export function parseJsonObject<T = Record<string, unknown>>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();
  if (!text.startsWith("{")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) text = text.slice(start, end + 1);
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(
      `parseJsonObject: réponse du modèle non parsable en JSON (${(err as Error).message}). Extrait: ${raw.slice(0, 200)}`,
    );
  }
}

/** Ramène un score potentiellement invalide dans [0, 100] (0 par défaut). */
export function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** Entrée de télémétrie pour un appel modèle. Tokens non mesurés en V1 (0). */
export function modelCallEntry(tier: LlmTier, channel: LlmChannel) {
  return { provider: "anthropic", model: resolveModel(tier), tier, tokens: 0, channel };
}

/** Normalise/valide une liste de solution_paths issue du modèle. */
export function normalizeSolutionPaths(v: unknown): SolutionPath[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return {
        title: typeof o.title === "string" ? o.title : "",
        description: typeof o.description === "string" ? o.description : "",
        actions: Array.isArray(o.actions)
          ? o.actions.filter((a): a is string => typeof a === "string")
          : [],
      };
    })
    .filter((p) => p.title !== "" || p.description !== "");
}

/**
 * Chemin de solution neutre par défaut. Sert de filet au contrat D25 : un écart
 * ambition/moyens ne doit JAMAIS être restitué sans au moins un chemin.
 */
export const FALLBACK_SOLUTION_PATH: SolutionPath = {
  title: "Aligner progressivement l'objectif et les moyens",
  description:
    "Vos réponses indiquent un écart entre l'objectif annoncé et les moyens déclarés. Un chemin possible consiste à décomposer l'objectif en jalons intermédiaires calibrés sur les moyens actuels, puis à réévaluer à échéance.",
  actions: [
    "Décomposer l'objectif en paliers mensuels mesurables",
    "Documenter les hypothèses de revenu et de temps disponibles",
    "Fixer une échéance de réévaluation du profil",
  ],
};

/**
 * Garantie D25 côté engine : si un obstacle est détecté mais que le modèle n'a fourni
 * aucun chemin, on injecte un chemin neutre par défaut plutôt que de laisser passer un
 * constat de blocage nu.
 */
export function guaranteeSolutionPath(
  paths: SolutionPath[],
  gapDetected: boolean,
): SolutionPath[] {
  if (gapDetected && paths.length === 0) return [FALLBACK_SOLUTION_PATH];
  return paths;
}

/** Normalise/valide une liste de three_ways issue du modèle (undefined si vide). */
export function normalizeThreeWays(v: unknown): ThreeWayOption[] | undefined {
  if (!Array.isArray(v) || v.length === 0) return undefined;
  return v.map((w) => {
    const o = (w ?? {}) as Record<string, unknown>;
    return {
      label: typeof o.label === "string" ? o.label : "",
      description: typeof o.description === "string" ? o.description : "",
      risks: Array.isArray(o.risks)
        ? o.risks.filter((x): x is string => typeof x === "string")
        : [],
      conditions: Array.isArray(o.conditions)
        ? o.conditions.filter((x): x is string => typeof x === "string")
        : [],
    };
  });
}

/** Sérialise les données déclarées du porteur pour le user prompt. */
export function serializeDeclaredInput(input: EngineInputEnvelope): string {
  return [
    "Données déclarées par le porteur (JSON) :",
    JSON.stringify(input.structuredInput ?? {}, null, 2),
  ].join("\n");
}
