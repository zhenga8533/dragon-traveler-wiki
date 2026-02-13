"""
Sync JSON data files into the Dolt database.

Usage:
    python -m backend.sync_dolt              # sync and commit
    python -m backend.sync_dolt --push       # sync, commit, and push to DoltHub
    python -m backend.sync_dolt --dry-run    # show SQL without executing
"""

import argparse
import csv
import io
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
DATA_DIR = ROOT_DIR / "data"


class SyncError(Exception):
    """Raised when a dolt SQL or CLI command fails."""


def escape_sql(value):
    """Escape a value for safe SQL insertion."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    s = (
        s.replace("\\", "\\\\")
        .replace("\0", "")
        .replace("'", "\\'")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )
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
        msg = f"SQL failed: {query[:200]}\n{result.stderr}"
        raise SyncError(msg)
    return result.stdout


def dolt_sql_csv(query):
    """Run a SQL query via dolt sql (CSV result) and return rows as dicts."""
    result = subprocess.run(
        ["dolt", "sql", "-r", "csv", "-q", query],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise SyncError(f"SQL failed: {query}\n{result.stderr}")

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


def build_resource_id_map(resources):
    """Build deterministic resource name -> id mapping matching sync_resources insert order."""
    mapping = {}
    rid = 0
    for resource in resources:
        name = resource.get("name")
        if not name or name in mapping:
            continue
        rid += 1
        mapping[name] = rid
    return mapping


def ensure_schema_extensions(existing_tables, dry_run=False):
    """Ensure optional schema pieces exist for resources + normalized code rewards."""
    if "resources" not in existing_tables:
        print("  Creating missing resources table")
        dolt_sql(
            """
            CREATE TABLE resources (
              id int NOT NULL AUTO_INCREMENT,
              name varchar(100) NOT NULL,
              description text,
              category varchar(50) NOT NULL DEFAULT '',
              PRIMARY KEY (id),
              UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("resources")

    # Ensure category column exists on resources table.
    if "resources" in existing_tables:
        resource_columns = get_table_columns("resources")
        if "category" not in resource_columns:
            print("  Adding resources.category column")
            dolt_sql(
                "ALTER TABLE resources ADD COLUMN category varchar(50) NOT NULL DEFAULT '';",
                dry_run=dry_run,
            )

    if "code_rewards" not in existing_tables:
        return

    code_reward_columns = get_table_columns("code_rewards")
    if "resource_id" not in code_reward_columns:
        print("  Adding code_rewards.resource_id column")
        dolt_sql(
            "ALTER TABLE code_rewards ADD COLUMN resource_id int NULL AFTER code_id;",
            dry_run=dry_run,
        )
        dolt_sql(
            "ALTER TABLE code_rewards ADD KEY resource_id (resource_id);",
            dry_run=dry_run,
        )

    # Backfill legacy rows that still use resource_name.
    if "resource_name" in code_reward_columns:
        print("  Backfilling code_rewards.resource_id from resource_name")
        dolt_sql(
            """
            UPDATE code_rewards cr
            JOIN resources r ON r.name = cr.resource_name
            SET cr.resource_id = r.id
            WHERE cr.resource_id IS NULL;
            """,
            dry_run=dry_run,
        )

        unresolved_rows = dolt_sql_csv(
            """
            SELECT COUNT(*) AS cnt
            FROM code_rewards
            WHERE resource_id IS NULL
              AND resource_name IS NOT NULL
              AND resource_name <> '';
            """
        )
        unresolved_count = (
            int((unresolved_rows[0] or {}).get("cnt", 0)) if unresolved_rows else 0
        )

        if unresolved_count == 0:
            print("  Dropping legacy code_rewards.resource_name column")
            dolt_sql(
                "ALTER TABLE code_rewards DROP COLUMN resource_name;",
                dry_run=dry_run,
            )
        else:
            print(
                f"  Keeping code_rewards.resource_name (could not map {unresolved_count} row(s) to resources.id)"
            )

    create_rows = dolt_sql_csv("SHOW CREATE TABLE code_rewards;")
    if create_rows:
        create_sql = create_rows[0].get("Create Table") or ""
        if "REFERENCES `resources` (`id`)" not in create_sql:
            print("  Adding code_rewards.resource_id foreign key")
            dolt_sql(
                "ALTER TABLE code_rewards ADD CONSTRAINT code_rewards_ibfk_2 "
                "FOREIGN KEY (resource_id) REFERENCES resources(id);",
                dry_run=dry_run,
            )


class SqlBatch:
    """Collects SQL statements and executes them in a single transactional dolt sql call."""

    def __init__(self, dry_run=False):
        self.statements = []
        self.dry_run = dry_run

    def add(self, sql):
        self.statements.append(sql)

    def flush(self):
        if not self.statements:
            return
        combined = "BEGIN;\n" + "\n".join(self.statements) + "\nCOMMIT;"
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
        combined = result.stderr + result.stdout
        normalized = combined.lower()
        if (
            "nothing to commit" in normalized
            or "no changes added to commit" in normalized
        ):
            return combined
        raise SyncError(f"dolt {' '.join(args)} failed:\n{result.stderr}")
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
    for table in [
        "skills",
        "talent_levels",
        "character_subclasses",
        "character_factions",
        "characters",
    ]:
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

        for order, fname in enumerate(c.get("factions", []), start=1):
            fid = faction_ids.get(fname)
            if fid:
                batch.add(
                    f"INSERT INTO character_factions (character_id, faction_id, sort_order) VALUES "
                    f"({char_id}, {fid}, {order});"
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


def sync_resources(data, batch, existing_tables):
    """Sync resources.json -> resources table."""
    if "resources" not in existing_tables:
        print("  Skipping resources (table not found in Dolt schema)")
        return

    # code_rewards.resource_id -> resources.id FK requires child rows to be removed first.
    # NOTE: sync_codes also deletes code_rewards; the duplicate DELETE is harmless.
    if "code_rewards" in existing_tables:
        code_reward_columns = get_table_columns("code_rewards")
        if "resource_id" in code_reward_columns:
            batch.add("DELETE FROM code_rewards;")
            batch.add("ALTER TABLE code_rewards AUTO_INCREMENT = 1;")

    batch.add("DELETE FROM resources;")
    batch.add("ALTER TABLE resources AUTO_INCREMENT = 1;")
    r_id = 0
    for r in data:
        if not r.get("name"):
            continue
        r_id += 1
        batch.add(
            f"INSERT INTO resources (id, name, description, category) VALUES "
            f"({r_id}, {escape_sql(r['name'])}, {escape_sql(r.get('description', ''))}, {escape_sql(r.get('category', ''))});"
        )
    print(f"  Synced {r_id} resources")


def sync_codes(data, batch, existing_tables, resource_ids):
    """Sync codes.json -> codes (+ code_rewards when table exists)."""
    if "codes" not in existing_tables:
        print("  Skipping codes (table not found in Dolt schema)")
        return

    has_code_rewards = "code_rewards" in existing_tables
    code_reward_columns = (
        get_table_columns("code_rewards") if has_code_rewards else set()
    )
    has_resource_id = "resource_id" in code_reward_columns

    if has_code_rewards:
        batch.add("DELETE FROM code_rewards;")
        batch.add("ALTER TABLE code_rewards AUTO_INCREMENT = 1;")

    batch.add("DELETE FROM codes;")
    batch.add("ALTER TABLE codes AUTO_INCREMENT = 1;")

    c_id = 0
    reward_id = 0
    for c in data:
        if not c.get("code"):
            continue
        c_id += 1

        rewards = c.get("rewards")
        if rewards is None:
            rewards = c.get("reward", [])
        if not isinstance(rewards, list):
            rewards = []

        batch.add(
            f"INSERT INTO codes (id, code, active) VALUES "
            f"({c_id}, {escape_sql(c['code'])}, {escape_sql(c.get('active', True))});"
        )

        for reward in rewards:
            if not has_code_rewards:
                break
            if not reward.get("name"):
                continue
            reward_id += 1

            resource_name = reward["name"]
            resource_id = resource_ids.get(resource_name)
            if resource_id is None:
                raise SyncError(
                    f"code '{c['code']}' reward resource '{resource_name}' not found in resources.json"
                )
            quantity = escape_sql(reward.get("quantity", 0))

            if has_resource_id:
                batch.add(
                    f"INSERT INTO code_rewards (id, code_id, resource_id, quantity) VALUES "
                    f"({reward_id}, {c_id}, {escape_sql(resource_id)}, {quantity});"
                )
            else:
                raise SyncError("code_rewards table must include resource_id column")
    if has_code_rewards:
        print(f"  Synced {c_id} codes ({reward_id} rewards)")
    else:
        print(f"  Synced {c_id} codes (no code_rewards table; rewards ignored)")


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
    parser.add_argument(
        "--push", action="store_true", help="Push to DoltHub after commit"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show SQL without executing"
    )
    parser.add_argument(
        "--target",
        choices=[
            "factions",
            "characters",
            "wyrmspells",
            "resources",
            "codes",
            "status-effects",
            "tier-lists",
            "teams",
            "useful-links",
            "changelog",
            "all",
        ],
        default="all",
        help="Which table(s) to sync (default: all)",
    )
    args = parser.parse_args()

    if not DOLT_DIR.exists():
        print(f"Error: Dolt database not found at {DOLT_DIR}", file=sys.stderr)
        sys.exit(1)

    target = args.target

    # Only load JSON files needed for the target.
    json_deps = {
        "factions": ["factions.json"],
        "characters": ["characters.json", "factions.json"],
        "wyrmspells": ["wyrmspells.json"],
        "resources": ["resources.json"],
        "codes": ["codes.json", "resources.json"],
        "status-effects": ["status-effects.json"],
        "tier-lists": ["tier-lists.json"],
        "teams": ["teams.json"],
        "useful-links": ["useful-links.json"],
        "changelog": ["changelog.json"],
    }

    needed_files = set()
    if target == "all":
        for deps in json_deps.values():
            needed_files.update(deps)
    else:
        needed_files.update(json_deps[target])

    print("Loading JSON data...")
    json_cache = {f: load_json(f) for f in needed_files}

    print("Syncing to Dolt..." + (" (dry run)" if args.dry_run else ""))

    try:
        existing_tables = get_existing_tables()
        ensure_schema_extensions(existing_tables, dry_run=args.dry_run)
        existing_tables = get_existing_tables()
        resource_ids = build_resource_id_map(json_cache.get("resources.json", []))

        batch = SqlBatch(dry_run=args.dry_run)

        syncers = {
            "factions": lambda: sync_factions(json_cache["factions.json"], batch),
            "characters": lambda: sync_characters(
                json_cache["characters.json"], json_cache["factions.json"], batch
            ),
            "wyrmspells": lambda: sync_wyrmspells(json_cache["wyrmspells.json"], batch),
            "resources": lambda: sync_resources(
                json_cache["resources.json"], batch, existing_tables
            ),
            "codes": lambda: sync_codes(
                json_cache["codes.json"], batch, existing_tables, resource_ids
            ),
            "status-effects": lambda: sync_status_effects(
                json_cache["status-effects.json"], batch
            ),
            "tier-lists": lambda: sync_tier_lists(json_cache["tier-lists.json"], batch),
            "teams": lambda: sync_teams(json_cache["teams.json"], batch),
            "useful-links": lambda: sync_useful_links(
                json_cache["useful-links.json"], batch
            ),
            "changelog": lambda: sync_changelog(json_cache["changelog.json"], batch),
        }

        if target == "all":
            for syncer in syncers.values():
                syncer()
        else:
            syncers[target]()

        # Execute all SQL in a single transactional dolt process.
        batch.flush()
    except SyncError as exc:
        print(f"\nSync failed, no commit created:\n{exc}", file=sys.stderr)
        sys.exit(1)

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
    result = dolt_cmd("commit", "-m", msg)
    if "nothing to commit" in result.lower():
        print("No changes to commit.")
    else:
        print("Committed successfully.")

    if args.push:
        print("Pushing to DoltHub...")
        try:
            dolt_cmd("push")
        except SyncError as exc:
            err = str(exc).lower()
            if "non-fast-forward" in err or "failed to push some refs" in err:
                print("  Remote is ahead; pulling latest changes and retrying push...")
                dolt_cmd("pull")
                dolt_cmd("push")
            else:
                raise
        print("Pushed successfully.")

    print("Done!")


if __name__ == "__main__":
    main()
