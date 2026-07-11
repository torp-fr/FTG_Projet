-- Seed généré automatiquement depuis supabase/seed/*.json (scripts/lot1/generate_seed_sql.py)
-- Référentiel V1.1 + segments + registre des sources

insert into referential_versions (semver, status, changelog, activated_at)
values ('1.1.0', 'active', 'V1.1 : intègre le DAG (Amendement A2), les 2 portes d''entrée dont P0-J0 (Amendement A3), la neutralité factuelle orientée solutions dans le nommage des verdicts (D25).', now())
on conflict (semver) do nothing;

-- phases
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P0', 'Le Porteur', 0, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P1', 'Idéation', 1, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P2', 'Exploration marché', 2, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P3', 'Preuves de demande', 3, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P4', 'Modèle économique', 4, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P5', 'Structuration', 5, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P6', 'Identité & marque', 6, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P7', 'Build', 7, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P8', 'Go-to-Market', 8, 'both')
on conflict (ref_version_id, code) do nothing;
insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ((select id from referential_versions where semver = '1.1.0'), 'P9', 'Première vente & bilan', 9, 'both')
on conflict (ref_version_id, code) do nothing;

-- milestones
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J0', 'Intake idée (Porte A)', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J1', 'Profil fondateur complété', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J2', 'Mantra & objectifs internes', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J3', 'Capacité d''engagement quantifiée', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J4', 'Profil d''incarnation généré et compris', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": true}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0'),
  'P0-J5', 'Charte d''engagement FTG signée', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', true, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J1', 'Terrain de chasse cadré', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J2', 'Portefeuille d''idées constitué', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J3', 'Tour 1 : élimination par critères durs', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J4', 'Challenge multi-dimensions des survivantes', '{"three_ways": true, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J5', 'Scoring de pré-faisabilité', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J6', 'Matching incarnation', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1'),
  'P1-J7', 'Sélection argumentée', '{"three_ways": true, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J1', 'Périmètre d''étude défini', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J2', 'Taille & tendance du marché', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J3', 'Cartographie concurrentielle', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J4', 'Mining des douleurs clients', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J5', 'Segmentation & persona v1', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J6', 'Positionnement différenciant', '{"three_ways": true, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J7', 'Rapport d''étude de marché assemblé', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2'),
  'P2-J8', 'Verdict d''attractivité', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J1', 'Hypothèses critiques formalisées', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J2', 'Plan de preuve composite', '{"three_ways": true, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J3', 'Preuves online exécutées', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J4', 'Preuve comportementale exécutée', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J5', 'Entretiens (pondéré)', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J6', 'Score de preuve composite calculé', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3'),
  'P3-J7', 'Verdict de validation', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J1', '3 voies de business model', '{"three_ways": true, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J2', 'Modèle arbitré', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J3', 'Pricing v1', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J4', 'Structure de coûts & coût de revient', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J5', 'Prévisionnel 3 ans (moteur déterministe)', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J6', 'Seuil de rentabilité & besoin de financement', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J7', 'Plan de financement (information)', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4'),
  'P4-J8', 'Stress test', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J1', 'Comparateur de statuts chiffré', '{"three_ways": true, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J2', 'Choix arbitré + checkpoint professionnel', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J3', 'Compréhension de l''imposition', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": true}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J4', 'Checklist réglementaire sectorielle', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J5', 'Immatriculation guidée', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', true, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J6', 'Assurances en place', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J7', 'Kit contractuel & conformité', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5'),
  'P5-J8', 'Socle administratif', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J1', 'Plateforme de marque', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J2', 'Naming : shortlist vérifiée', '{"three_ways": true, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J3', 'Nom choisi & sécurisé', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', true, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J4', 'Identité visuelle', '{"three_ways": true, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J5', 'Kit de marque livré', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6'),
  'P6-J6', 'Pitch & messages clés', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J1', 'Contrat de scope MVP', '{"three_ways": false, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J2', 'Specs / cahier de production', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J3a', 'Build assisté', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'digital'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J4a', 'Recette', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'digital'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J5a', 'Mise en ligne', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, 'digital'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J3b', 'Sourcing structuré', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, 'physical'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J4b', 'Échantillons & qualité', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, 'physical'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J5b', 'Coût de revient final & logistique', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'physical'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J3c', 'Offre packagée', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'service'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J4c', 'Supports de vente', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'service'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J5c', 'Capacité de production validée', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, 'service'
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J6', 'Parcours d''achat bout-en-bout', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', true, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7'),
  'P7-J7', 'Outillage opérationnel', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J1', 'Stratégie GTM 3 voies', '{"three_ways": true, "devils_advocate": true, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J2', 'Plan d''action 30-60-90', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J3', 'Assets d''acquisition produits', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J4', 'Actions lancées', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J5', 'Pipeline actif', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J6', 'Coaching objections & itération du discours', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8'),
  'P8-J7', 'Boucle de mesure hebdo', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9'),
  'P9-J1', 'Première vente encaissée', '{"three_ways": false, "devils_advocate": false, "external_proof": true, "pedagogy_quiz": false}'::jsonb, '{"upload","webhook","external_check"}', true, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9'),
  'P9-J2', 'Bilan de lancement', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9'),
  'P9-J3', 'Retour client n°1', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9'),
  'P9-J4', 'Boucle d''itération', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;
insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  (select id from referential_versions where semver = '1.1.0'),
  (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9'),
  'P9-J5', 'Certificat FTG & bascule', '{"three_ways": false, "devils_advocate": false, "external_proof": false, "pedagogy_quiz": false}'::jsonb, '{}', false, NULL
)
on conflict (ref_version_id, code) do nothing;

-- milestone_dependencies
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'soft'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J0'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'soft'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P0-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P0-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'soft'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P1-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P1-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P2-J8'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P2-J8'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P3-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P3-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P4-J8'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P4-J8'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P5-J8'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P5-J8'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P6-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P6-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J3a'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J4a'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J3a'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J5a'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J4a'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J3b'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J5a'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J4b'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J3b'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J5b'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J4b'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J3c'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J5b'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J4c'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J3c'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J5c'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J4c'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J5c'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P7-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P7-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J6'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J5'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P8-J7'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J6'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P9-J1'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P8-J7'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P9-J2'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P9-J1'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P9-J3'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P9-J2'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P9-J4'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P9-J3'
on conflict (milestone_id, depends_on_milestone_id) do nothing;
insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, 'hard'
from milestones m1, milestones m2
where m1.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m1.code = 'P9-J5'
  and m2.ref_version_id = (select id from referential_versions where semver = '1.1.0') and m2.code = 'P9-J4'
on conflict (milestone_id, depends_on_milestone_id) do nothing;

-- gates
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G0', 'Le Porteur',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P0')),
  '{"V2": 60, "V3": 40}'::jsonb, 65, '{"V2": 50}'::jsonb, '{"pivot_enabled": false, "arret_enabled": false, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G1', 'Idéation',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P1')),
  '{"V1": 20, "V2": 15, "V3": 30, "V4": 35}'::jsonb, 60, '{"V3": 50}'::jsonb, '{"pivot_enabled": false, "arret_enabled": false, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G2', 'Exploration marché',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P2')),
  '{"V1": 25, "V2": 10, "V3": 10, "V4": 55}'::jsonb, 62, '{"V4": 50}'::jsonb, '{"pivot_enabled": true, "arret_enabled": false, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G3', 'Preuves de demande',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P3')),
  '{"V1": 20, "V2": 20, "V4": 60}'::jsonb, 65, '{"V4": 55}'::jsonb, '{"pivot_enabled": true, "arret_enabled": true, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G4', 'Modèle économique',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P4')),
  '{"V1": 20, "V2": 10, "V4": 15, "V5": 55}'::jsonb, 62, '{"V5": 50}'::jsonb, '{"pivot_enabled": true, "arret_enabled": true, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G5', 'Structuration',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P5')),
  '{"V1": 20, "V2": 25, "V6": 55}'::jsonb, 70, '{"V6": 65}'::jsonb, '{"pivot_enabled": false, "arret_enabled": true, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G6', 'Identité & marque',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P6')),
  '{"V1": 60, "V2": 15, "V3": 25}'::jsonb, 60, '{}'::jsonb, '{"pivot_enabled": false, "arret_enabled": false, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G7', 'Build',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P7')),
  '{"V1": 45, "V2": 20, "V5": 20, "V6": 15}'::jsonb, 65, '{}'::jsonb, '{"pivot_enabled": false, "arret_enabled": true, "max_reserves": 3, "mandatory_milestone": "P7-J6"}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G8', 'Go-to-Market',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P8')),
  '{"V1": 25, "V2": 35, "V3": 15, "V4": 25}'::jsonb, 62, '{"V2": 55}'::jsonb, '{"pivot_enabled": true, "arret_enabled": true, "max_reserves": 3}'::jsonb
)
on conflict (ref_version_id, code) do nothing;
insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  (select id from referential_versions where semver = '1.1.0'), 'G9', 'Première vente',
  (select coalesce(array_agg(id), '{}') from milestones where ref_version_id = (select id from referential_versions where semver = '1.1.0') and phase_id = (select id from phases where ref_version_id = (select id from referential_versions where semver = '1.1.0') and code = 'P9')),
  '{}'::jsonb, null, '{}'::jsonb, '{"binary_proof": "P9-J1"}'::jsonb
)
on conflict (ref_version_id, code) do nothing;

-- segments
insert into segments (code, name, status, config)
values ('S1', 'E-commerce / produit physique', 'active', '{"sub_segments": ["boutique en ligne mono/multi-produits", "marque DNVB", "revente/négoce", "print-on-demand", "artisanat vendu en ligne"], "vocabulary": ["SKU", "marge brute unitaire", "AOV", "taux de conversion", "coût logistique", "MOQ fournisseur"], "sources_prioritaires": ["insee_sirene", "dataforseo_reviews", "annuaire_fournisseurs_b2b", "barèmes_transport_douane"], "p7_branch": "physical", "board": {"lead": "Agent Sourcing", "second": "Agent Acquisition", "members": ["Agent Études marché", "Agent Marque", "Agent Boutique (tech)", "Agent Finance"]}, "scoring_overrides": {"g7_v5_weight_boost": true, "g3_requires_behavioral_proof": true}, "ambition_reading": {"complement": "print-on-demand/négoce léger sans stock", "independance": "marque mono-produit maîtrisée", "croissance": "catalogue + multi-canal", "scale": "DNVB, volume, distribution"}, "known_pitfalls": ["marge calculée sans coûts cachés", "stock initial surdimensionné", "dépendance canal payant unique", "produit sans différenciation"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S2', 'SaaS / application / produit digital', 'active', '{"sub_segments": ["SaaS B2B/B2C", "application mobile", "extension/plugin", "outil no-code productisé", "API"], "vocabulary": ["MRR/ARR", "churn", "activation", "CAC/LTV", "freemium vs trial"], "sources_prioritaires": ["annuaires_logiciels_avis", "dataforseo_trends", "communautes_dev"], "p7_branch": "digital", "board": {"lead": "Agent Tech Lead", "second": "Agent Produit", "members": ["Agent Études", "Agent Growth", "Agent Légal/RGPD", "Agent Finance"]}, "scoring_overrides": {"v6_reinforced": true, "p7_j6_means": "transaction récurrente test"}, "ambition_reading": {"complement": "micro-outil de niche automatisé", "independance": "SaaS de niche rentable", "croissance": "équipe + produit étendu", "scale": "traction/levée, métriques investisseurs"}, "known_pitfalls": ["sur-engineering du MVP", "construire avant de valider", "sous-estimer CAC B2C", "onboarding négligé"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S3', 'Service B2B / conseil / agence', 'active', '{"sub_segments": ["conseil", "agence", "prestation intellectuelle", "externalisation"], "vocabulary": ["TJM/forfait", "taux d''occupation", "cycle de vente", "comptes cibles"], "sources_prioritaires": ["annuaire_entreprises_datagouv", "pappers", "marches_publics"], "p7_branch": "service", "board": {"lead": "Agent Positionnement", "second": "Agent Prospection", "members": ["Agent Offre & Pricing", "Agent Sales coach", "Agent Légal contrats"]}, "scoring_overrides": {"g8_pipeline_threshold": 10}, "ambition_reading": {"complement": "missions ponctuelles", "independance": "portefeuille stable", "croissance": "agence avec équipe", "scale": "productisation du service"}, "known_pitfalls": ["offre je-fais-tout", "prix au rabais par peur", "dépendance 1-2 clients", "absence de contrat cadre"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S4', 'Artisanat / services techniques', 'active', '{"sub_segments": ["bâtiment second œuvre", "réparation", "fabrication", "installation", "entretien"], "vocabulary": ["devis/chantier/intervention", "taux horaire + fournitures", "zone d''intervention"], "sources_prioritaires": ["registres_qualifications", "organismes_profession", "baremes_prix_locaux"], "p7_branch": "service", "board": {"lead": "Agent Conformité métier", "second": "Agent Implantation locale", "members": ["Agent Pricing", "Agent Visibilité locale", "Agent Finance"]}, "scoring_overrides": {"g5_v6_floor": 75, "assurance_qualification_hard_dependency": true}, "ambition_reading": {"complement": "interventions ciblées", "independance": "carnet plein solo", "croissance": "embauche + véhicules", "scale": "réseau/franchise"}, "known_pitfalls": ["sous-tarification", "démarrage sans assurance conforme", "dépendance plateformes de mise en relation"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S5', 'Commerce local / restauration', 'active', '{"sub_segments": ["boutique physique", "restauration", "services de proximité avec local"], "vocabulary": ["emplacement", "flux", "ticket moyen", "zone de chalandise", "bail commercial", "saisonnalité locale"], "sources_prioritaires": ["ban", "insee_donnees_locales", "dvf", "dataforseo_business_data"], "p7_branch": "physical", "board": {"lead": "Agent Implantation", "second": "Agent Finance", "members": ["Agent Concept & offre", "Agent Conformité", "Agent Visibilité locale"]}, "scoring_overrides": {"g2_emplacement_critere_majeur": true, "v5_stress_test_loyer_saisonnalite": true}, "ambition_reading": {"complement": "rare ici (capital engagé) — signalé factuellement dès P0", "independance": "un point rentable", "croissance": "2-3 points", "scale": "réseau"}, "known_pitfalls": ["emplacement choisi à l''affect", "sous-capitalisation des travaux", "bail signé sans négociation", "point mort jamais calculé par scénario"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S6', 'Freelance / indépendant', 'active', '{"sub_segments": ["dev", "design", "rédaction", "coaching", "formation", "assistanat", "expertise"], "vocabulary": ["TJM", "portfolio", "plateformes vs direct", "personal branding", "récurrence client"], "sources_prioritaires": ["baremes_tjm", "plateformes_freelancing", "communautes_metier"], "p7_branch": "service", "board": {"lead": "Agent Positionnement", "second": "Agent Prospection", "members": ["Agent Portfolio", "Agent Pricing"]}, "scoring_overrides": {"g2_g3_thresholds_relaxed": true, "v2_regularite_prospection_surveille": true}, "ambition_reading": {"complement": "missions à côté", "independance": "temps plein choisi", "croissance": "collectif/sous-traitance", "scale": "bascule vers agence (S3)"}, "known_pitfalls": ["positionnement généraliste", "arrêt prospection dès mission tombée", "dépendance plateforme unique", "TJM jamais réévalué"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S7', 'Marketplace / plateforme', 'active', '{"sub_segments": ["place de marché biens/services", "plateforme de mise en relation", "commission ou abonnement double face"], "vocabulary": ["double face offre/demande", "liquidité", "take rate", "poule-et-œuf", "masse critique"], "sources_prioritaires": ["plateformes_comparables_take_rate", "communautes_deux_faces"], "p7_branch": "digital", "board": {"lead": "Agent Stratégie plateforme", "second": "Agent Finance", "members": ["Agent Face Offre", "Agent Face Demande", "Agent Tech"]}, "scoring_overrides": {"g3_requires_both_faces": true, "v5_double_amorcage_cost": true}, "ambition_reading": {"structural_note": "le modèle exige structurellement Croissance/Scale — présenté factuellement en P0/P1 avec alternative de démarrer en S3/S6 mono-face"}, "known_pitfalls": ["construire la plateforme avant la liquidité", "take rate irréaliste", "deux faces attaquées en même temps sur périmètre trop large"]}'::jsonb)
on conflict (code) do nothing;
insert into segments (code, name, status, config)
values ('S8', 'Créateur / contenu / communauté', 'active', '{"sub_segments": ["créateur de contenu monétisé", "newsletter", "communauté payante", "produits numériques éducatifs", "médias de niche"], "vocabulary": ["audience", "engagement", "monétisation multi-flux", "propriété d''audience (email)", "calendrier éditorial"], "sources_prioritaires": ["donnees_audience_plateformes", "benchmarks_engagement_createurs"], "p7_branch": "digital", "board": {"lead": "Agent Ligne éditoriale", "second": "Agent Monétisation", "members": ["Agent Audience", "Agent Conformité commerciale"]}, "scoring_overrides": {"devils_advocate_reinforced_on_promises": true, "v6_strict": true}, "ambition_reading": {"complement": "monétisation d''une passion", "independance": "média de niche rentable", "croissance": "équipe éditoriale", "scale": "média/marque"}, "known_pitfalls": ["audience louée jamais possédée", "mono-monétisation", "promesses de résultat non tenables", "irrégularité de publication"]}'::jsonb)
on conflict (code) do nothing;

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
