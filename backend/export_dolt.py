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

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
EXPORT_DIR = SCRIPT_DIR / "exports"

# Sort-order lookups (lower index = higher priority)
QUALITY_ORDER = ["UR", "SSR EX", "SSR+", "SSR", "SR+", "R", "N"]
QUALITY_RANK = {q: i for i, q in enumerate(QUALITY_ORDER)}

STATE_ORDER = ["Buff", "Debuff", "Special", "Control", "Elemental", "Blessing", "Exclusive"]
STATE_RANK = {s: i for i, s in enumerate(STATE_ORDER)}

RESOURCE_CATEGORY_ORDER = ["Currency", "Gift", "Item", "Material", "Summoning", "Shard"]
RESOURCE_CATEGORY_RANK = {c: i for i, c in enumerate(RESOURCE_CATEGORY_ORDER)}

TIER_ORDER = ["S+", "S", "A", "B", "C", "D"]
TIER_RANK = {t: i for i, t in enumerate(TIER_ORDER)}

CLASS_ORDER = ["Guardian", "Priest", "Assassin", "Warrior", "Archer", "Mage"]
CLASS_RANK = {c: i for i, c in enumerate(CLASS_ORDER)}

_FALLBACK = 999  # for unknown values

# All queries needed, keyed by name. Executed in a single dolt process.
QUERIES = {
    "factions": "SELECT * FROM factions ORDER BY id;",
    "characters": "SELECT * FROM characters ORDER BY id;",
    "character_factions": (
        "SELECT cf.character_id, f.name AS faction_name "
        "FROM character_factions cf JOIN factions f ON cf.faction_id = f.id "
        "ORDER BY cf.character_id, cf.sort_order, cf.faction_id;"
    ),
    "character_subclasses": (
        "SELECT character_id, subclass_name FROM character_subclasses ORDER BY id;"
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
    result = []
    for r in data["factions"]:
        result.append(
            {
                "name": r.get("name") or "",
                "wyrm": r.get("wyrm") or "",
                "description": r.get("description") or "",
            }
        )
    write_export("factions.json", result, output_dir)


def export_characters(data, output_dir=None):
    factions_by_char = group_by(data["character_factions"], "character_id")
    subclasses_by_char = group_by(data["character_subclasses"], "character_id")
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
            }
        )

    result.sort(key=lambda c: (
        CLASS_RANK.get(c["character_class"], _FALLBACK),
        QUALITY_RANK.get(c["quality"], _FALLBACK),
        c["name"].lower(),
    ))
    write_export("characters.json", result, output_dir)


def export_wyrmspells(data, output_dir=None):
    result = [
        {
            "name": w.get("name") or "",
            "effect": w.get("effect") or "",
            "type": w.get("type") or "",
            "quality": w.get("quality") or "",
            "exclusive_faction": w.get("exclusive_faction") or None,
            "is_global": bool(int(w.get("is_global", 0))),
        }
        for w in data["wyrmspells"]
    ]
    result.sort(key=lambda w: (
        w["type"].lower(),
        QUALITY_RANK.get(w["quality"], _FALLBACK),
        w["name"].lower(),
    ))
    write_export("wyrmspells.json", result, output_dir)


def export_resources(data, output_dir=None):
    if "resources" not in data:
        print("Skipped resources.json (resources table not found in Dolt schema)")
        return
    result = [
        {
            "name": r.get("name") or "",
            "description": r.get("description") or "",
            "category": r.get("category") or "",
        }
        for r in data["resources"]
    ]
    result.sort(key=lambda r: (
        RESOURCE_CATEGORY_RANK.get(r["category"], _FALLBACK),
        r["name"].lower(),
    ))
    write_export("resources.json", result, output_dir)


def export_codes(data, output_dir=None):
    codes_rows = data.get("codes", [])
    rewards_by_code = group_by(data.get("code_rewards", []), "code_id")
    result = []
    for c in codes_rows:
        if rewards_by_code:
            rewards = [
                {
                    "name": r.get("resolved_resource_name")
                    or r.get("resource_name")
                    or "",
                    "quantity": r.get("quantity", 0),
                }
                for r in rewards_by_code.get(c["id"], [])
            ]
        else:
            raw_rewards = c.get("rewards")
            if isinstance(raw_rewards, str) and raw_rewards.strip():
                try:
                    parsed = json.loads(raw_rewards)
                    rewards = parsed if isinstance(parsed, list) else []
                except json.JSONDecodeError:
                    rewards = []
            elif isinstance(raw_rewards, list):
                rewards = raw_rewards
            else:
                rewards = []
        result.append(
            {
                "code": c.get("code") or "",
                "rewards": rewards,
                "active": bool(c.get("active", True)),
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
        }
        for se in data["status_effects"]
    ]
    result.sort(key=lambda se: (
        STATE_RANK.get(se["type"], _FALLBACK),
        se["name"].lower(),
    ))
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
        }
        for l in data["useful_links"]
    ]
    result.sort(key=lambda l: (l["application"].lower(), l["name"].lower()))
    write_export("useful-links.json", result, output_dir)


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
            }
        )
    write_export("changelog.json", result, output_dir)


# Map target names to (export_function, required_query_keys)
EXPORTERS = {
    "factions": (export_factions, {"factions"}),
    "characters": (
        export_characters,
        {
            "characters",
            "character_factions",
            "character_subclasses",
            "talent_levels",
            "skills",
        },
    ),
    "wyrmspells": (export_wyrmspells, {"wyrmspells"}),
    "resources": (export_resources, {"resources"}),
    "codes": (export_codes, {"codes", "code_rewards"}),
    "status-effects": (export_status_effects, {"status_effects"}),
    "tier-lists": (export_tier_lists, {"tier_lists", "tier_list_entries"}),
    "teams": (export_teams, {"teams", "team_members", "team_member_substitutes"}),
    "useful-links": (export_useful_links, {"useful_links"}),
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

    # Single batch fetch
    data = fetch_all(needed_keys, queries)

    # Run exporters
    for t in targets:
        EXPORTERS[t][0](data, output_dir=output_dir)

    print("Done!")


if __name__ == "__main__":
    main()
