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
