# @ftg/orchestrator

Implémente les cinq composants du Chantier 4 §4 :

| Composant | Rôle |
|---|---|
| `sequencer/` | Dérive les états `locked/available/recommended` du DAG de jalons, calcule le chemin recommandé |
| `router/` | Constitue l'enveloppe d'entrée d'un engine (état canonique + digests + profils + lentilles géo) |
| `diffuser/` | Journalise chaque événement (digest structuré) et met à jour l'état canonique (vue matérialisée) |
| `gatekeeper/` | Calcule les scores composites et verdicts de gate — **côté serveur uniquement** |
| `supervisor/` | File de runs, quotas, retries, SLA (30s structuration / 5min run standard / profond avec ETA) |

Aucun engine n'appelle un autre engine directement : tout transite par ce package (principe d'architecture #1, Chantier 4 §0).

Point d'entrée du Lot 1 : `sequencer` + seed du référentiel suffisent à faire progresser un projet test dans le DAG (critère de "done" du Lot 1).
