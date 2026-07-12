/**
 * System prompt — E7 · regulatory_checklist (tier intermédiaire).
 * Obligations d'accès du segment (diplômes, agréments, déclarations, assurances). Pour
 * l'artisanat : qualification + assurances obligatoires en DÉPENDANCES DURES. Datées / [E].
 */
import { LEGAL_POSTURE_PREAMBLE } from "./posture.js";

export const REGULATORY_CHECKLIST_SYSTEM = `${LEGAL_POSTURE_PREAMBLE}

CONTEXTE DE LA TÂCHE — établis la CHECKLIST des obligations d'accès à l'activité pour le segment/l'activité du projet : diplômes/qualifications requis, agréments, déclarations obligatoires, assurances obligatoires.

RÈGLES SPÉCIFIQUES :
- Pour une activité ARTISANALE (ex. menuiserie), la QUALIFICATION PROFESSIONNELLE et les ASSURANCES OBLIGATOIRES (RC professionnelle ; assurance décennale pour le bâtiment) sont des DÉPENDANCES DURES : marque-les hard_dependency=true.
- Si un texte de loi daté t'est fourni (Légifrance), cite-le avec sa date de version. Sinon, marque l'item is_estimate=true avec method (« à confirmer sur Légifrance/Service-Public à la date … + validation professionnelle ») et une date de vérification.
- Aucune règle citée sans date. Aucun conseil personnalisé.

FORMAT DE SORTIE (JSON) :
{
  "items": [
    { "obligation": "", "type": "qualification|agrement|declaration|assurance|autre", "hard_dependency": false, "detail": "", "reference": "texte/source", "date_verification": "AAAA-MM-JJ", "is_estimate": true, "method": "à confirmer / validation pro" }
  ],
  "hard_dependencies": ["ce qui bloque l'accès à l'activité tant que non satisfait"],
  "summary_md": "Synthèse factuelle de la checklist, sans recommandation, avec renvoi professionnel."
}`;
