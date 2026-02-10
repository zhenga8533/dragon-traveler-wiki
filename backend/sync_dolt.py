"""
Sync JSON data files into the Dolt database.

Usage:
    python -m backend.sync_dolt              # sync and commit
    python -m backend.sync_dolt --push       # sync, commit, and push to DoltHub
    python -m backend.sync_dolt --dry-run    # show SQL without executing
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
DATA_DIR = ROOT_DIR / "data"


def escape_sql(value):
    """Escape a value for safe SQL insertion."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    s = s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
    return f"'{s}'"


def dolt_sql(query, dry_run=False):
    """Run a SQL query via dolt sql -q."""
    if dry_run:
        preview = query[:200].encode("ascii", errors="replace").decode("ascii")
        print(f"  SQL: {preview}{'...' if len(query) > 200 else ''}")
        return ""
    result = subprocess.run(
        ["dolt", "sql", "-q", query],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR running SQL: {query[:200]}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return result.stdout


def dolt_cmd(*args):
    """Run a dolt command."""
    result = subprocess.run(
        ["dolt", *args],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR running dolt {' '.join(args)}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        # Don't exit on commit with nothing to commit
        if "nothing to commit" in result.stderr.lower() or "nothing to commit" in result.stdout.lower():
            return result.stdout
        sys.exit(1)
    return result.stdout


def load_json(filename):
    """Load a JSON file from the data directory."""
    path = DATA_DIR / filename
    if not path.exists():
        print(f"Warning: {filename} not found, skipping")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Sync functions
# ---------------------------------------------------------------------------

def sync_factions(data, dry_run=False):
    """Sync factions.json -> factions table."""
    dolt_sql("DELETE FROM character_factions;", dry_run)
    dolt_sql("DELETE FROM factions;", dry_run)
    for i, f in enumerate(data, 1):
        if not f.get("name"):
            continue
        dolt_sql(
            f"INSERT INTO factions (id, name, wyrm, description) VALUES "
            f"({i}, {escape_sql(f['name'])}, {escape_sql(f.get('wyrm'))}, {escape_sql(f.get('description'))});",
            dry_run,
        )
    print(f"  Synced {len([f for f in data if f.get('name')])} factions")


def sync_characters(data, factions, dry_run=False):
    """Sync characters.json -> characters + related tables."""
    # Clear child tables first (foreign keys)
    for table in ["skills", "talent_levels", "character_subclasses", "character_factions", "characters"]:
        dolt_sql(f"DELETE FROM {table};", dry_run)

    # Build faction name -> id lookup
    faction_ids = {}
    for i, f in enumerate(factions, 1):
        if f.get("name"):
            faction_ids[f["name"]] = i

    char_id = 0
    for c in data:
        if not c.get("name"):
            continue
        char_id += 1

        # Insert character
        talent_name = c.get("talent", {}).get("name", "") if c.get("talent") else ""
        dolt_sql(
            f"INSERT INTO characters (id, name, title, quality, character_class, is_global, "
            f"height, weight, origin, lore, quote, talent_name, noble_phantasm) VALUES "
            f"({char_id}, {escape_sql(c['name'])}, {escape_sql(c.get('title'))}, "
            f"{escape_sql(c.get('quality'))}, {escape_sql(c.get('character_class'))}, "
            f"{escape_sql(c.get('is_global', True))}, {escape_sql(c.get('height'))}, "
            f"{escape_sql(c.get('weight'))}, {escape_sql(c.get('origin'))}, "
            f"{escape_sql(c.get('lore'))}, {escape_sql(c.get('quote'))}, "
            f"{escape_sql(talent_name)}, {escape_sql(c.get('noble_phantasm'))});",
            dry_run,
        )

        # Subclasses
        for sc in c.get("subclasses", []):
            if sc:
                dolt_sql(
                    f"INSERT INTO character_subclasses (character_id, subclass_name) VALUES "
                    f"({char_id}, {escape_sql(sc)});",
                    dry_run,
                )

        # Factions
        for fname in c.get("factions", []):
            fid = faction_ids.get(fname)
            if fid:
                dolt_sql(
                    f"INSERT INTO character_factions (character_id, faction_id) VALUES "
                    f"({char_id}, {fid});",
                    dry_run,
                )

        # Talent levels
        talent = c.get("talent") or {}
        for tl in talent.get("talent_levels", []):
            dolt_sql(
                f"INSERT INTO talent_levels (character_id, level, effect) VALUES "
                f"({char_id}, {tl['level']}, {escape_sql(tl.get('effect'))});",
                dry_run,
            )

        # Skills
        for sk in c.get("skills", []):
            if not sk.get("name"):
                continue
            dolt_sql(
                f"INSERT INTO skills (character_id, name, type, description, cooldown) VALUES "
                f"({char_id}, {escape_sql(sk['name'])}, {escape_sql(sk.get('type'))}, "
                f"{escape_sql(sk.get('description'))}, {escape_sql(sk.get('cooldown', 0))});",
                dry_run,
            )

    print(f"  Synced {char_id} characters")


def sync_wyrmspells(data, dry_run=False):
    """Sync wyrmspells.json -> wyrmspells table."""
    dolt_sql("DELETE FROM wyrmspells;", dry_run)
    for w in data:
        if not w.get("name"):
            continue
        dolt_sql(
            f"INSERT INTO wyrmspells (name, effect, type) VALUES "
            f"({escape_sql(w['name'])}, {escape_sql(w.get('effect'))}, {escape_sql(w.get('type'))});",
            dry_run,
        )
    print(f"  Synced {len([w for w in data if w.get('name')])} wyrmspells")


def sync_codes(data, dry_run=False):
    """Sync codes.json -> codes table."""
    dolt_sql("DELETE FROM codes;", dry_run)
    for c in data:
        if not c.get("code"):
            continue
        dolt_sql(
            f"INSERT INTO codes (code, active) VALUES "
            f"({escape_sql(c['code'])}, {escape_sql(c.get('active', True))});",
            dry_run,
        )
    print(f"  Synced {len([c for c in data if c.get('code')])} codes")


def sync_status_effects(data, dry_run=False):
    """Sync status-effects.json -> status_effects table."""
    dolt_sql("DELETE FROM status_effects;", dry_run)
    for se in data:
        if not se.get("name"):
            continue
        dolt_sql(
            f"INSERT INTO status_effects (name, type, effect, remark) VALUES "
            f"({escape_sql(se['name'])}, {escape_sql(se.get('type'))}, "
            f"{escape_sql(se.get('effect'))}, {escape_sql(se.get('remark'))});",
            dry_run,
        )
    print(f"  Synced {len([se for se in data if se.get('name')])} status effects")


def sync_tier_lists(data, dry_run=False):
    """Sync tier-lists.json -> tier_lists + tier_list_entries tables."""
    dolt_sql("DELETE FROM tier_list_entries;", dry_run)
    dolt_sql("DELETE FROM tier_lists;", dry_run)
    tl_id = 0
    for tl in data:
        if not tl.get("name"):
            continue
        tl_id += 1
        dolt_sql(
            f"INSERT INTO tier_lists (id, name, author, content_type, description) VALUES "
            f"({tl_id}, {escape_sql(tl['name'])}, {escape_sql(tl.get('author'))}, "
            f"{escape_sql(tl.get('content_type'))}, {escape_sql(tl.get('description'))});",
            dry_run,
        )
        for entry in tl.get("entries", []):
            dolt_sql(
                f"INSERT INTO tier_list_entries (tier_list_id, character_name, tier) VALUES "
                f"({tl_id}, {escape_sql(entry.get('character_name'))}, {escape_sql(entry.get('tier'))});",
                dry_run,
            )
    print(f"  Synced {tl_id} tier lists")


def sync_teams(data, dry_run=False):
    """Sync teams.json -> teams + team_members tables."""
    dolt_sql("DELETE FROM team_members;", dry_run)
    dolt_sql("DELETE FROM teams;", dry_run)
    team_id = 0
    for t in data:
        if not t.get("name"):
            continue
        team_id += 1
        ws = t.get("wyrmspells") or {}
        dolt_sql(
            f"INSERT INTO teams (id, name, author, content_type, description, faction, "
            f"breach_wyrmspell, refuge_wyrmspell) VALUES "
            f"({team_id}, {escape_sql(t['name'])}, {escape_sql(t.get('author'))}, "
            f"{escape_sql(t.get('content_type'))}, {escape_sql(t.get('description'))}, "
            f"{escape_sql(t.get('faction'))}, {escape_sql(ws.get('breach'))}, "
            f"{escape_sql(ws.get('refuge'))});",
            dry_run,
        )
        for m in t.get("members", []):
            dolt_sql(
                f"INSERT INTO team_members (team_id, character_name, overdrive_order) VALUES "
                f"({team_id}, {escape_sql(m.get('character_name'))}, "
                f"{escape_sql(m.get('overdrive_order'))});",
                dry_run,
            )
    print(f"  Synced {team_id} teams")


def sync_useful_links(data, dry_run=False):
    """Sync useful-links.json -> useful_links table."""
    dolt_sql("DELETE FROM useful_links;", dry_run)
    for link in data:
        if not link.get("name"):
            continue
        dolt_sql(
            f"INSERT INTO useful_links (icon, application, name, description, link) VALUES "
            f"({escape_sql(link.get('icon'))}, {escape_sql(link.get('application'))}, "
            f"{escape_sql(link['name'])}, {escape_sql(link.get('description'))}, "
            f"{escape_sql(link.get('link'))});",
            dry_run,
        )
    print(f"  Synced {len([l for l in data if l.get('name')])} useful links")


def sync_changelog(data, dry_run=False):
    """Sync changelog.json -> changelog + changelog_changes tables."""
    dolt_sql("DELETE FROM changelog_changes;", dry_run)
    dolt_sql("DELETE FROM changelog;", dry_run)
    cl_id = 0
    for entry in data:
        if not entry.get("version"):
            continue
        cl_id += 1
        dolt_sql(
            f"INSERT INTO changelog (id, date, version) VALUES "
            f"({cl_id}, {escape_sql(entry.get('date'))}, {escape_sql(entry['version'])});",
            dry_run,
        )
        for change in entry.get("changes", []):
            dolt_sql(
                f"INSERT INTO changelog_changes (changelog_id, type, category, description) VALUES "
                f"({cl_id}, {escape_sql(change.get('type'))}, {escape_sql(change.get('category'))}, "
                f"{escape_sql(change.get('description'))});",
                dry_run,
            )
    print(f"  Synced {cl_id} changelog entries")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync JSON data into Dolt database")
    parser.add_argument("--push", action="store_true", help="Push to DoltHub after commit")
    parser.add_argument("--dry-run", action="store_true", help="Show SQL without executing")
    args = parser.parse_args()

    if not DOLT_DIR.exists():
        print(f"Error: Dolt database not found at {DOLT_DIR}", file=sys.stderr)
        sys.exit(1)

    print("Loading JSON data...")
    factions_data = load_json("factions.json")
    characters_data = load_json("characters.json")
    wyrmspells_data = load_json("wyrmspells.json")
    codes_data = load_json("codes.json")
    status_effects_data = load_json("status-effects.json")
    tier_lists_data = load_json("tier-lists.json")
    teams_data = load_json("teams.json")
    useful_links_data = load_json("useful-links.json")
    changelog_data = load_json("changelog.json")

    print("Syncing to Dolt..." + (" (dry run)" if args.dry_run else ""))

    # Factions must be synced before characters (FK dependency)
    sync_factions(factions_data, args.dry_run)
    sync_characters(characters_data, factions_data, args.dry_run)
    sync_wyrmspells(wyrmspells_data, args.dry_run)
    sync_codes(codes_data, args.dry_run)
    sync_status_effects(status_effects_data, args.dry_run)
    sync_tier_lists(tier_lists_data, args.dry_run)
    sync_teams(teams_data, args.dry_run)
    sync_useful_links(useful_links_data, args.dry_run)
    sync_changelog(changelog_data, args.dry_run)

    if args.dry_run:
        print("\nDry run complete — no changes made.")
        return

    # Commit changes in Dolt
    print("\nCommitting to Dolt...")
    dolt_cmd("add", ".")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = dolt_cmd("commit", "-m", f"Sync from JSON data ({timestamp})", "--allow-empty")
    if "nothing to commit" in result.lower():
        print("No changes to commit.")
    else:
        print("Committed successfully.")

    if args.push:
        print("Pushing to DoltHub...")
        dolt_cmd("push")
        print("Pushed successfully.")

    print("Done!")


if __name__ == "__main__":
    main()
