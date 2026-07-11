# Lot 0 — Checklist infra (à valider et exécuter avec toi)

⚠️ Ces créations exigent tes informations/validations d'identité — voir le plan d'exécution soumis pour le détail.

**Décision d'isolation (tranchée le 11/07/2026)** : projets Supabase/Vercel isolés (données/code séparés) dans les organisations/équipes déjà connectées ; compte Stripe entièrement séparé ; repo GitHub créé par toi + token scopé transmis.

- [~] Repo GitHub créé par toi (`torp-fr/FTG_Projet`, public) + token PAT transmis — **push automatisé bloqué** : le proxy réseau de cette session refuse ce repo ("not in this session's authorized repository set"). Reste à pousser manuellement (web upload ou terminal local) tant que ce n'est pas résolu côté paramètres de session/environnement
- [x] **Projet Vercel FTG créé par toi** — `ftg-projet` dans l'équipe `torps-projects` (id `prj_3SDBMOyR9MS2irHf6ZtwRf0FQdg9`), déploiement placeholder actif, prêt à recevoir le vrai code au Lot 1/2
- [x] **Projet Supabase FTG créé** — `ftg-plateforme` (ref `zhkrpnjfqrrtfuddqznt`), région `eu-west-1` (UE), coût 0 €/mois (plan gratuit), isolé de `plateforme-TORP`/`Vigie_City` — aucune donnée/schéma partagé. URL et clé publique déjà dans `.env.local` (non commité) ; `SUPABASE_SERVICE_ROLE_KEY` à récupérer par toi depuis le dashboard Supabase (non accessible par un outil automatisé, par sécurité)
- [x] **Compte Stripe FTG créé par toi** (`acct_1Trzu1QjsjPtg619`) — **mais pas encore connecté à cette session** : l'outil Stripe reste branché sur le compte `TORP`, sans capacité de bascule (contrairement à Shopify qui a un `switch-shop`). Décision : on avance sans Stripe connecté, tu reconnecteras sur FTG au moment de pousser la partie facturation (Lot 3/4 — non bloquant pour Lot 0/1/2)
- [ ] Comptes sources gratuites créés : portail API INSEE (Sirene), DATA INPI, PISTE (Légifrance), data.gouv, Pappers (100 crédits offerts), DataForSEO (1 $ d'essai)
- [ ] Coffre d'accès interne initialisé (vault Supabase), toutes les clés centralisées et chiffrées
- [ ] `.env` local rempli à partir de `.env.example`, jamais commité
