/**
 * Handler task_type = siret_verification (RÉEL, N1 — preuve externe).
 * Vérifie un SIRET en base officielle via sireneInsee (INSEE). Aucun LLM : fait pur.
 * Si le porteur n'est pas encore immatriculé (pas de SIRET), le signale honnêtement.
 */
import type { SourceCitation } from "@ftg/engine-sdk";
import type { EstablishmentInfo, SourceResult } from "@ftg/data-sources";
import { citationToSource, researchDepth, safeSource, type E7Handler } from "../deps.js";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export const siretVerification: E7Handler = async (input, deps) => {
  const si = (input.structuredInput ?? {}) as Record<string, unknown>;
  const siret = str(si.siret).replace(/\s/g, "");
  const now = deps.now();

  if (!siret) {
    const siret_check = { siret: null, verified: false, establishment: null, note: "Aucun SIRET fourni — porteur non encore immatriculé. Vérification à effectuer après immatriculation (Guichet unique)." };
    const sources: SourceCitation[] = [
      {
        claim: "Vérification SIRET.",
        source: "API Sirene (INSEE)",
        date: now,
        url: null,
        isEstimate: true,
        method: "Aucun SIRET à vérifier (porteur non immatriculé) — la preuve externe sera disponible après immatriculation.",
      },
    ];
    return {
      partial: {
        deliverable: { title: "Vérification SIRET (E7 · L'Architecte)", contentMd: siret_check.note, type: "siret_verification" },
        structuredData: { siret_check },
        sources,
        scores: { qualitySelf: 60, vectorContributions: {} },
        telemetry: { researchDepthReached: 1, modelCalls: [] },
      },
      obstacleDetected: false,
    };
  }

  const res: SourceResult<EstablishmentInfo | null> = await safeSource(
    () => deps.sources.sireneInsee(siret),
    null,
    "API Sirene (INSEE)",
    now,
    "Vérification SIRET indisponible — à refaire (INSEE Sirene)",
  );

  const verified = !res.degraded && res.data != null;
  const siret_check = {
    siret,
    verified,
    establishment: res.data,
    note: verified
      ? `SIRET vérifié en base officielle INSEE (état : ${res.data?.etat ?? "?"}).`
      : "SIRET non vérifié (source indisponible ou établissement introuvable) — à confirmer.",
  };

  const sources: SourceCitation[] = [
    citationToSource(res.citation, `Vérification SIRET ${siret} en base officielle (INSEE Sirene) — preuve externe.`),
  ];

  return {
    partial: {
      deliverable: { title: "Vérification SIRET (E7 · L'Architecte)", contentMd: siret_check.note, type: "siret_verification" },
      structuredData: { siret_check },
      sources,
      scores: { qualitySelf: verified ? 85 : 55, vectorContributions: {} },
      telemetry: { researchDepthReached: researchDepth([res]), modelCalls: [] },
    },
    obstacleDetected: false,
  };
};
