# @ftg/database

Client Supabase typé + types générés (`supabase gen types typescript`) à partir du schéma `supabase/migrations/`.

Ne contient aucune logique métier — uniquement l'accès data typé, consommé par `orchestrator` et les `apps/*`. RLS appliquée systématiquement (Chantier 4 §6) : ce package ne doit jamais exposer de requête qui contourne les policies.
