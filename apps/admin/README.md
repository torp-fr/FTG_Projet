# apps/admin — Console Admin FTG (JC-07)

Console opérateur FTG. Réutilise le design system (Tailwind slate) et l'accès data
typé `@ftg/database` (service_role, serveur uniquement) des apps porteur / cockpit-b2b.

Port dev : `3003` (`pnpm --filter @ftg/admin dev`).

## Périmètre (JC-07)
- **Supervision** (lecture pure) — organisations / projets (cohorte seedée + runs réels
  JC-05), fiche projet : `project_milestones`, `gate_evaluations` (+ réserves), `engine_runs`
  (coût / tokens / quality_self), `project_journal`, `events`. Aucune écriture.
- **Impersonation tracée** — « voir-comme » un porteur en lecture seule, bannière permanente,
  **audit trail append-only immuable** (`admin_audit_log`) : impossible d'impersonate sans trace.
- **`version.promote` sous verrous** — promotion `candidate → active` d'une version d'engine
  seulement si le smoke réel passe ; **exactement une** version active par engine (transaction +
  index unique partiel) ; refus et rollback tracés dans l'audit.
- **Comptes pilotes B2B2C** — provisioning avec niveau d'accès (`freemium` / `partiel` /
  `complet`), rattachement à une organisation, création tracée.

## Garde-fous
- Tout acte opérateur (impersonation, promotion, refus, rollback, provisioning) est écrit dans
  `admin_audit_log` — **immuable** (trigger anti UPDATE/DELETE, y compris service_role).
- Auth : garde admin simple (dev). Le durcissement auth complet est JC-08.
