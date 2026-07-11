# supabase/seed

Seed du Lot 1 :

- `referentiel_v1.1.json` → 10 phases, 70 jalons, DAG de dépendances, 10 gates (pondérations Chantier 1 §5), 6 vecteurs
- `segments_v1.json` → 8 profils de segment complets (Chantier 2 §B2)
- `data_sources.json` → registre des sources (Chantier 3 §2), niveau waterfall par défaut, statut d'activation
- `golden_cases_seed.json` → premiers cas de référence par engine (Chantier 5, un échantillon par fiche)

Ces fichiers sont la source ; le script de seed (`scripts/lot1/seed.ts`, à écrire) les injecte via l'API Supabase.
