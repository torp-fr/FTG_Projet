# @ftg/data-sources

Couche de **clients de sources de données FR**, réutilisable par les engines (E4/E5…).
Chaque client est **`server-only`** (les clés ne fuient jamais côté navigateur) et suit
quatre règles :

1. **Clé depuis l'env serveur** (ou keyless).
2. **Niveau waterfall** de la source respecté.
3. **Dégradation propre** : en cas d'indisponibilité / erreur / quota, le client **ne
   plante pas** — il renvoie un résultat vide/partiel marqué `isEstimate: true` +
   `method` (grounding honnête, **jamais de donnée inventée présentée comme un fait**).
4. **Citation bien formée** (A5.4) : `source` (nom aligné sur le registre `data_sources`)
   + `date` réelle, mappable directement vers `deliverables.sources`.

Chaque appel renvoie un `SourceResult<T>` : `{ data, citation, degraded, waterfallLevel }`.

## Sources

| Client | Source (registre) | Clé | Waterfall | Endpoint (vérifié) |
|---|---|---|---|---|
| `rechercheEntreprises` | Annuaire des Entreprises (data.gouv) | **keyless** | N1 | `GET https://recherche-entreprises.api.gouv.fr/search` (`q`, `activite_principale`, `departement`, `code_commune`, `per_page`) |

> **Qualification par activité (anti faux-positif).** `rechercheEntreprises` accepte `nafCodes: string[]` → mappé sur `activite_principale` (valeurs multiples séparées par des virgules). Un concurrent se qualifie par son **code NAF/APE**, pas par son nom : la seule recherche plein-texte `q` ramène des faux positifs matchés sur la dénomination (ex. SIREN `479678757` « MENUISERIE » codé `68.20B` « location immobilière » — pas un menuisier). Vérifié empiriquement : `q` + `activite_principale` se combinent en **AND** (le nom surface les concurrents nommés, le NAF rejette les hors-activité). Le libellé NAF n'est **pas** fourni par cet endpoint — l'engine le renseigne depuis la nomenclature sectorielle dérivée.
| `sireneInsee` | API Sirene (INSEE) | `INSEE_SIRENE_API_KEY` (en-tête `X-INSEE-Api-Key-Integration`) | N1 | `GET https://api.insee.fr/api-sirene/3.11/siret/{siret}` (nouveau portail portail-api.insee.fr) |
| `pappers` | API Pappers | `PAPPERS_API_KEY` (`api_token`) | N2 | `GET https://api.pappers.fr/v2/entreprise?siren={siren}` |
| `bodacc` | BODACC (open data) | **keyless** | N1 | `GET https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/.../records` (opendatasoft) |

## Règle de dégradation

- **Recherche d'Entreprises / BODACC** (keyless) : si l'API répond en erreur/timeout →
  liste vide + `isEstimate: true` + `method` expliquant l'absence. La cartographie n'est
  jamais complétée par des concurrents fictifs.
- **Sirene** : clé absente ou API en erreur → `null` + `isEstimate`. L'établissement
  reste « non vérifié » (pas d'invention).
- **Pappers** : quotas limités (**100 crédits gratuits**). Borne `PAPPERS_MAX_CALLS_PER_RUN`
  (≤ 10 fiches/run) côté engine + log de consommation. Quota épuisé / erreur →
  `available: false` + `isEstimate` + `method` (« santé financière non sourcée / relevé
  reporté »). **La clé n'apparaît jamais dans la citation** (URL publique sans `api_token`).

## Sécurité

Garde « serveur uniquement » (`src/server-guard.ts`) en tête de chaque client : elle lève
si le module est chargé dans un bundle **navigateur**. On n'utilise pas le paquet npm
`server-only` (qui s'appuie sur la condition `react-server` de Next et lève sous Node/tsx,
là où tournent les engines) : la garde runtime préserve la même intention sans casser les
engines. Les clés sont lues via `process.env` côté serveur uniquement, et n'apparaissent
jamais dans les métadonnées de citation.
