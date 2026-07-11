# @ftg/referential

Types + loader du référentiel versionné (Chantier 1 + amendements V1.1, Chantier 2 taxonomie).

Charge depuis Supabase : `referential_versions`, `phases`, `milestones`, `milestone_dependencies` (le DAG), `gates`, `segments`, `segment_milestone_overrides`.

Un projet fige sa `ref_version_id` à la création (migration explicite seulement, jamais automatique — cf. point de calibration Chantier 4 §8.3). Ce package est la seule source de vérité pour "que vaut ce jalon, pour ce segment, à cette version".
