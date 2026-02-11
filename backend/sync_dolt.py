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
    """Run a SQL query via dolt sql, piping through stdin to avoid command-line length limits."""
    if dry_run:
        preview = query[:200].encode("ascii", errors="replace").decode("ascii")
        print(f"  SQL: {preview}{'...' if len(query) > 200 else ''}")
        return ""
    result = subprocess.run(
        ["dolt", "sql"],
        cwd=DOLT_DIR,
        input=query,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        print(f"ERROR running SQL: {query[:200]}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return result.stdout


class SqlBatch:
    """Collects SQL statements and executes them in a single dolt sql call."""

    def __init__(self, dry_run=False):
        self.statements = []
        self.dry_run = dry_run

    def add(self, sql):
        self.statements.append(sql)

    def flush(self):
        if not self.statements:
            return
        combined = "\n".join(self.statements)
        dolt_sql(combined, self.dry_run)
        self.statements.clear()


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

def sync_factions(data, batch):
    """Sync factions.json -> factions table."""
    batch.add("DELETE FROM character_factions;")
    batch.add("DELETE FROM factions;")
    for i, f in enumerate(data, 1):
        if not f.get("name"):
            continue
        batch.add(
            f"INSERT INTO factions (id, name, wyrm, description) VALUES "
            f"({i}, {escape_sql(f['name'])}, {escape_sql(f.get('wyrm'))}, {escape_sql(f.get('description'))});"
        )
    count = len([f for f in data if f.get("name")])
    print(f"  Synced {count} factions")


def sync_characters(data, factions, batch):
    """Sync characters.json -> characters + related tables."""
    for table in ["skills", "talent_levels", "character_subclasses", "character_factions", "characters"]:
        batch.add(f"DELETE FROM {table};")
    for table in ["skills", "talent_levels", "character_subclasses", "characters"]:
        batch.add(f"ALTER TABLE {table} AUTO_INCREMENT = 1;")

    faction_ids = {}
    for i, f in enumerate(factions, 1):
        if f.get("name"):
            faction_ids[f["name"]] = i

    char_id = 0
    subclass_id = 0
    talent_id = 0
    skill_id = 0
    for c in data:
        if not c.get("name"):
            continue
        char_id += 1

        talent_name = c.get("talent", {}).get("name", "") if c.get("talent") else ""
        batch.add(
            f"INSERT INTO characters (id, name, title, quality, character_class, is_global, "
            f"height, weight, origin, lore, quote, talent_name, noble_phantasm) VALUES "
            f"({char_id}, {escape_sql(c['name'])}, {escape_sql(c.get('title'))}, "
            f"{escape_sql(c.get('quality'))}, {escape_sql(c.get('character_class'))}, "
            f"{escape_sql(c.get('is_global', True))}, {escape_sql(c.get('height'))}, "
            f"{escape_sql(c.get('weight'))}, {escape_sql(c.get('origin'))}, "
            f"{escape_sql(c.get('lore'))}, {escape_sql(c.get('quote'))}, "
            f"{escape_sql(talent_name)}, {escape_sql(c.get('noble_phantasm'))});"
        )

        for sc in c.get("subclasses", []):
            if sc:
                subclass_id += 1
                batch.add(
                    f"INSERT INTO character_subclasses (id, character_id, subclass_name) VALUES "
                    f"({subclass_id}, {char_id}, {escape_sql(sc)});"
                )

        for fname in c.get("factions", []):
            fid = faction_ids.get(fname)
            if fid:
                batch.add(
                    f"INSERT INTO character_factions (character_id, faction_id) VALUES "
                    f"({char_id}, {fid});"
                )

        talent = c.get("talent") or {}
        for tl in talent.get("talent_levels", []):
            talent_id += 1
            batch.add(
                f"INSERT INTO talent_levels (id, character_id, level, effect) VALUES "
                f"({talent_id}, {char_id}, {tl['level']}, {escape_sql(tl.get('effect'))});"
            )

        for sk in c.get("skills", []):
            if not sk.get("name"):
                continue
            skill_id += 1
            batch.add(
                f"INSERT INTO skills (id, character_id, name, type, description, cooldown) VALUES "
                f"({skill_id}, {char_id}, {escape_sql(sk['name'])}, {escape_sql(sk.get('type'))}, "
                f"{escape_sql(sk.get('description'))}, {escape_sql(sk.get('cooldown', 0))});"
            )

    print(f"  Synced {char_id} characters")


def sync_wyrmspells(data, batch):
    """Sync wyrmspells.json -> wyrmspells table."""
    batch.add("DELETE FROM wyrmspells;")
    batch.add("ALTER TABLE wyrmspells AUTO_INCREMENT = 1;")
    w_id = 0
    for w in data:
        if not w.get("name"):
            continue
        w_id += 1
        batch.add(
            f"INSERT INTO wyrmspells (id, name, effect, type) VALUES "
            f"({w_id}, {escape_sql(w['name'])}, {escape_sql(w.get('effect'))}, {escape_sql(w.get('type'))});"
        )
    print(f"  Synced {w_id} wyrmspells")


def sync_codes(data, batch):
    """Sync codes.json -> codes table."""
    batch.add("DELETE FROM codes;")
    batch.add("ALTER TABLE codes AUTO_INCREMENT = 1;")
    c_id = 0
    for c in data:
        if not c.get("code"):
            continue
        c_id += 1
        batch.add(
            f"INSERT INTO codes (id, code, active) VALUES "
            f"({c_id}, {escape_sql(c['code'])}, {escape_sql(c.get('active', True))});"
        )
    print(f"  Synced {c_id} codes")


def sync_status_effects(data, batch):
    """Sync status-effects.json -> status_effects table."""
    batch.add("DELETE FROM status_effects;")
    batch.add("ALTER TABLE status_effects AUTO_INCREMENT = 1;")
    se_id = 0
    for se in data:
        if not se.get("name"):
            continue
        se_id += 1
        batch.add(
            f"INSERT INTO status_effects (id, name, type, effect, remark) VALUES "
            f"({se_id}, {escape_sql(se['name'])}, {escape_sql(se.get('type'))}, "
            f"{escape_sql(se.get('effect'))}, {escape_sql(se.get('remark'))});"
        )
    print(f"  Synced {se_id} status effects")


def sync_tier_lists(data, batch):
    """Sync tier-lists.json -> tier_lists + tier_list_entries tables."""
    batch.add("DELETE FROM tier_list_entries;")
    batch.add("DELETE FROM tier_lists;")
    batch.add("ALTER TABLE tier_list_entries AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE tier_lists AUTO_INCREMENT = 1;")
    tl_id = 0
    entry_id = 0
    for tl in data:
        if not tl.get("name"):
            continue
        tl_id += 1
        batch.add(
            f"INSERT INTO tier_lists (id, name, author, content_type, description) VALUES "
            f"({tl_id}, {escape_sql(tl['name'])}, {escape_sql(tl.get('author'))}, "
            f"{escape_sql(tl.get('content_type'))}, {escape_sql(tl.get('description'))});"
        )
        for entry in tl.get("entries", []):
            entry_id += 1
            batch.add(
                f"INSERT INTO tier_list_entries (id, tier_list_id, character_name, tier, note) VALUES "
                f"({entry_id}, {tl_id}, {escape_sql(entry.get('character_name'))}, {escape_sql(entry.get('tier'))}, "
                f"{escape_sql(entry.get('note', ''))});"
            )
    print(f"  Synced {tl_id} tier lists")


def sync_teams(data, batch):
    """Sync teams.json -> teams + team_members + team_member_substitutes tables."""
    batch.add("DELETE FROM team_member_substitutes;")
    batch.add("DELETE FROM team_members;")
    batch.add("DELETE FROM teams;")
    batch.add("ALTER TABLE team_member_substitutes AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE team_members AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE teams AUTO_INCREMENT = 1;")
    team_id = 0
    member_id = 0
    sub_id = 0
    for t in data:
        if not t.get("name"):
            continue
        team_id += 1
        ws = t.get("wyrmspells") or {}
        batch.add(
            f"INSERT INTO teams (id, name, author, content_type, description, faction, "
            f"breach_wyrmspell, refuge_wyrmspell, wildcry_wyrmspell, dragons_call_wyrmspell) VALUES "
            f"({team_id}, {escape_sql(t['name'])}, {escape_sql(t.get('author'))}, "
            f"{escape_sql(t.get('content_type'))}, {escape_sql(t.get('description'))}, "
            f"{escape_sql(t.get('faction'))}, {escape_sql(ws.get('breach'))}, "
            f"{escape_sql(ws.get('refuge'))}, {escape_sql(ws.get('wildcry'))}, "
            f"{escape_sql(ws.get('dragons_call'))});"
        )
        for m in t.get("members", []):
            member_id += 1
            batch.add(
                f"INSERT INTO team_members (id, team_id, character_name, overdrive_order, note) VALUES "
                f"({member_id}, {team_id}, {escape_sql(m.get('character_name'))}, "
                f"{escape_sql(m.get('overdrive_order'))}, {escape_sql(m.get('note', ''))});"
            )
            for sub in m.get("substitutes", []):
                if sub:
                    sub_id += 1
                    batch.add(
                        f"INSERT INTO team_member_substitutes (id, team_member_id, character_name) VALUES "
                        f"({sub_id}, {member_id}, {escape_sql(sub)});"
                    )
    print(f"  Synced {team_id} teams")


def sync_useful_links(data, batch):
    """Sync useful-links.json -> useful_links table."""
    batch.add("DELETE FROM useful_links;")
    batch.add("ALTER TABLE useful_links AUTO_INCREMENT = 1;")
    link_id = 0
    for link in data:
        if not link.get("name"):
            continue
        link_id += 1
        batch.add(
            f"INSERT INTO useful_links (id, icon, application, name, description, link) VALUES "
            f"({link_id}, {escape_sql(link.get('icon'))}, {escape_sql(link.get('application'))}, "
            f"{escape_sql(link['name'])}, {escape_sql(link.get('description'))}, "
            f"{escape_sql(link.get('link'))});"
        )
    print(f"  Synced {link_id} useful links")


def sync_changelog(data, batch):
    """Sync changelog.json -> changelog + changelog_changes tables."""
    batch.add("DELETE FROM changelog_changes;")
    batch.add("DELETE FROM changelog;")
    batch.add("ALTER TABLE changelog_changes AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE changelog AUTO_INCREMENT = 1;")
    cl_id = 0
    change_id = 0
    for entry in data:
        if not entry.get("version"):
            continue
        cl_id += 1
        batch.add(
            f"INSERT INTO changelog (id, date, version) VALUES "
            f"({cl_id}, {escape_sql(entry.get('date'))}, {escape_sql(entry['version'])});"
        )
        for change in entry.get("changes", []):
            change_id += 1
            batch.add(
                f"INSERT INTO changelog_changes (id, changelog_id, type, category, description) VALUES "
                f"({change_id}, {cl_id}, {escape_sql(change.get('type'))}, {escape_sql(change.get('category'))}, "
                f"{escape_sql(change.get('description'))});"
            )
    print(f"  Synced {cl_id} changelog entries")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Sync JSON data into Dolt database")
    parser.add_argument("--push", action="store_true", help="Push to DoltHub after commit")
    parser.add_argument("--dry-run", action="store_true", help="Show SQL without executing")
    parser.add_argument(
        "--target",
        choices=[
            "factions", "characters", "wyrmspells", "codes",
            "status-effects", "tier-lists", "teams",
            "useful-links", "changelog", "all",
        ],
        default="all",
        help="Which table(s) to sync (default: all)",
    )
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

    batch = SqlBatch(dry_run=args.dry_run)
    target = args.target

    syncers = {
        "factions": lambda: sync_factions(factions_data, batch),
        "characters": lambda: sync_characters(characters_data, factions_data, batch),
        "wyrmspells": lambda: sync_wyrmspells(wyrmspells_data, batch),
        "codes": lambda: sync_codes(codes_data, batch),
        "status-effects": lambda: sync_status_effects(status_effects_data, batch),
        "tier-lists": lambda: sync_tier_lists(tier_lists_data, batch),
        "teams": lambda: sync_teams(teams_data, batch),
        "useful-links": lambda: sync_useful_links(useful_links_data, batch),
        "changelog": lambda: sync_changelog(changelog_data, batch),
    }

    if target == "all":
        for syncer in syncers.values():
            syncer()
    else:
        syncers[target]()

    # Execute all SQL in a single dolt process
    batch.flush()

    if args.dry_run:
        print("\nDry run complete — no changes made.")
        return

    # Commit changes in Dolt
    print("\nCommitting to Dolt...")
    dolt_cmd("add", ".")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if target == "all":
        msg = f"Sync all data from JSON ({timestamp})"
    else:
        msg = f"Sync {target} from JSON ({timestamp})"
    result = dolt_cmd("commit", "-m", msg, "--allow-empty")
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
