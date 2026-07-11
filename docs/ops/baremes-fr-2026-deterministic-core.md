# Barèmes FR 2026 — `@ftg/deterministic-core`

> **Barèmes vérifiés le 11/07/2026 — à revalider par un expert-comptable avant tout
> usage commercial réel.**
>
> Ce moteur produit des chiffres présentés à de vrais porteurs de projet pour arbitrer
> leur statut juridique. Règle du package : **zéro nombre magique inline** — chaque
> taux/plafond/seuil est une constante nommée et sourcée dans
> [`packages/deterministic-core/src/rates/fr-2026.ts`](../../packages/deterministic-core/src/rates/fr-2026.ts).
> Ce document est la trace d'audit des sources.

## Micro-entrepreneur

| Constante | Valeur | Source |
|---|---|---|
| `PLAFOND_CA_MICRO_VENTE` | 203 100 € (2026-2028) | legifiscal.fr — seuils micro-entreprises 2026-2028 |
| `PLAFOND_CA_MICRO_SERVICES` | 83 600 € (2026-2028) | legifiscal.fr — seuils micro-entreprises 2026-2028 |
| `TAUX_COTIS_MICRO_VENTE` | 12,3 % | economie.gouv.fr |
| `TAUX_COTIS_MICRO_SERVICES_BIC` | 21,2 % | economie.gouv.fr |
| `TAUX_COTIS_MICRO_BNC` | 25,6 % | economie.gouv.fr |
| `TAUX_COTIS_MICRO_CIPAV` | 23,2 % | economie.gouv.fr |
| `SEUIL_FRANCHISE_TVA_VENTE_BASE` / `_MAJORE` | 85 000 € / 93 500 € | legifiscal.fr |
| `SEUIL_FRANCHISE_TVA_SERVICES_BASE` / `_MAJORE` | 37 500 € / 41 250 € | legifiscal.fr |
| `ABATTEMENT_MICRO_VENTE` | 71 % | barème micro-fiscal standard |
| `ABATTEMENT_MICRO_SERVICES_BIC` | 50 % | barème micro-fiscal standard |
| `ABATTEMENT_MICRO_BNC` | 34 % | barème micro-fiscal standard |

**Limite V1 connue — franchise TVA :** le contrôle de franchissement est fait sur une
seule année. La vraie règle du **seuil de base** s'apprécie sur **deux années civiles
consécutives** (le franchissement du **seuil majoré** fait, lui, basculer à la TVA dès
le mois de dépassement). Le champ `franchise_tva.note` du résultat le rappelle.

**Abattements micro-fiscaux (IR) :** barème standard. À re-sourcer/vérifier séparément
si une précision IR au centime est requise.

## Société à l'IS

| Constante | Valeur | Source |
|---|---|---|
| `TAUX_IS_REDUIT` | 15 % | legifiscal.fr |
| `PLAFOND_IS_REDUIT` | 42 500 € de bénéfice imposable | legifiscal.fr |
| `TAUX_IS_NORMAL` | 25 % au-delà | legifiscal.fr |
| `TAUX_PFU_IR` | 12,8 % | entreprendre.service-public.gouv.fr |
| `TAUX_PFU_PRELEVEMENTS_SOCIAUX` | 18,6 % | entreprendre.service-public.gouv.fr |
| `TAUX_PFU_DIVIDENDES` | **31,4 %** (= 12,8 % + 18,6 %) | entreprendre.service-public.gouv.fr |

**Taux réduit IS — conditions :** CA < 10 M€, capital entièrement libéré, ≥ 75 % détenu
par des personnes physiques.

**⚠️ PFU 31,4 % — vigilance millésime.** Le PFU (« flat tax ») sur dividendes distribués
est passé à **31,4 % au 01/01/2026** (hausse de +1,4 pt de la CSG : 17,2 % → 18,6 % sur
la part prélèvements sociaux). L'ancien taux de **30 %** (en vigueur 2018-2025) **ne doit
plus être utilisé**. Un test de garde anti-régression verrouille cette valeur.

**Limite V1 connue — rémunération dirigeant :** le scénario société à l'IS **ne modélise
pas** la rémunération du dirigeant (charges assimilé-salarié / TNS). Trop variable pour
être précise sans un vrai moteur de paie. Le résultat porte le drapeau
`remuneration_dirigeant_non_modelisee: true`. Extension prévue au **Lot 3 (V2)**.

## Entreprise individuelle — régime réel  ⚠️ approximatif V1

Ce statut repose sur des valeurs **NON sourcées au centime**. Il ne sert qu'à donner un
**ordre de grandeur** et son résultat est explicitement marqué `precision:
"approximatif_v1"`. Ne jamais le présenter comme précis.

| Constante | Valeur | Statut |
|---|---|---|
| `BAREME_IR_APPROX_V1` | tranches 0 / 11 / 30 / 41 / 45 % (1 part) | indicatif, à revalider |
| `TAUX_COTIS_TNS_APPROX_V1` | 40 % (forfaitaire) | approximatif, assiette réelle dégressive |

À revalider au **Lot 3** : barème IR officiel du millésime + assiette réelle des
cotisations TNS.

## Verrou de revalidation

Toute mise à jour d'un barème (nouveau millésime, réforme) doit : (1) modifier la
constante nommée dans `rates/fr-2026.ts` avec sa nouvelle source + date, (2) mettre à
jour ce document, (3) réexécuter `pnpm --filter @ftg/deterministic-core test` (les golden
cases doivent rester cohérents ou être recalculés indépendamment).
