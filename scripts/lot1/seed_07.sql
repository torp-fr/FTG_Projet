-- data_sources
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('insee_sirene', 'API Sirene (INSEE)', 'entreprises', 'open licence / etalab', 'free', 'v1_free', 1, '{"E4","E5"}', 'P1', '~25M entreprises, 36M établissements, MAJ quotidienne. Vérification SIRET P5-J5.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('annuaire_entreprises_datagouv', 'Annuaire des Entreprises (data.gouv)', 'entreprises', 'open licence', 'free', 'v1_free', 1, '{"E4","E5"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('sirene_stock_datagouv', 'Fichiers stock Sirene (data.gouv)', 'entreprises', 'open licence', 'free', 'v1_free', 2, '{"E4"}', 'P1', 'Batch interne, analyses de masse.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('pappers', 'API Pappers', 'entreprises', 'CGU commerciales', 'pay_as_you_go', 'v1_free', 2, '{"E5"}', 'P2', '100 crédits gratuits à l''ouverture ; 1 crédit ≈ 1 fiche entreprise.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('bodacc', 'BODACC (open data)', 'entreprises', 'open licence', 'free', 'v1_free', 1, '{"E5"}', 'P1', 'Créations, ventes, procédures collectives.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('infogreffe', 'Infogreffe', 'entreprises', 'commerciale', 'per_act', 'inactive', 3, '{}', 'P4', 'Kbis ~3,20€ — renvoi utilisateur uniquement.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('inpi_data', 'DATA INPI + API PI', 'naming', 'open (compte requis)', 'free', 'v1_free', 1, '{"E9"}', 'P1', 'Marques FR/UE/internationales. Résultats indicatifs, disclaimer requis.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('inpi_rne', 'API RNE (INPI)', 'naming', 'open (compte requis)', 'free', 'v1_free', 1, '{"E9"}', 'P1', 'Vérification disponibilité dénomination sociale (P6-J2).')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('tmview', 'TMview (EUIPO)', 'naming', 'open', 'free', 'v1_free', 1, '{"E9"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('rdap_domains', 'RDAP / registrars', 'naming', 'open', 'free', 'v1_free', 1, '{"E9"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('social_handles_check', 'Vérification handles réseaux sociaux', 'naming', 'n/a', 'free', 'v1_free', 1, '{"E9"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('dataforseo_keywords', 'DataForSEO Keywords Data', 'demande', 'CGU commerciales', 'pay_as_you_go', 'v1_free', 1, '{"E4","E3"}', 'P2', '1$ de crédit d''essai. Volumes de recherche.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('dataforseo_labs', 'DataForSEO Labs / SERP / Trends', 'demande', 'CGU commerciales', 'pay_as_you_go', 'v1_free', 2, '{"E4","E5"}', 'P2', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('dataforseo_reviews', 'DataForSEO Reviews', 'demande', 'CGU commerciales', 'pay_as_you_go', 'v1_free', 2, '{"E4"}', 'P2', 'Mining des douleurs P2-J4.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('google_trends', 'Google Trends', 'demande', 'gratuit non-contractuel', 'free', 'v1_free', 1, '{"E4"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('communautes_reddit_forums', 'Communautés (Reddit, forums FR)', 'demande', 'tier gratuit limité', 'free', 'v1_free', 3, '{"E4"}', 'P3', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('insee_statistiques', 'INSEE statistiques (BDM, recensement)', 'demande', 'open licence', 'free', 'v1_free', 1, '{"E4"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('perplexity_sonar', 'Perplexity Sonar API', 'recherche_experte', 'commerciale', 'pay_as_you_go', 'v1_free', 2, '{"E4","E5","E6"}', 'P2', 'Étages waterfall 2-3, citations incluses.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('perplexity_sonar_deep', 'Sonar Deep Research', 'recherche_experte', 'commerciale', 'pay_as_you_go', 'v1_free', 3, '{"E4"}', 'P3', 'Réservé aux jalons de recherche profonde, routé jamais par défaut.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('etudes_sectorielles_premium', 'Études sectorielles premium (type Xerfi)', 'recherche_experte', 'commerciale', 'per_act', 'inactive', 3, '{"E4"}', 'P4', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('ban', 'BAN (Base Adresse Nationale)', 'local', 'open licence', 'free', 'v1_free', 1, '{"E4"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('insee_donnees_locales', 'INSEE données locales (BPE, carroyage)', 'local', 'open licence', 'free', 'v1_free', 1, '{"E4"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('dvf', 'DVF (demandes de valeurs foncières)', 'local', 'open licence', 'free', 'v1_free', 1, '{"E4"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('dataforseo_business_data', 'DataForSEO Business Data (Maps/Business)', 'local', 'CGU commerciales', 'pay_as_you_go', 'v1_free', 2, '{"E5"}', 'P2', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('legifrance_piste', 'Légifrance (API PISTE)', 'reglementaire', 'open licence (compte PISTE)', 'free', 'v1_free', 1, '{"E8"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('service_public', 'Service-Public / entreprendre.service-public', 'reglementaire', 'open licence', 'free', 'v1_free', 1, '{"E7","E8"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('bofip', 'BOFiP', 'reglementaire', 'open licence', 'free', 'v1_free', 1, '{"E8"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('aides_publiques', 'Base des aides publiques (les-aides.fr / aides-territoires)', 'reglementaire', 'open licence / convention', 'free', 'v1_free', 1, '{"deterministic_core"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('urssaf_baremes', 'URSSAF / barèmes sociaux', 'reglementaire', 'open licence', 'free', 'v1_free', 1, '{"deterministic_core"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('bopi_jo', 'Journaux officiels / BOPI (flux)', 'reglementaire', 'open licence', 'free', 'v1_free', 1, '{"E9"}', 'P1', 'Surveillance de marque post-P6.')
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('europages', 'Annuaires fournisseurs B2B (Europages...)', 'sourcing', 'consultation gratuite', 'free', 'v1_free', 1, '{"E5"}', 'P1', NULL)
on conflict (code) do nothing;
insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ('baremes_transport_douane', 'Barèmes transport/douane (open data douanes)', 'sourcing', 'open licence', 'free', 'v1_free', 1, '{"deterministic_core"}', 'P1', NULL)
on conflict (code) do nothing;
