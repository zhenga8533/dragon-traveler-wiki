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
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
EXPORT_DIR = SCRIPT_DIR / "exports"

# All queries needed, keyed by name. Executed in a single dolt process.
QUERIES = {
    "factions": "SELECT * FROM factions ORDER BY id;",
    "characters": "SELECT * FROM characters ORDER BY id;",
    "character_factions": (
        "SELECT cf.character_id, f.name AS faction_name "
        "FROM character_factions cf JOIN factions f ON cf.faction_id = f.id "
        "ORDER BY cf.character_id, cf.sort_order;"
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
    "codes": "SELECT * FROM codes ORDER BY id;",
    "status_effects": "SELECT * FROM status_effects ORDER BY id;",
    "tier_lists": "SELECT * FROM tier_lists ORDER BY id;",
    "tier_list_entries": (
        "SELECT * FROM tier_list_entries ORDER BY tier_list_id, id;"
    ),
    "teams": "SELECT * FROM teams ORDER BY id;",
    "team_members": "SELECT * FROM team_members ORDER BY team_id, id;",
    "team_member_substitutes": (
        "SELECT * FROM team_member_substitutes ORDER BY team_member_id, id;"
    ),
    "useful_links": "SELECT * FROM useful_links ORDER BY id;",
    "changelog": "SELECT * FROM changelog ORDER BY id;",
    "changelog_changes": (
        "SELECT * FROM changelog_changes ORDER BY changelog_id, id;"
    ),
}


def fetch_all(needed_keys):
    """Run all needed queries in a single dolt sql call and return results keyed by name."""
    queries_to_run = {k: v for k, v in QUERIES.items() if k in needed_keys}
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

    # Dolt outputs one JSON object per line for each query result
    keys = list(queries_to_run.keys())
    data = {k: [] for k in keys}
    lines = [line for line in result.stdout.strip().split("\n") if line.strip()]

    for i, line in enumerate(lines):
        if i < len(keys):
            parsed = json.loads(line)
            data[keys[i]] = parsed.get("rows", [])

    return data


def group_by(rows, key):
    """Group rows by a key into a dict of lists."""
    groups = defaultdict(list)
    for row in rows:
        groups[row[key]].append(row)
    return groups


def _flat_json(value):
    """Single-line JSON representation using Prettier's style (bracketSpacing for objects)."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return json.dumps(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        if not value:
            return "[]"
        return "[" + ", ".join(_flat_json(v) for v in value) + "]"
    if isinstance(value, dict):
        if not value:
            return "{}"
        items = [f"{json.dumps(k, ensure_ascii=False)}: {_flat_json(v)}" for k, v in value.items()]
        return "{ " + ", ".join(items) + " }"
    return json.dumps(value, ensure_ascii=False)


def _format_json(value, print_width=80, indent_size=2, depth=0, start_col=None):
    """Format a JSON value like Prettier (collapse to one line when it fits)."""
    if start_col is None:
        start_col = indent_size * depth
    flat = _flat_json(value)
    if start_col + len(flat) <= print_width:
        return flat

    indent = " " * (indent_size * (depth + 1))
    outer = " " * (indent_size * depth)

    if isinstance(value, list):
        if not value:
            return "[]"
        items = []
        for item in value:
            formatted = _format_json(item, print_width, indent_size, depth + 1)
            items.append(f"{indent}{formatted}")
        return "[\n" + ",\n".join(items) + f"\n{outer}]"

    if isinstance(value, dict):
        if not value:
            return "{}"
        items = []
        for key, val in value.items():
            key_str = json.dumps(key, ensure_ascii=False)
            prefix = f"{key_str}: "
            val_col = indent_size * (depth + 1) + len(prefix)
            formatted = _format_json(val, print_width, indent_size, depth + 1, val_col)
            items.append(f"{indent}{prefix}{formatted}")
        return "{\n" + ",\n".join(items) + f"\n{outer}}}"

    return flat


def write_export(filename, data, output_dir=None):
    """Write data to a JSON file in the given output directory."""
    dest = output_dir or EXPORT_DIR
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / filename
    with open(path, "w", encoding="utf-8") as f:
        f.write(_format_json(data) + "\n")
    print(f"  Exported {len(data)} entries to {path}")


def export_factions(data, output_dir=None):
    result = []
    for r in data["factions"]:
        result.append({
            "name": r.get("name") or "",
            "wyrm": r.get("wyrm") or "",
            "description": r.get("description") or "",
        })
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

        result.append({
            "name": c.get("name") or "",
            "title": c.get("title") or "",
            "quality": c.get("quality") or "",
            "character_class": c.get("character_class") or "",
            "factions": [f["faction_name"] for f in factions_by_char.get(char_id, [])],
            "is_global": bool(c.get("is_global", True)),
            "subclasses": [s["subclass_name"] for s in subclasses_by_char.get(char_id, [])],
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
        })

    write_export("characters.json", result, output_dir)


def export_wyrmspells(data, output_dir=None):
    result = [
        {"name": w.get("name") or "", "effect": w.get("effect") or "", "type": w.get("type") or ""}
        for w in data["wyrmspells"]
    ]
    write_export("wyrmspells.json", result, output_dir)


def export_codes(data, output_dir=None):
    result = [
        {"code": c.get("code") or "", "active": bool(c.get("active", True))}
        for c in data["codes"]
    ]
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
    write_export("status-effects.json", result, output_dir)


def export_tier_lists(data, output_dir=None):
    entries_by_tl = group_by(data["tier_list_entries"], "tier_list_id")
    result = []
    for tl in data["tier_lists"]:
        entries = [
            {"character_name": e.get("character_name") or "", "tier": e.get("tier") or ""}
            for e in entries_by_tl.get(tl["id"], [])
        ]
        result.append({
            "name": tl.get("name") or "",
            "author": tl.get("author") or "",
            "content_type": tl.get("content_type") or "",
            "description": tl.get("description") or "",
            "entries": entries,
        })
    write_export("tier-lists.json", result, output_dir)


def export_teams(data, output_dir=None):
    members_by_team = group_by(data["team_members"], "team_id")
    subs_by_member = group_by(data["team_member_substitutes"], "team_member_id")

    result = []
    for t in data["teams"]:
        members = []
        for m in members_by_team.get(t["id"], []):
            subs = [s["character_name"] for s in subs_by_member.get(m["id"], [])]
            members.append({
                "character_name": m.get("character_name") or "",
                "overdrive_order": m.get("overdrive_order"),
                "substitutes": subs,
            })
        result.append({
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
        })
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
        result.append({
            "date": str(cl.get("date") or ""),
            "version": cl.get("version") or "",
            "changes": changes,
        })
    write_export("changelog.json", result, output_dir)


# Map target names to (export_function, required_query_keys)
EXPORTERS = {
    "factions": (export_factions, {"factions"}),
    "characters": (export_characters, {
        "characters", "character_factions", "character_subclasses",
        "talent_levels", "skills",
    }),
    "wyrmspells": (export_wyrmspells, {"wyrmspells"}),
    "codes": (export_codes, {"codes"}),
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

    # Collect all needed query keys
    needed_keys = set()
    for t in targets:
        needed_keys |= EXPORTERS[t][1]

    # Single batch fetch
    data = fetch_all(needed_keys)

    # Run exporters
    for t in targets:
        EXPORTERS[t][0](data, output_dir=output_dir)

    print("Done!")


if __name__ == "__main__":
    main()
