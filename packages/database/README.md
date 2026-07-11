# @ftg/database

Client Supabase typé. `src/types.ts` est **généré depuis le schéma réel** du projet `ftg-plateforme` (`mcp__Supabase__generate_typescript_types`, appliqué au Lot 1 juste après les 8 migrations) — pas depuis une lecture statique des fichiers `.sql`, donc garanti à jour avec ce qui tourne réellement en base. Régénérer après toute nouvelle migration : `pnpm --filter @ftg/database regen-types`.

`src/client.ts` expose deux constructeurs :
- `createFtgClient(url, anonKey)` — clé anonyme, RLS appliquée, pour les `apps/*` (porteur, cockpit-b2b, admin)
- `createFtgServiceClient(url, serviceRoleKey)` — clé service_role, bypass RLS, **réservé aux fonctions serveur** (Gatekeeper, Sequencer, Diffuser) — jamais instancié côté client/navigateur (principe #2, Chantier 4 §0)

Ne contient aucune logique métier — uniquement l'accès data typé, consommé par `orchestrator` et les `apps/*`. RLS appliquée systématiquement (Chantier 4 §6) : ce package ne doit jamais exposer de requête qui contourne les policies.
