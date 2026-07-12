/**
 * Handler task_type = vitality_signals (RÉEL, N1 BODACC).
 * Créations / ventes / procédures collectives récentes du secteur (signaux de
 * vitalité/défaillance), datés et sourcés.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import { citationToSource, waterfallDepth, type E5Handler } from "../deps.js";

export const vitalitySignals: E5Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as { keywords?: string; departement?: string };
  const q = (si.keywords || "").trim() || "entreprise";
  const departement = (si.departement || "").trim() || undefined;

  const b = await deps.sources.bodacc({ q, departement, limit: 20 });
  const signals = b.data;
  const creations = signals.filter((s) => /cr[ée]ation/i.test(s.type)).length;
  const defaillances = signals.filter((s) => /proc[ée]dure/i.test(s.type)).length;
  const note = `${signals.length} annonce(s) BODACC pour « ${q} »${departement ? ` (dép. ${departement})` : ""} — ${creations} création(s), ${defaillances} procédure(s) collective(s).`;

  const sources: SourceCitation[] = [citationToSource(b.citation, `Signaux de vitalité/défaillance BODACC « ${q} ».`)];

  return {
    partial: {
      deliverable: { title: "Signaux de vitalité (E5 · La Vigie)", contentMd: note, type: "vitality_signals" },
      structuredData: { vitality: signals, creations, defaillances },
      sources,
      scores: { qualitySelf: b.degraded ? 40 : 70, vectorContributions: {} },
      telemetry: { researchDepthReached: waterfallDepth([b]), modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
