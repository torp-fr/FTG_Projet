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
