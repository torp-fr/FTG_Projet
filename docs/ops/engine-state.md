# État des engines (cohérence D2/D3)

> Les rows `engines` / `engine_versions` sont des **données opérationnelles** en base
> (`ftg-plateforme`, ref `zhkrpnjfqrrtfuddqznt`), pas des artefacts de repo. Ce document
> trace leur état pour auditabilité (le repo ne versionne pas ces statuts).

## Sprint 0 — S0.2 : promotion de cohérence (2026-07-12)

**Constat** : E1, E2, E3, E5 étaient `engine active` mais `version candidate` (incohérence
d'état — un engine actif doit servir une version active). `deterministic_core` était
`engine draft` alors qu'il est opérationnel et consommé par E7/E8.

**Action** : smoke réel de chaque engine concerné (vert exigé avant promotion), puis
promotion `candidate → active` de la version courante ; `deterministic_core` `draft → active`.

| Engine | Code | Smoke réel | Avant | Après |
|---|---|---|---|---|
| E1 | `founder_profiler` | ✅ (incarnation_report) | version candidate | version **active** |
| E2 | `founder_project_matcher` | ✅ (match_report) | version candidate | version **active** |
| E3 | `ideation_funnel` | ✅ (selection_brief) | version candidate | version **active** |
| E5 | `competitive_watch` | ✅ (competitive_map, 25 concurrents) | version candidate | version **active** |
| — | `deterministic_core` | (module déterministe pur, testé par golden) | engine draft | engine **active** |

**État final** (vérifié) — 8 engines LLM `active` avec **exactement une** version `active`
courante (`founder_profiler`, `founder_project_matcher`, `ideation_funnel`,
`competitive_watch`, `market_cartographer`, `legal_architect`, `tax_educator`,
`name_forge`) ; `deterministic_core` `active` (sans version LLM) ; `proof_witness` reste
`draft` (engine non encore construit). **Plus aucun engine actif avec version candidate.**

Note : aucun mécanisme de promotion applicatif (`version.promote` sous verrou
anti-régression) n'existe encore côté code — la promotion a été faite en SQL après
validation du smoke. À terme, câbler la promotion sur `eval_runs.passed` (cf. commentaire
de la table `engine_versions` : « candidate ne devient active que si eval_runs.passed = true »).
