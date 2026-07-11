# @ftg/engine-sdk

Le **contrat d'engine standard** (Chantier 4 §3, Chantier 5 §0). Tout engine (E1..E9 + `deterministic_core`) l'implémente pour rester indépendant et orchestrable.

## Enveloppe d'entrée (fournie par le Router, jamais par l'UI)
`run_id`, `task_type`, `project_context` (état canonique, digests de dépendances, profil fondateur, profil de segment, lentilles géo, historique de décisions), `structured_input`, `constraints` (quotas, canal LLM, profondeur de recherche min = 3, niveaux de pédagogie).

## Enveloppe de sortie (obligatoire et complète)
`deliverable`, `structured_data`, `sources[]` (zéro fait nu — source + date ou `is_estimate` + méthode), `three_ways[]` (si 🔀), `challenge` (si 😈), `scores` (contribution par vecteur V1-V6), `reserves_suggested[]`, `solution_paths[]` (≥1 si obstacle détecté — règle D25 neutralité factuelle), `pedagogy` (3 niveaux), `followups_suggested[]`, `telemetry`.

## Garanties testées par golden sets
Neutralité factuelle (jamais d'« impossible ») · waterfall ≥ 3 niveaux sur toute recherche · idempotence · dégradation propre (jamais d'invention si une source manque) · routage sobre (petit modèle / intermédiaire / frontier selon la tâche).

Ce package expose les helpers communs (validation d'enveloppe, builder de `sources[]`, builder de pédagogie 3 niveaux) pour qu'aucun engine ne réimplémente le contrat à sa façon.
