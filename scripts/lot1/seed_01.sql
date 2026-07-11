-- Référentiel V1.1 + segments + registre des sources

insert into referential_versions (semver, status, changelog, activated_at)
values ('1.1.0', 'active', 'V1.1 : intègre le DAG (Amendement A2), les 2 portes d''entrée dont P0-J0 (Amendement A3), la neutralité factuelle orientée solutions dans le nommage des verdicts (D25).', now())
on conflict (semver) do nothing;
