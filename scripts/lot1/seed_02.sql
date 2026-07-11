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
