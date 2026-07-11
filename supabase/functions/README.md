# supabase/functions

Edge Functions = surface API de l'orchestrateur (Chantier 4 §5) : `onboarding.*`, `dag.state`, `milestone.*`, `evidence.*`, `run.*`, `gate.*`, `board.*`, `cohort.dashboard`, `project.report`, `committee.analyze`, `override.log`, `llm.*`, `eval.*`, `watch.*`.

Chaque fonction applique RLS et ne calcule/retourne un verdict de gate que côté serveur — jamais côté client.
