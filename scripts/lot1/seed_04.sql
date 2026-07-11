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
