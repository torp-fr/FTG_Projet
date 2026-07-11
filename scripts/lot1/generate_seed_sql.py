import json

def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def jsonb(obj):
    return esc(json.dumps(obj, ensure_ascii=False)) + "::jsonb"

def arr(lst):
    if not lst:
        return "'{}'"
    items = ",".join('"' + str(x).replace('"','\\"') + '"' for x in lst)
    return "'{" + items + "}'"

ref = json.load(open("/home/claude/ftg/supabase/seed/referentiel_v1.1.json", encoding="utf-8"))
segs = json.load(open("/home/claude/ftg/supabase/seed/segments_v1.json", encoding="utf-8"))["segments"]
sources = json.load(open("/home/claude/ftg/supabase/seed/data_sources.json", encoding="utf-8"))["data_sources"]

out = []
out.append("-- Seed généré automatiquement depuis supabase/seed/*.json (scripts/lot1/generate_seed_sql.py)")
out.append("-- Référentiel V1.1 + segments + registre des sources")
out.append("")

# referential_versions
out.append(f"""insert into referential_versions (semver, status, changelog, activated_at)
values ({esc(ref['semver'])}, {esc(ref['status'])}, {esc(ref['changelog'])}, now())
on conflict (semver) do nothing;""")
out.append("")

RV = "(select id from referential_versions where semver = '1.1.0')"

# phases
out.append("-- phases")
for p in ref["phases"]:
    out.append(f"""insert into phases (ref_version_id, code, name, order_hint, entry_door_variant)
values ({RV}, {esc(p['code'])}, {esc(p['name'])}, {p['order_hint']}, {esc(p['entry_door_variant'])})
on conflict (ref_version_id, code) do nothing;""")
out.append("")

# milestones
out.append("-- milestones")
for m in ref["milestones"]:
    proof_types = []
    if m["flags"]["external_proof"]:
        proof_types = ["upload", "webhook", "external_check"]
    out.append(f"""insert into milestones (ref_version_id, phase_id, code, name, flags, proof_types_accepted, irreversible, branch)
values (
  {RV},
  (select id from phases where ref_version_id = {RV} and code = {esc(m['phase'])}),
  {esc(m['code'])}, {esc(m['name'])}, {jsonb(m['flags'])}, {arr(proof_types)}, {str(m['irreversible']).lower()}, {esc(m['branch'])}
)
on conflict (ref_version_id, code) do nothing;""")
out.append("")

# milestone_dependencies
out.append("-- milestone_dependencies")
for d in ref["milestone_dependencies"]:
    out.append(f"""insert into milestone_dependencies (milestone_id, depends_on_milestone_id, hardness)
select m1.id, m2.id, {esc(d['hardness'])}
from milestones m1, milestones m2
where m1.ref_version_id = {RV} and m1.code = {esc(d['milestone'])}
  and m2.ref_version_id = {RV} and m2.code = {esc(d['depends_on'])}
on conflict (milestone_id, depends_on_milestone_id) do nothing;""")
out.append("")

# gates
out.append("-- gates")
for g in ref["gates"]:
    scope_subquery = f"(select coalesce(array_agg(id), '{{}}') from milestones where ref_version_id = {RV} and phase_id = (select id from phases where ref_version_id = {RV} and code = {esc(g['phase'])}))"
    threshold = "null" if g["threshold"] is None else g["threshold"]
    out.append(f"""insert into gates (ref_version_id, code, name, milestone_scope, weights, threshold, critical_floors, verdict_policy)
values (
  {RV}, {esc(g['code'])}, {esc(g['name'])},
  {scope_subquery},
  {jsonb(g['weights'])}, {threshold}, {jsonb(g['critical_floors'])}, {jsonb(g['verdict_policy'])}
)
on conflict (ref_version_id, code) do nothing;""")
out.append("")

# segments
out.append("-- segments")
for s in segs:
    config = {k: v for k, v in s.items() if k not in ("code", "name")}
    out.append(f"""insert into segments (code, name, status, config)
values ({esc(s['code'])}, {esc(s['name'])}, 'active', {jsonb(config)})
on conflict (code) do nothing;""")
out.append("")

# data_sources
out.append("-- data_sources")
for ds in sources:
    out.append(f"""insert into data_sources (code, name, type, licence, cost_model, activation_status, waterfall_level_default, engines_consumers, priority, notes)
values ({esc(ds['code'])}, {esc(ds['name'])}, {esc(ds['type'])}, {esc(ds.get('licence'))}, {esc(ds['cost_model'])}, {esc(ds['activation_status'])}, {ds['waterfall_level_default']}, {arr(ds.get('engines_consumers'))}, {esc(ds.get('priority'))}, {esc(ds.get('notes'))})
on conflict (code) do nothing;""")
out.append("")

sql = "\n".join(out)
with open("/home/claude/ftg/scripts/lot1/seed_generated.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Generated SQL: {len(sql)} chars, {sql.count('insert into')} insert statements")
