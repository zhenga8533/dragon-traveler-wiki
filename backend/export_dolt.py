"""
Export Dolt database tables back to JSON files.

By default, output is written to backend/exports/.  Pass --output-dir data to
write directly to the project's data/ directory (used by the frontend build).

Usage:
    python -m backend.export_dolt                          # export all tables
    python -m backend.export_dolt --target codes           # export a specific table
    python -m backend.export_dolt --output-dir data        # export to data/
"""

import argparse
import csv
import io
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

from .sort_keys import (
    QUALITY_RANK,
    artifact_sort_key,
    character_sort_key,
    faction_sort_key,
    gear_set_sort_key,
    gear_sort_key,
    golden_alliance_sort_key,
    howlkin_sort_key,
    noble_phantasm_sort_key,
    resource_sort_key,
    status_effect_sort_key,
    subclass_sort_key,
    useful_link_sort_key,
    wyrmspell_sort_key,
)

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
EXPORT_DIR = SCRIPT_DIR / "exports"

# All queries needed, keyed by name. Executed in a single dolt process.
QUERIES = {
    "factions": "SELECT * FROM factions ORDER BY id;",
    "faction_recommended_artifacts": (
        "SELECT faction_id, sort_order, artifact_name "
        "FROM faction_recommended_artifacts "
        "ORDER BY faction_id, sort_order, id;"
    ),
    "characters": "SELECT * FROM characters ORDER BY id;",
    "character_factions": (
        "SELECT cf.character_id, f.name AS faction_name "
        "FROM character_factions cf JOIN factions f ON cf.faction_id = f.id "
        "ORDER BY cf.character_id, cf.sort_order, cf.faction_id;"
    ),
    "character_subclasses": (
        "SELECT character_id, subclass_name FROM character_subclasses ORDER BY id;"
    ),
    "character_recommended_subclasses": (
        "SELECT character_id, subclass_name, sort_order "
        "FROM character_recommended_subclasses "
        "ORDER BY character_id, sort_order, id;"
    ),
    "character_recommended_gear": (
        "SELECT character_id, slot, gear_name, sort_order "
        "FROM character_recommended_gear "
        "ORDER BY character_id, sort_order, id;"
    ),
    "subclasses": "SELECT * FROM subclasses ORDER BY id;",
    "subclass_bonuses": (
        "SELECT subclass_id, sort_order, bonus_text FROM subclass_bonuses "
        "ORDER BY subclass_id, sort_order, id;"
    ),
    "subclass_character_classes": (
        "SELECT subclass_id, character_class, sort_order FROM subclass_character_classes "
        "ORDER BY subclass_id, sort_order, id;"
    ),
    "talent_levels": (
        "SELECT character_id, level, effect FROM talent_levels ORDER BY character_id, level;"
    ),
    "skills": (
        "SELECT character_id, name, type, description, cooldown FROM skills ORDER BY id;"
    ),
    "wyrmspells": "SELECT * FROM wyrmspells ORDER BY id;",
    "resources": "SELECT * FROM resources ORDER BY id;",
    "codes": "SELECT * FROM codes ORDER BY id;",
    "code_rewards": "SELECT * FROM code_rewards ORDER BY code_id, id;",
    "status_effects": "SELECT * FROM status_effects ORDER BY id;",
    "tier_lists": "SELECT * FROM tier_lists ORDER BY id;",
    "tier_list_entries": ("SELECT * FROM tier_list_entries ORDER BY tier_list_id, id;"),
    "teams": "SELECT * FROM teams ORDER BY id;",
    "team_members": "SELECT * FROM team_members ORDER BY team_id, id;",
    "team_member_substitutes": (
        "SELECT * FROM team_member_substitutes ORDER BY team_member_id, id;"
    ),
    "useful_links": "SELECT * FROM useful_links ORDER BY id;",
    "artifacts": "SELECT * FROM artifacts ORDER BY id;",
    "artifact_effects": "SELECT * FROM artifact_effects ORDER BY artifact_id, level;",
    "artifact_treasures": "SELECT * FROM artifact_treasures ORDER BY artifact_id, id;",
    "artifact_treasure_effects": (
        "SELECT * FROM artifact_treasure_effects ORDER BY treasure_id, level;"
    ),
    "howlkins": "SELECT * FROM howlkins ORDER BY id;",
    "howlkin_stats": "SELECT * FROM howlkin_stats ORDER BY howlkin_id, id;",
    "howlkin_passive_effects": (
        "SELECT * FROM howlkin_passive_effects ORDER BY howlkin_id, sort_order, id;"
    ),
    "golden_alliances": "SELECT * FROM golden_alliances ORDER BY id;",
    "golden_alliance_howlkins": (
        "SELECT * FROM golden_alliance_howlkins ORDER BY alliance_id, sort_order, id;"
    ),
    "golden_alliance_effects": (
        "SELECT * FROM golden_alliance_effects ORDER BY alliance_id, level, sort_order, id;"
    ),
    "gear_sets": "SELECT * FROM gear_sets ORDER BY id;",
    "gear": "SELECT * FROM gear ORDER BY id;",
    "noble_phantasms": "SELECT * FROM noble_phantasms ORDER BY id;",
    "noble_phantasm_effects": (
        "SELECT * FROM noble_phantasm_effects ORDER BY noble_phantasm_id, sort_order, id;"
    ),
    "noble_phantasm_skills": (
        "SELECT * FROM noble_phantasm_skills ORDER BY noble_phantasm_id, level, id;"
    ),
    "changelog": "SELECT * FROM changelog ORDER BY id;",
    "changelog_changes": ("SELECT * FROM changelog_changes ORDER BY changelog_id, id;"),
}


def fetch_all(needed_keys, queries):
    """Run all needed queries in a single dolt sql call and return results keyed by name."""
    if not needed_keys:
        return {}
    queries_to_run = {k: v for k, v in queries.items() if k in needed_keys}
    combined_sql = "\n".join(queries_to_run.values())

    result = subprocess.run(
        ["dolt", "sql", "-r", "json"],
        cwd=DOLT_DIR,
        input=combined_sql,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        print(f"ERROR running SQL batch", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)

    if not result.stdout.strip():
        return {k: [] for k in queries_to_run}

    # Dolt outputs one JSON object per line for each query result.
    # Use a streaming decoder to handle format variations robustly.
    keys = list(queries_to_run.keys())
    data = {k: [] for k in keys}

    decoder = json.JSONDecoder()
    raw = result.stdout.strip()
    idx = 0
    results = []
    while idx < len(raw):
        # Skip whitespace between JSON objects
        while idx < len(raw) and raw[idx] in " \t\r\n":
            idx += 1
        if idx >= len(raw):
            break
        obj, end = decoder.raw_decode(raw, idx)
        results.append(obj)
        idx = end

    if len(results) != len(keys):
        print(
            f"WARNING: expected {len(keys)} result sets but got {len(results)}",
            file=sys.stderr,
        )

    for i, key in enumerate(keys):
        if i < len(results):
            data[key] = results[i].get("rows", [])

    return data


def dolt_sql_csv(query):
    result = subprocess.run(
        ["dolt", "sql", "-r", "csv", "-q", query],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        print(f"ERROR running SQL: {query}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)

    output = result.stdout.strip()
    if not output:
        return []

    reader = csv.DictReader(io.StringIO(output))
    return list(reader)


def get_existing_tables():
    rows = dolt_sql_csv("SHOW TABLES;")
    if not rows:
        return set()
    table_col = next(iter(rows[0].keys()))
    return {row[table_col] for row in rows if row.get(table_col)}


def get_table_columns(table_name):
    rows = dolt_sql_csv(f"DESCRIBE {table_name};")
    return {row.get("Field") for row in rows if row.get("Field")}


def build_queries(existing_tables):
    queries = dict(QUERIES)

    if "character_subclasses" in existing_tables:
        character_subclass_columns = get_table_columns("character_subclasses")
        if (
            "subclass_id" in character_subclass_columns
            and "subclasses" in existing_tables
        ):
            queries["character_subclasses"] = (
                "SELECT cs.character_id, COALESCE(s.name, cs.subclass_name) AS subclass_name "
                "FROM character_subclasses cs "
                "LEFT JOIN subclasses s ON cs.subclass_id = s.id "
                "ORDER BY cs.id;"
            )

    if "character_recommended_subclasses" in existing_tables:
        rec_subclass_columns = get_table_columns("character_recommended_subclasses")
        if "subclass_id" in rec_subclass_columns and "subclasses" in existing_tables:
            queries["character_recommended_subclasses"] = (
                "SELECT crs.character_id, "
                "COALESCE(s.name, crs.subclass_name) AS subclass_name, "
                "crs.sort_order "
                "FROM character_recommended_subclasses crs "
                "LEFT JOIN subclasses s ON crs.subclass_id = s.id "
                "ORDER BY crs.character_id, crs.sort_order, crs.id;"
            )

    if "character_recommended_gear" in existing_tables:
        rec_gear_columns = get_table_columns("character_recommended_gear")
        if "gear_id" in rec_gear_columns and "gear" in existing_tables:
            queries["character_recommended_gear"] = (
                "SELECT crg.character_id, crg.slot, "
                "COALESCE(g.name, crg.gear_name) AS gear_name, "
                "crg.sort_order "
                "FROM character_recommended_gear crg "
                "LEFT JOIN gear g ON crg.gear_id = g.id "
                "ORDER BY crg.character_id, crg.sort_order, crg.id;"
            )

    if "code_rewards" in existing_tables and "resources" in existing_tables:
        code_reward_columns = get_table_columns("code_rewards")
        if "resource_id" in code_reward_columns:
            if "resource_name" in code_reward_columns:
                queries["code_rewards"] = (
                    "SELECT cr.id, cr.code_id, cr.resource_id, cr.quantity, "
                    "COALESCE(r.name, cr.resource_name) AS resolved_resource_name "
                    "FROM code_rewards cr "
                    "LEFT JOIN resources r ON cr.resource_id = r.id "
                    "ORDER BY cr.code_id, cr.id;"
                )
            else:
                queries["code_rewards"] = (
                    "SELECT cr.id, cr.code_id, cr.resource_id, cr.quantity, "
                    "r.name AS resolved_resource_name "
                    "FROM code_rewards cr "
                    "LEFT JOIN resources r ON cr.resource_id = r.id "
                    "ORDER BY cr.code_id, cr.id;"
                )

    return queries


def group_by(rows, key):
    """Group rows by a key into a dict of lists."""
    groups = defaultdict(list)
    for row in rows:
        groups[row[key]].append(row)
    return groups


def write_export(filename, data, output_dir=None):
    """Write data to a JSON file in the given output directory."""
    dest = output_dir or EXPORT_DIR
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"  Exported {len(data)} entries to {path}")


def export_factions(data, output_dir=None):
    recommended_by_faction = group_by(
        data.get("faction_recommended_artifacts", []), "faction_id"
    )
    result = []
    for r in data["factions"]:
        faction_id = r.get("id")
        result.append(
            {
                "name": r.get("name") or "",
                "wyrm": r.get("wyrm") or "",
                "description": r.get("description") or "",
                "recommended_artifacts": [
                    item.get("artifact_name") or ""
                    for item in recommended_by_faction.get(faction_id, [])
                    if item.get("artifact_name")
                ],
                "last_updated": int(r.get("last_updated") or 0),
            }
        )
    result.sort(key=faction_sort_key)
    write_export("factions.json", result, output_dir)


def export_characters(data, output_dir=None):
    factions_by_char = group_by(data["character_factions"], "character_id")
    subclasses_by_char = group_by(data["character_subclasses"], "character_id")
    recommended_subclasses_by_char = group_by(
        data.get("character_recommended_subclasses", []), "character_id"
    )
    recommended_gear_by_char = group_by(
        data.get("character_recommended_gear", []), "character_id"
    )
    talents_by_char = group_by(data["talent_levels"], "character_id")
    skills_by_char = group_by(data["skills"], "character_id")

    result = []
    for c in data["characters"]:
        char_id = c["id"]
        talent_name = c.get("talent_name") or ""
        talent_levels = [
            {"level": tl["level"], "effect": tl.get("effect") or ""}
            for tl in talents_by_char.get(char_id, [])
        ]
        talent = None
        if talent_name or talent_levels:
            talent = {"name": talent_name, "talent_levels": talent_levels}

        recommended_gear_rows = recommended_gear_by_char.get(char_id, [])
        recommended_gear = None
        if recommended_gear_rows:
            recommended_gear = {}
            for row in recommended_gear_rows:
                slot = (row.get("slot") or "").strip().lower()
                gear_name = (row.get("gear_name") or "").strip()
                if slot and gear_name:
                    recommended_gear[slot] = gear_name

        result.append(
            {
                "name": c.get("name") or "",
                "title": c.get("title") or "",
                "quality": c.get("quality") or "",
                "character_class": c.get("character_class") or "",
                "factions": [
                    f["faction_name"] for f in factions_by_char.get(char_id, [])
                ],
                "is_global": bool(c.get("is_global", True)),
                "subclasses": [
                    s["subclass_name"] for s in subclasses_by_char.get(char_id, [])
                ],
                "height": c.get("height") or "",
                "weight": c.get("weight") or "",
                "origin": c.get("origin") or "",
                "lore": c.get("lore") or "",
                "quote": c.get("quote") or "",
                "talent": talent,
                "skills": [
                    {
                        "name": sk.get("name") or "",
                        "type": sk.get("type") or "",
                        "description": sk.get("description") or "",
                        "cooldown": sk.get("cooldown", 0),
                    }
                    for sk in skills_by_char.get(char_id, [])
                ],
                "noble_phantasm": c.get("noble_phantasm") or "",
                "recommended_gear": recommended_gear,
                "recommended_subclasses": [
                    s.get("subclass_name") or ""
                    for s in recommended_subclasses_by_char.get(char_id, [])
                    if s.get("subclass_name")
                ],
                "last_updated": int(c.get("last_updated") or 0),
            }
        )

    result.sort(key=character_sort_key)
    write_export("characters.json", result, output_dir)


def export_subclasses(data, output_dir=None):
    bonus_rows_by_subclass = group_by(data.get("subclass_bonuses", []), "subclass_id")
    class_rows_by_subclass = group_by(
        data.get("subclass_character_classes", []), "subclass_id"
    )

    result = []
    for row in data.get("subclasses", []):
        subclass_id = row.get("id")
        class_rows = class_rows_by_subclass.get(subclass_id, [])
        sorted_classes = sorted(
            class_rows,
            key=lambda item: (
                int(item.get("sort_order") or 0),
                (item.get("character_class") or "").lower(),
            ),
        )
        character_class = (
            sorted_classes[0].get("character_class") if sorted_classes else ""
        )

        bonus_rows = bonus_rows_by_subclass.get(subclass_id, [])
        sorted_bonuses = sorted(
            bonus_rows,
            key=lambda item: int(item.get("sort_order") or 0),
        )

        result.append(
            {
                "name": row.get("name") or "",
                "class": character_class or "",
                "tier": int(row.get("tier") or 0),
                "bonuses": [b.get("bonus_text") or "" for b in sorted_bonuses],
                "effect": row.get("effect") or "",
                "last_updated": int(row.get("last_updated") or 0),
            }
        )

    result.sort(key=subclass_sort_key)
    write_export("subclasses.json", result, output_dir)


def export_wyrmspells(data, output_dir=None):
    result = [
        {
            "name": w.get("name") or "",
            "effect": w.get("effect") or "",
            "type": w.get("type") or "",
            "quality": w.get("quality") or "",
            "exclusive_faction": w.get("exclusive_faction") or None,
            "is_global": bool(int(w.get("is_global", 0))),
            "last_updated": int(w.get("last_updated") or 0),
        }
        for w in data["wyrmspells"]
    ]
    result.sort(key=wyrmspell_sort_key)
    write_export("wyrmspells.json", result, output_dir)


def export_resources(data, output_dir=None):
    if "resources" not in data:
        print("Skipped resources.json (resources table not found in Dolt schema)")
        return
    result = [
        {
            "name": r.get("name") or "",
            "quality": r.get("quality") or "",
            "description": r.get("description") or "",
            "category": r.get("category") or "",
            "last_updated": int(r.get("last_updated") or 0),
        }
        for r in data["resources"]
    ]
    result.sort(key=resource_sort_key)
    write_export("resources.json", result, output_dir)


def export_codes(data, output_dir=None):
    codes_rows = data.get("codes", [])
    rewards_by_code = group_by(data.get("code_rewards", []), "code_id")
    result = []
    for c in codes_rows:
        if rewards_by_code:
            rewards = {
                (r.get("resolved_resource_name") or r.get("resource_name") or ""): int(
                    r.get("quantity", 0)
                )
                for r in rewards_by_code.get(c["id"], [])
                if r.get("resolved_resource_name") or r.get("resource_name")
            }
        else:
            raw_rewards = c.get("rewards")
            if isinstance(raw_rewards, str) and raw_rewards.strip():
                try:
                    parsed = json.loads(raw_rewards)
                    if isinstance(parsed, dict):
                        rewards = parsed
                    elif isinstance(parsed, list):
                        rewards = {
                            r["name"]: int(r.get("quantity", 0))
                            for r in parsed
                            if r.get("name")
                        }
                    else:
                        rewards = {}
                except json.JSONDecodeError:
                    rewards = {}
            elif isinstance(raw_rewards, dict):
                rewards = raw_rewards
            else:
                rewards = {}
        result.append(
            {
                "code": c.get("code") or "",
                "rewards": rewards,
                "active": bool(c.get("active", True)),
                "last_updated": int(c.get("last_updated") or 0),
            }
        )
    write_export("codes.json", result, output_dir)


def export_status_effects(data, output_dir=None):
    result = [
        {
            "name": se.get("name") or "",
            "type": se.get("type") or "",
            "effect": se.get("effect") or "",
            "remark": se.get("remark") or "",
            "last_updated": int(se.get("last_updated") or 0),
        }
        for se in data["status_effects"]
    ]
    result.sort(key=status_effect_sort_key)
    write_export("status-effects.json", result, output_dir)


def export_tier_lists(data, output_dir=None):
    entries_by_tl = group_by(data["tier_list_entries"], "tier_list_id")
    result = []
    for tl in data["tier_lists"]:
        entries = [
            {
                "character_name": e.get("character_name") or "",
                "tier": e.get("tier") or "",
                "note": e.get("note") or "",
            }
            for e in entries_by_tl.get(tl["id"], [])
        ]
        result.append(
            {
                "name": tl.get("name") or "",
                "author": tl.get("author") or "",
                "content_type": tl.get("content_type") or "",
                "description": tl.get("description") or "",
                "entries": entries,
                "last_updated": int(tl.get("last_updated") or 0),
            }
        )
    write_export("tier-lists.json", result, output_dir)


def export_teams(data, output_dir=None):
    members_by_team = group_by(data["team_members"], "team_id")
    subs_by_member = group_by(data["team_member_substitutes"], "team_member_id")

    result = []
    for t in data["teams"]:
        members = []
        for m in members_by_team.get(t["id"], []):
            subs = [s["character_name"] for s in subs_by_member.get(m["id"], [])]
            members.append(
                {
                    "character_name": m.get("character_name") or "",
                    "overdrive_order": m.get("overdrive_order"),
                    "substitutes": subs,
                    "note": m.get("note") or "",
                }
            )
        result.append(
            {
                "name": t.get("name") or "",
                "author": t.get("author") or "",
                "content_type": t.get("content_type") or "",
                "description": t.get("description") or "",
                "faction": t.get("faction") or "",
                "members": members,
                "wyrmspells": {
                    "breach": t.get("breach_wyrmspell") or "",
                    "refuge": t.get("refuge_wyrmspell") or "",
                    "wildcry": t.get("wildcry_wyrmspell") or "",
                    "dragons_call": t.get("dragons_call_wyrmspell") or "",
                },
                "last_updated": int(t.get("last_updated") or 0),
            }
        )
    write_export("teams.json", result, output_dir)


def export_useful_links(data, output_dir=None):
    result = [
        {
            "icon": l.get("icon") or "",
            "application": l.get("application") or "",
            "name": l.get("name") or "",
            "description": l.get("description") or "",
            "link": l.get("link") or "",
            "last_updated": int(l.get("last_updated") or 0),
        }
        for l in data["useful_links"]
    ]
    result.sort(key=useful_link_sort_key)
    write_export("useful-links.json", result, output_dir)


def export_artifacts(data, output_dir=None):
    effects_by_artifact = group_by(data["artifact_effects"], "artifact_id")
    treasures_by_artifact = group_by(data["artifact_treasures"], "artifact_id")
    treasure_effects_by_treasure = group_by(
        data["artifact_treasure_effects"], "treasure_id"
    )

    result = []
    for a in data["artifacts"]:
        artifact_id = a["id"]
        effects = [
            {
                "level": int(e.get("level", 0)),
                "description": e.get("description") or "",
            }
            for e in effects_by_artifact.get(artifact_id, [])
        ]
        treasures = []
        for t in treasures_by_artifact.get(artifact_id, []):
            t_effects = [
                {
                    "level": int(te.get("level", 0)),
                    "description": te.get("description") or "",
                }
                for te in treasure_effects_by_treasure.get(t["id"], [])
            ]
            treasures.append(
                {
                    "name": t.get("name") or "",
                    "lore": t.get("lore") or "",
                    "character_class": t.get("character_class") or "",
                    "effect": t_effects,
                }
            )
        result.append(
            {
                "name": a.get("name") or "",
                "is_global": bool(int(a.get("is_global", 0))),
                "lore": a.get("lore") or "",
                "quality": a.get("quality") or "",
                "effect": effects,
                "columns": int(a.get("columns", 0)),
                "rows": int(a.get("rows", 0)),
                "treasures": treasures,
                "last_updated": int(a.get("last_updated") or 0),
            }
        )
    result.sort(key=artifact_sort_key)
    write_export("artifacts.json", result, output_dir)


def export_howlkins(data, output_dir=None):
    if "howlkins" not in data:
        print("Skipped howlkins.json (howlkins table not found in Dolt schema)")
        return

    stats_by_howlkin = group_by(data.get("howlkin_stats", []), "howlkin_id")
    effects_by_howlkin = group_by(data.get("howlkin_passive_effects", []), "howlkin_id")

    def parse_stat_value(value):
        if value in (None, ""):
            return 0
        try:
            num = float(value)
            return int(num) if num.is_integer() else num
        except (TypeError, ValueError):
            return value

    result = []
    for h in data["howlkins"]:
        howlkin_id = h["id"]
        stats = {}
        for stat in stats_by_howlkin.get(howlkin_id, []):
            name = stat.get("stat_name") or ""
            if not name:
                continue
            stats[name] = parse_stat_value(stat.get("stat_value"))

        passive_effects = [
            e.get("effect") or ""
            for e in effects_by_howlkin.get(howlkin_id, [])
            if e.get("effect")
        ]

        result.append(
            {
                "name": h.get("name") or "",
                "quality": h.get("quality") or "",
                "basic_stats": stats,
                "passive_effects": passive_effects,
                "last_updated": int(h.get("last_updated") or 0),
            }
        )

    result.sort(key=howlkin_sort_key)
    write_export("howlkins.json", result, output_dir)


def export_golden_alliances(data, output_dir=None):
    if "golden_alliances" not in data:
        print(
            "Skipped golden_alliances.json (golden_alliances table not found in Dolt schema)"
        )
        return

    quality_map = {
        h["name"]: h.get("quality", "")
        for h in data.get("howlkins", [])
        if h.get("name")
    }
    howlkins_by_alliance = group_by(
        data.get("golden_alliance_howlkins", []), "alliance_id"
    )
    effects_by_alliance = group_by(
        data.get("golden_alliance_effects", []), "alliance_id"
    )

    result = []
    for ga in data["golden_alliances"]:
        alliance_id = ga["id"]

        howlkins = sorted(
            [
                h["howlkin_name"]
                for h in howlkins_by_alliance.get(alliance_id, [])
                if h.get("howlkin_name")
            ],
            key=lambda n: (QUALITY_RANK.get(quality_map.get(n, ""), 999), n.lower()),
        )

        effects_raw = sorted(
            effects_by_alliance.get(alliance_id, []),
            key=lambda x: (int(x.get("level", 0)), int(x.get("sort_order", 0))),
        )
        effects_by_level: dict = {}
        for e in effects_raw:
            level = int(e.get("level", 0))
            if level not in effects_by_level:
                effects_by_level[level] = []
            if e.get("stat"):
                effects_by_level[level].append(e["stat"])

        effects = [
            {"level": level, "stats": stats}
            for level, stats in sorted(effects_by_level.items())
        ]

        result.append(
            {
                "name": ga.get("name") or "",
                "howlkins": howlkins,
                "effects": effects,
                "last_updated": int(ga.get("last_updated") or 0),
            }
        )

    result.sort(key=golden_alliance_sort_key)
    write_export("golden_alliances.json", result, output_dir)


def export_gear(data, output_dir=None):
    if "gear" not in data or "gear_sets" not in data:
        print("Skipped gear.json (gear table not found in Dolt schema)")
        return

    sets_result = [
        {
            "name": row.get("name") or "",
            "set_bonus": {
                "quantity": int(row.get("bonus_quantity") or 0),
                "description": row.get("bonus_description") or "",
            },
            "last_updated": int(row.get("last_updated") or 0),
        }
        for row in data["gear_sets"]
        if row.get("name")
    ]
    sets_result.sort(key=gear_set_sort_key)
    write_export("gear_sets.json", sets_result, output_dir)

    set_name_by_id = {
        int(row.get("id") or 0): row.get("name") or ""
        for row in data["gear_sets"]
        if row.get("id") is not None
    }

    result = []
    for row in data["gear"]:
        stats_raw = row.get("stats_json")
        if isinstance(stats_raw, str) and stats_raw.strip():
            try:
                stats = json.loads(stats_raw)
                if not isinstance(stats, dict):
                    stats = {}
            except json.JSONDecodeError:
                stats = {}
        elif isinstance(stats_raw, dict):
            stats = stats_raw
        else:
            stats = {}

        result.append(
            {
                "name": row.get("name") or "",
                "set": set_name_by_id.get(int(row.get("set_id") or 0), ""),
                "type": row.get("type") or "",
                "quality": row.get("quality") or "",
                "lore": row.get("lore") or "",
                "stats": stats,
                "last_updated": int(row.get("last_updated") or 0),
            }
        )

    result.sort(key=gear_sort_key)
    write_export("gear.json", result, output_dir)


def export_noble_phantasms(data, output_dir=None):
    effects_by_np = group_by(data["noble_phantasm_effects"], "noble_phantasm_id")
    skills_by_np = group_by(data["noble_phantasm_skills"], "noble_phantasm_id")

    result = []
    for np in data["noble_phantasms"]:
        np_id = np["id"]
        effects = [
            {
                "tier": e.get("tier") or None,
                "tier_level": (
                    int(e.get("tier_level"))
                    if e.get("tier_level") not in (None, "")
                    else None
                ),
                "description": e.get("description") or "",
            }
            for e in effects_by_np.get(np_id, [])
        ]
        skills = [
            {
                "level": int(s.get("level") or 0),
                "tier": s.get("tier") or None,
                "tier_level": (
                    int(s.get("tier_level"))
                    if s.get("tier_level") not in (None, "")
                    else None
                ),
                "description": s.get("description") or "",
            }
            for s in skills_by_np.get(np_id, [])
        ]

        result.append(
            {
                "name": np.get("name") or "",
                "character": np.get("character_name") or None,
                "is_global": bool(int(np.get("is_global", 0))),
                "lore": np.get("lore") or "",
                "effects": effects,
                "skills": skills,
                "last_updated": int(np.get("last_updated") or 0),
            }
        )

    result.sort(key=noble_phantasm_sort_key)
    write_export("noble_phantasm.json", result, output_dir)


def export_changelog(data, output_dir=None):
    changes_by_cl = group_by(data["changelog_changes"], "changelog_id")
    result = []
    for cl in data["changelog"]:
        changes = [
            {
                "type": ch.get("type") or "",
                "category": ch.get("category") or "",
                "description": ch.get("description") or "",
            }
            for ch in changes_by_cl.get(cl["id"], [])
        ]
        result.append(
            {
                "date": str(cl.get("date") or ""),
                "version": cl.get("version") or "",
                "changes": changes,
                "last_updated": int(cl.get("last_updated") or 0),
            }
        )
    write_export("changelog.json", result, output_dir)


# Table name -> (key column, query key) for hash export
HASH_SOURCES = {
    "factions": ("name", "factions"),
    "characters": ("name", "characters"),
    "subclasses": ("name", "subclasses"),
    "wyrmspells": ("name", "wyrmspells"),
    "resources": ("name", "resources"),
    "codes": ("code", "codes"),
    "status_effects": ("name", "status_effects"),
    "tier_lists": ("name", "tier_lists"),
    "teams": ("name", "teams"),
    "useful_links": ("name", "useful_links"),
    "artifacts": ("name", "artifacts"),
    "howlkins": ("name", "howlkins"),
    "gear_sets": ("name", "gear_sets"),
    "gear": ("name", "gear"),
    "golden_alliances": ("name", "golden_alliances"),
    "noble_phantasms": ("name", "noble_phantasms"),
    "changelog": ("version", "changelog"),
}


def export_hashes(data, output_dir=None):
    """Export data_hash and last_updated from Dolt into a standalone hashes.json file."""
    hashes = {}
    for table, (key_col, query_key) in HASH_SOURCES.items():
        rows = data.get(query_key, [])
        if not rows:
            continue
        table_hashes = {}
        for row in rows:
            key = row.get(key_col)
            h = row.get("data_hash") or ""
            ts_raw = row.get("last_updated")
            ts = int(ts_raw) if ts_raw not in (None, "") else 0
            if key and h:
                table_hashes[key] = {"hash": h, "ts": ts}
        if table_hashes:
            hashes[table] = table_hashes

    dest = output_dir or EXPORT_DIR
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / "hashes.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(hashes, f, indent=2, ensure_ascii=False)
        f.write("\n")
    total = sum(len(v) for v in hashes.values())
    print(f"  Exported {total} hashes across {len(hashes)} tables to {path}")


# Map target names to (export_function, required_query_keys)
EXPORTERS = {
    "factions": (
        export_factions,
        {
            "factions",
            "faction_recommended_artifacts",
        },
    ),
    "characters": (
        export_characters,
        {
            "characters",
            "character_factions",
            "character_subclasses",
            "character_recommended_subclasses",
            "character_recommended_gear",
            "talent_levels",
            "skills",
        },
    ),
    "subclasses": (
        export_subclasses,
        {
            "subclasses",
            "subclass_bonuses",
            "subclass_character_classes",
        },
    ),
    "wyrmspells": (export_wyrmspells, {"wyrmspells"}),
    "resources": (export_resources, {"resources"}),
    "codes": (export_codes, {"codes", "code_rewards"}),
    "status-effects": (export_status_effects, {"status_effects"}),
    "tier-lists": (export_tier_lists, {"tier_lists", "tier_list_entries"}),
    "teams": (export_teams, {"teams", "team_members", "team_member_substitutes"}),
    "useful-links": (export_useful_links, {"useful_links"}),
    "artifacts": (
        export_artifacts,
        {
            "artifacts",
            "artifact_effects",
            "artifact_treasures",
            "artifact_treasure_effects",
        },
    ),
    "howlkins": (
        export_howlkins,
        {"howlkins", "howlkin_stats", "howlkin_passive_effects"},
    ),
    "gear": (export_gear, {"gear", "gear_sets"}),
    "golden-alliances": (
        export_golden_alliances,
        {
            "golden_alliances",
            "golden_alliance_howlkins",
            "golden_alliance_effects",
            "howlkins",
        },
    ),
    "noble-phantasms": (
        export_noble_phantasms,
        {
            "noble_phantasms",
            "noble_phantasm_effects",
            "noble_phantasm_skills",
        },
    ),
    "changelog": (export_changelog, {"changelog", "changelog_changes"}),
}


def main():
    parser = argparse.ArgumentParser(description="Export Dolt database to JSON files")
    parser.add_argument(
        "--target",
        choices=list(EXPORTERS.keys()) + ["all"],
        default="all",
        help="Which table(s) to export (default: all)",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Output directory relative to project root (default: backend/exports/)",
    )
    args = parser.parse_args()

    if not DOLT_DIR.exists():
        print(f"Error: Dolt database not found at {DOLT_DIR}", file=sys.stderr)
        sys.exit(1)

    output_dir = None
    if args.output_dir:
        output_dir = ROOT_DIR / args.output_dir
        print(f"Exporting Dolt database to JSON in {output_dir}...")
    else:
        print("Exporting Dolt database to JSON...")

    if args.target == "all":
        targets = list(EXPORTERS.keys())
    else:
        targets = [args.target]

    existing_tables = get_existing_tables()
    queries = build_queries(existing_tables)

    # Collect all needed query keys
    needed_keys = set()
    for t in targets:
        needed_keys |= {
            k for k in EXPORTERS[t][1] if k in existing_tables and k in queries
        }

    # Also fetch keys needed for hashes.json (data_hash + last_updated live in parent tables)
    hash_keys = {
        query_key
        for _, (_, query_key) in HASH_SOURCES.items()
        if query_key in existing_tables and query_key in queries
    }
    needed_keys |= hash_keys

    # Single batch fetch
    data = fetch_all(needed_keys, queries)

    # Run exporters
    for t in targets:
        EXPORTERS[t][0](data, output_dir=output_dir)

    # Always write hashes.json alongside the data files
    export_hashes(data, output_dir=output_dir)

    print("Done!")


if __name__ == "__main__":
    main()
