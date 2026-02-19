"""
Sync JSON data files into the Dolt database.

Usage:
    python -m backend.sync_dolt              # sync and commit
    python -m backend.sync_dolt --push       # sync, commit, and push to DoltHub
    python -m backend.sync_dolt --dry-run    # show SQL without executing
"""

import argparse
import csv
import hashlib
import io
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from .sort_keys import (
    QUALITY_RANK,
    artifact_sort_key,
    character_sort_key,
    faction_sort_key,
    golden_alliance_sort_key,
    howlkin_sort_key,
    noble_phantasm_sort_key,
    resource_sort_key,
    status_effect_sort_key,
    useful_link_sort_key,
    wyrmspell_sort_key,
)

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DOLT_DIR = ROOT_DIR / "dolt-db"
DATA_DIR = ROOT_DIR / "data"
HASHES_FILE = DATA_DIR / "hashes.json"


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


def get_column_type(table_name, column_name):
    """Return the type string for a column, or None if it doesn't exist."""
    rows = dolt_sql_csv(f"DESCRIBE `{table_name}`;")
    for row in rows:
        if row.get("Field") == column_name:
            return row.get("Type", "")
    return None


def build_resource_id_map(resources):
    """Build deterministic resource name -> id mapping matching sync_resources insert order."""
    mapping = {}
    rid = 0
    for resource in sorted(resources, key=resource_sort_key):
        name = resource.get("name")
        if not name or name in mapping:
            continue
        rid += 1
        mapping[name] = rid
    return mapping


def compute_hash(entity):
    """Compute SHA-256 hash of a JSON entity for change detection.

    Strips last_updated and data_hash before hashing so that metadata
    fields don't cause spurious change detection on every sync.
    """
    clean = {k: v for k, v in entity.items() if k not in ("last_updated", "data_hash")}
    serialized = json.dumps(clean, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def get_old_timestamps(table, key_column):
    """Query existing last_updated and data_hash from a table, keyed by natural key."""
    try:
        rows = dolt_sql_csv(
            f"SELECT `{key_column}`, last_updated, data_hash FROM `{table}`;"
        )
    except SyncError:
        return {}
    result = {}
    for row in rows:
        key = row.get(key_column)
        if key:
            result[key] = (row.get("last_updated", ""), row.get("data_hash", ""))
    return result


# Tables that need last_updated and data_hash columns.
TIMESTAMP_TABLES = [
    "factions",
    "characters",
    "wyrmspells",
    "noble_phantasms",
    "resources",
    "codes",
    "status_effects",
    "tier_lists",
    "teams",
    "useful_links",
    "changelog",
    "artifacts",
    "howlkins",
]


def ensure_schema_extensions(existing_tables, dry_run=False):
    """Ensure optional schema pieces exist for resources + normalized code rewards."""
    # Add last_updated and data_hash columns to main entity tables.
    for table in TIMESTAMP_TABLES:
        if table not in existing_tables:
            continue
        columns = get_table_columns(table)
        if "last_updated" not in columns:
            print(f"  Adding {table}.last_updated column")
            dolt_sql(
                f"ALTER TABLE `{table}` ADD COLUMN last_updated BIGINT NULL;",
                dry_run=dry_run,
            )
        else:
            col_type = get_column_type(table, "last_updated")
            if col_type and "bigint" not in col_type.lower():
                print(f"  Migrating {table}.last_updated from {col_type} to BIGINT")
                dolt_sql(
                    f"ALTER TABLE `{table}` MODIFY COLUMN last_updated BIGINT NULL;",
                    dry_run=dry_run,
                )
        if "data_hash" not in columns:
            print(f"  Adding {table}.data_hash column")
            dolt_sql(
                f"ALTER TABLE `{table}` ADD COLUMN data_hash VARCHAR(64) NULL;",
                dry_run=dry_run,
            )

    if "resources" not in existing_tables:
        print("  Creating missing resources table")
        dolt_sql(
            """
            CREATE TABLE resources (
              id int NOT NULL AUTO_INCREMENT,
              name varchar(100) NOT NULL,
              quality varchar(20) NOT NULL DEFAULT '',
              description text,
              category varchar(50) NOT NULL DEFAULT '',
              last_updated BIGINT NULL,
              data_hash VARCHAR(64) NULL,
              PRIMARY KEY (id),
              UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("resources")

    # Ensure category and quality columns exist on resources table.
    if "resources" in existing_tables:
        resource_columns = get_table_columns("resources")
        if "category" not in resource_columns:
            print("  Adding resources.category column")
            dolt_sql(
                "ALTER TABLE resources ADD COLUMN category varchar(50) NOT NULL DEFAULT '';",
                dry_run=dry_run,
            )
        if "quality" not in resource_columns:
            print("  Adding resources.quality column")
            dolt_sql(
                "ALTER TABLE resources ADD COLUMN quality varchar(20) NOT NULL DEFAULT '' AFTER `name`;",
                dry_run=dry_run,
            )
        else:
            # Migrate quality column to NOT NULL if it is currently nullable.
            col_type_info = dolt_sql_csv("SHOW COLUMNS FROM resources LIKE 'quality';")
            if col_type_info and col_type_info[0].get("Null", "").upper() == "YES":
                print("  Migrating resources.quality to NOT NULL")
                dolt_sql(
                    "UPDATE resources SET quality = '' WHERE quality IS NULL;",
                    dry_run=dry_run,
                )
                dolt_sql(
                    "ALTER TABLE resources MODIFY COLUMN quality varchar(20) NOT NULL DEFAULT '';",
                    dry_run=dry_run,
                )

    # Ensure quality and exclusive_faction columns exist on wyrmspells table.
    if "wyrmspells" in existing_tables:
        wyrmspell_columns = get_table_columns("wyrmspells")
        if "quality" not in wyrmspell_columns:
            print("  Adding wyrmspells.quality column")
            dolt_sql(
                "ALTER TABLE wyrmspells ADD COLUMN quality varchar(20) NULL AFTER type;",
                dry_run=dry_run,
            )
        if "exclusive_faction" not in wyrmspell_columns:
            print("  Adding wyrmspells.exclusive_faction column")
            dolt_sql(
                "ALTER TABLE wyrmspells ADD COLUMN exclusive_faction varchar(100) NULL AFTER quality;",
                dry_run=dry_run,
            )
        if "is_global" not in wyrmspell_columns:
            print("  Adding wyrmspells.is_global column")
            dolt_sql(
                "ALTER TABLE wyrmspells ADD COLUMN is_global tinyint(1) NOT NULL DEFAULT 0 AFTER exclusive_faction;",
                dry_run=dry_run,
            )

    # Ensure artifacts and related tables exist.
    if "artifacts" not in existing_tables:
        print("  Creating missing artifacts table")
        dolt_sql(
            """
            CREATE TABLE artifacts (
              id int NOT NULL AUTO_INCREMENT,
              name varchar(200) NOT NULL,
              is_global tinyint(1) NOT NULL DEFAULT 0,
              lore text,
              quality varchar(20) NOT NULL DEFAULT '',
              columns int NOT NULL DEFAULT 0,
              rows int NOT NULL DEFAULT 0,
              last_updated BIGINT NULL,
              data_hash VARCHAR(64) NULL,
              PRIMARY KEY (id),
              UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("artifacts")

    if "artifact_effects" not in existing_tables:
        print("  Creating missing artifact_effects table")
        dolt_sql(
            """
            CREATE TABLE artifact_effects (
              id int NOT NULL AUTO_INCREMENT,
              artifact_id int NOT NULL,
              level int NOT NULL,
              description text,
              PRIMARY KEY (id),
              KEY artifact_id (artifact_id),
              CONSTRAINT artifact_effects_ibfk_1 FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("artifact_effects")

    if "artifact_treasures" not in existing_tables:
        print("  Creating missing artifact_treasures table")
        dolt_sql(
            """
            CREATE TABLE artifact_treasures (
              id int NOT NULL AUTO_INCREMENT,
              artifact_id int NOT NULL,
              name varchar(200) NOT NULL,
              lore text,
              character_class varchar(50),
              PRIMARY KEY (id),
              KEY artifact_id (artifact_id),
              CONSTRAINT artifact_treasures_ibfk_1 FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("artifact_treasures")

    if "artifact_treasure_effects" not in existing_tables:
        print("  Creating missing artifact_treasure_effects table")
        dolt_sql(
            """
            CREATE TABLE artifact_treasure_effects (
              id int NOT NULL AUTO_INCREMENT,
              treasure_id int NOT NULL,
              level int NOT NULL,
              description text,
              PRIMARY KEY (id),
              KEY treasure_id (treasure_id),
              CONSTRAINT artifact_treasure_effects_ibfk_1 FOREIGN KEY (treasure_id) REFERENCES artifact_treasures(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("artifact_treasure_effects")

    # Ensure howlkins and related tables exist.
    if "howlkins" not in existing_tables:
        print("  Creating missing howlkins table")
        dolt_sql(
            """
            CREATE TABLE howlkins (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(200) NOT NULL,
                quality varchar(20) NOT NULL DEFAULT '',
                last_updated BIGINT NULL,
                data_hash VARCHAR(64) NULL,
                PRIMARY KEY (id),
                UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("howlkins")
    else:
        howlkin_columns = get_table_columns("howlkins")
        for legacy_col in ("passive_effect", "passive_effects"):
            if legacy_col in howlkin_columns:
                print(f"  Dropping legacy howlkins.{legacy_col} column")
                dolt_sql(
                    f"ALTER TABLE howlkins DROP COLUMN {legacy_col};",
                    dry_run=dry_run,
                )

    if "howlkin_passive_effects" not in existing_tables:
        print("  Creating missing howlkin_passive_effects table")
        dolt_sql(
            """
            CREATE TABLE howlkin_passive_effects (
                id int NOT NULL AUTO_INCREMENT,
                howlkin_id int NOT NULL,
                sort_order int NOT NULL DEFAULT 0,
                effect text NOT NULL,
                PRIMARY KEY (id),
                KEY howlkin_id (howlkin_id),
                CONSTRAINT howlkin_passive_effects_ibfk_1 FOREIGN KEY (howlkin_id) REFERENCES howlkins(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("howlkin_passive_effects")

    if "howlkin_stats" not in existing_tables:
        print("  Creating missing howlkin_stats table")
        dolt_sql(
            """
            CREATE TABLE howlkin_stats (
                id int NOT NULL AUTO_INCREMENT,
                howlkin_id int NOT NULL,
                stat_name varchar(100) NOT NULL,
                stat_value double NOT NULL,
                PRIMARY KEY (id),
                KEY howlkin_id (howlkin_id),
                CONSTRAINT howlkin_stats_ibfk_1 FOREIGN KEY (howlkin_id) REFERENCES howlkins(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("howlkin_stats")

    # Ensure golden alliances and related tables exist.
    if "golden_alliances" not in existing_tables:
        print("  Creating missing golden_alliances table")
        dolt_sql(
            """
            CREATE TABLE golden_alliances (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(200) NOT NULL,
                last_updated BIGINT NULL,
                data_hash VARCHAR(64) NULL,
                PRIMARY KEY (id),
                UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("golden_alliances")

    if "golden_alliance_howlkins" not in existing_tables:
        print("  Creating missing golden_alliance_howlkins table")
        dolt_sql(
            """
            CREATE TABLE golden_alliance_howlkins (
                id int NOT NULL AUTO_INCREMENT,
                alliance_id int NOT NULL,
                sort_order int NOT NULL DEFAULT 0,
                howlkin_name varchar(200) NOT NULL,
                PRIMARY KEY (id),
                KEY alliance_id (alliance_id),
                CONSTRAINT golden_alliance_howlkins_ibfk_1 FOREIGN KEY (alliance_id) REFERENCES golden_alliances(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("golden_alliance_howlkins")

    if "golden_alliance_effects" not in existing_tables:
        print("  Creating missing golden_alliance_effects table")
        dolt_sql(
            """
            CREATE TABLE golden_alliance_effects (
                id int NOT NULL AUTO_INCREMENT,
                alliance_id int NOT NULL,
                level int NOT NULL DEFAULT 0,
                sort_order int NOT NULL DEFAULT 0,
                stat text NOT NULL,
                PRIMARY KEY (id),
                KEY alliance_id (alliance_id),
                CONSTRAINT golden_alliance_effects_ibfk_1 FOREIGN KEY (alliance_id) REFERENCES golden_alliances(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("golden_alliance_effects")

    # Ensure noble phantasms and related tables exist.
    if "noble_phantasms" not in existing_tables:
        print("  Creating missing noble_phantasms table")
        dolt_sql(
            """
            CREATE TABLE noble_phantasms (
              id int NOT NULL AUTO_INCREMENT,
              name varchar(200) NOT NULL,
              character_name varchar(200) DEFAULT NULL,
              is_global tinyint(1) NOT NULL DEFAULT 0,
              lore text,
              last_updated BIGINT NULL,
              data_hash VARCHAR(64) NULL,
              PRIMARY KEY (id),
              UNIQUE KEY name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("noble_phantasms")

    if "noble_phantasm_effects" not in existing_tables:
        print("  Creating missing noble_phantasm_effects table")
        dolt_sql(
            """
            CREATE TABLE noble_phantasm_effects (
              id int NOT NULL AUTO_INCREMENT,
              noble_phantasm_id int NOT NULL,
              sort_order int NOT NULL DEFAULT 0,
              tier varchar(20) DEFAULT NULL,
              tier_level int DEFAULT NULL,
              description text,
              PRIMARY KEY (id),
              KEY noble_phantasm_id (noble_phantasm_id),
              CONSTRAINT noble_phantasm_effects_ibfk_1 FOREIGN KEY (noble_phantasm_id) REFERENCES noble_phantasms(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("noble_phantasm_effects")

    if "noble_phantasm_skills" not in existing_tables:
        print("  Creating missing noble_phantasm_skills table")
        dolt_sql(
            """
            CREATE TABLE noble_phantasm_skills (
              id int NOT NULL AUTO_INCREMENT,
              noble_phantasm_id int NOT NULL,
              level int NOT NULL,
              tier varchar(20) DEFAULT NULL,
              tier_level int DEFAULT NULL,
              description text,
              PRIMARY KEY (id),
              KEY noble_phantasm_id (noble_phantasm_id),
              CONSTRAINT noble_phantasm_skills_ibfk_1 FOREIGN KEY (noble_phantasm_id) REFERENCES noble_phantasms(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin;
            """,
            dry_run=dry_run,
        )
        existing_tables.add("noble_phantasm_skills")

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


def load_hashes():
    """Load entity hashes from hashes.json (device-independent change detection)."""
    if HASHES_FILE.exists():
        with open(HASHES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_hashes(hashes):
    """Write entity hashes to hashes.json."""
    with open(HASHES_FILE, "w", encoding="utf-8") as f:
        json.dump(hashes, f, indent=2, ensure_ascii=False)
        f.write("\n")


def resolve_timestamp(key, new_hash, old_timestamps, now, table_hashes=None):
    """Return the appropriate last_updated value for a row based on hash comparison.

    Checks hashes.json first (device-independent — committed to git alongside data),
    then falls back to the local Dolt DB. This prevents spurious timestamp updates
    when syncing on a machine whose local Dolt DB doesn't have the latest hashes yet.
    """
    # Primary: hashes.json entry for this table (device-independent)
    if table_hashes is not None:
        entry = table_hashes.get(key, {})
        if isinstance(entry, dict) and entry.get("hash") == new_hash and entry.get("ts"):
            return entry["ts"]
    # Fallback: local Dolt DB
    old = old_timestamps.get(key)
    if old and old[1] == new_hash and old[0]:
        return old[0]
    return now


# ---------------------------------------------------------------------------
# Sync functions
# ---------------------------------------------------------------------------


def sync_factions(data, batch, now, stored_hashes, new_hashes):
    """Sync factions.json -> factions table."""
    old_ts = get_old_timestamps("factions", "name")
    table_hashes = stored_hashes.get("factions", {})
    batch.add("DELETE FROM character_factions;")
    batch.add("DELETE FROM factions;")
    data = sorted(data, key=faction_sort_key)
    for i, f in enumerate(data, 1):
        if not f.get("name"):
            continue
        h = compute_hash(f)
        ts = resolve_timestamp(f["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("factions", {})[f["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO factions (id, name, wyrm, description, last_updated, data_hash) VALUES "
            f"({i}, {escape_sql(f['name'])}, {escape_sql(f.get('wyrm'))}, {escape_sql(f.get('description'))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )
    count = len([f for f in data if f.get("name")])
    print(f"  Synced {count} factions")


def sync_characters(data, factions, batch, now, stored_hashes, new_hashes):
    """Sync characters.json -> characters + related tables."""
    old_ts = get_old_timestamps("characters", "name")
    table_hashes = stored_hashes.get("characters", {})
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

    data = sorted(data, key=character_sort_key)
    char_id = 0
    subclass_id = 0
    talent_id = 0
    skill_id = 0
    for c in data:
        if not c.get("name"):
            continue
        char_id += 1

        h = compute_hash(c)
        ts = resolve_timestamp(c["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("characters", {})[c["name"]] = {"hash": h, "ts": int(ts)}

        talent_name = c.get("talent", {}).get("name", "") if c.get("talent") else ""
        batch.add(
            f"INSERT INTO characters (id, name, title, quality, character_class, is_global, "
            f"height, weight, origin, lore, quote, talent_name, noble_phantasm, last_updated, data_hash) VALUES "
            f"({char_id}, {escape_sql(c['name'])}, {escape_sql(c.get('title'))}, "
            f"{escape_sql(c.get('quality'))}, {escape_sql(c.get('character_class'))}, "
            f"{escape_sql(c.get('is_global', True))}, {escape_sql(c.get('height'))}, "
            f"{escape_sql(c.get('weight'))}, {escape_sql(c.get('origin'))}, "
            f"{escape_sql(c.get('lore'))}, {escape_sql(c.get('quote'))}, "
            f"{escape_sql(talent_name)}, {escape_sql(c.get('noble_phantasm'))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
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


def sync_wyrmspells(data, batch, now, stored_hashes, new_hashes):
    """Sync wyrmspells.json -> wyrmspells table."""
    old_ts = get_old_timestamps("wyrmspells", "name")
    table_hashes = stored_hashes.get("wyrmspells", {})
    batch.add("DELETE FROM wyrmspells;")
    batch.add("ALTER TABLE wyrmspells AUTO_INCREMENT = 1;")
    data = sorted(data, key=wyrmspell_sort_key)
    w_id = 0
    for w in data:
        if not w.get("name"):
            continue
        w_id += 1
        h = compute_hash(w)
        ts = resolve_timestamp(w["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("wyrmspells", {})[w["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO wyrmspells (id, name, effect, type, quality, exclusive_faction, is_global, last_updated, data_hash) VALUES "
            f"({w_id}, {escape_sql(w['name'])}, {escape_sql(w.get('effect'))}, {escape_sql(w.get('type'))}, "
            f"{escape_sql(w.get('quality'))}, {escape_sql(w.get('exclusive_faction'))}, "
            f"{'TRUE' if w.get('is_global') else 'FALSE'}, {escape_sql(ts)}, {escape_sql(h)});"
        )
    print(f"  Synced {w_id} wyrmspells")


def sync_resources(data, batch, existing_tables, now, stored_hashes, new_hashes):
    """Sync resources.json -> resources table."""
    if "resources" not in existing_tables:
        print("  Skipping resources (table not found in Dolt schema)")
        return

    old_ts = get_old_timestamps("resources", "name")
    table_hashes = stored_hashes.get("resources", {})

    # code_rewards.resource_id -> resources.id FK requires child rows to be removed first.
    # NOTE: sync_codes also deletes code_rewards; the duplicate DELETE is harmless.
    if "code_rewards" in existing_tables:
        code_reward_columns = get_table_columns("code_rewards")
        if "resource_id" in code_reward_columns:
            batch.add("DELETE FROM code_rewards;")
            batch.add("ALTER TABLE code_rewards AUTO_INCREMENT = 1;")

    batch.add("DELETE FROM resources;")
    batch.add("ALTER TABLE resources AUTO_INCREMENT = 1;")
    data = sorted(data, key=resource_sort_key)
    r_id = 0
    for r in data:
        if not r.get("name"):
            continue
        r_id += 1
        h = compute_hash(r)
        ts = resolve_timestamp(r["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("resources", {})[r["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO resources (id, name, quality, description, category, last_updated, data_hash) VALUES "
            f"({r_id}, {escape_sql(r['name'])}, {escape_sql(r.get('quality'))}, {escape_sql(r.get('description', ''))}, "
            f"{escape_sql(r.get('category', ''))}, {escape_sql(ts)}, {escape_sql(h)});"
        )
    print(f"  Synced {r_id} resources")


def sync_codes(data, batch, existing_tables, resource_ids, now, stored_hashes, new_hashes):
    """Sync codes.json -> codes (+ code_rewards when table exists)."""
    if "codes" not in existing_tables:
        print("  Skipping codes (table not found in Dolt schema)")
        return

    old_ts = get_old_timestamps("codes", "code")
    table_hashes = stored_hashes.get("codes", {})

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

        rewards_raw = c.get("rewards") or c.get("reward")
        if isinstance(rewards_raw, list):
            rewards = {r["name"]: r.get("quantity", 0) for r in rewards_raw if r.get("name")}
        elif isinstance(rewards_raw, dict):
            rewards = rewards_raw
        else:
            rewards = {}

        h = compute_hash(c)
        ts = resolve_timestamp(c["code"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("codes", {})[c["code"]] = {"hash": h, "ts": int(ts)}

        batch.add(
            f"INSERT INTO codes (id, code, active, last_updated, data_hash) VALUES "
            f"({c_id}, {escape_sql(c['code'])}, {escape_sql(c.get('active', True))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )

        for resource_name, quantity_val in rewards.items():
            if not has_code_rewards:
                break
            if not resource_name:
                continue
            reward_id += 1

            resource_id = resource_ids.get(resource_name)
            if resource_id is None:
                raise SyncError(
                    f"code '{c['code']}' reward resource '{resource_name}' not found in resources.json"
                )
            quantity = escape_sql(quantity_val)

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


def sync_status_effects(data, batch, now, stored_hashes, new_hashes):
    """Sync status-effects.json -> status_effects table."""
    old_ts = get_old_timestamps("status_effects", "name")
    table_hashes = stored_hashes.get("status_effects", {})
    batch.add("DELETE FROM status_effects;")
    batch.add("ALTER TABLE status_effects AUTO_INCREMENT = 1;")
    data = sorted(data, key=status_effect_sort_key)
    se_id = 0
    for se in data:
        if not se.get("name"):
            continue
        se_id += 1
        h = compute_hash(se)
        ts = resolve_timestamp(se["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("status_effects", {})[se["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO status_effects (id, name, type, effect, remark, last_updated, data_hash) VALUES "
            f"({se_id}, {escape_sql(se['name'])}, {escape_sql(se.get('type'))}, "
            f"{escape_sql(se.get('effect'))}, {escape_sql(se.get('remark'))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )
    print(f"  Synced {se_id} status effects")


def sync_tier_lists(data, batch, now, stored_hashes, new_hashes):
    """Sync tier-lists.json -> tier_lists + tier_list_entries tables."""
    old_ts = get_old_timestamps("tier_lists", "name")
    table_hashes = stored_hashes.get("tier_lists", {})
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
        h = compute_hash(tl)
        ts = resolve_timestamp(tl["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("tier_lists", {})[tl["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO tier_lists (id, name, author, content_type, description, last_updated, data_hash) VALUES "
            f"({tl_id}, {escape_sql(tl['name'])}, {escape_sql(tl.get('author'))}, "
            f"{escape_sql(tl.get('content_type'))}, {escape_sql(tl.get('description'))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )
        for entry in tl.get("entries", []):
            entry_id += 1
            batch.add(
                f"INSERT INTO tier_list_entries (id, tier_list_id, character_name, tier, note) VALUES "
                f"({entry_id}, {tl_id}, {escape_sql(entry.get('character_name'))}, {escape_sql(entry.get('tier'))}, "
                f"{escape_sql(entry.get('note', ''))});"
            )
    print(f"  Synced {tl_id} tier lists")


def sync_teams(data, batch, now, stored_hashes, new_hashes):
    """Sync teams.json -> teams + team_members + team_member_substitutes tables."""
    old_ts = get_old_timestamps("teams", "name")
    table_hashes = stored_hashes.get("teams", {})
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
        h = compute_hash(t)
        ts = resolve_timestamp(t["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("teams", {})[t["name"]] = {"hash": h, "ts": int(ts)}
        ws = t.get("wyrmspells") or {}
        batch.add(
            f"INSERT INTO teams (id, name, author, content_type, description, faction, "
            f"breach_wyrmspell, refuge_wyrmspell, wildcry_wyrmspell, dragons_call_wyrmspell, "
            f"last_updated, data_hash) VALUES "
            f"({team_id}, {escape_sql(t['name'])}, {escape_sql(t.get('author'))}, "
            f"{escape_sql(t.get('content_type'))}, {escape_sql(t.get('description'))}, "
            f"{escape_sql(t.get('faction'))}, {escape_sql(ws.get('breach'))}, "
            f"{escape_sql(ws.get('refuge'))}, {escape_sql(ws.get('wildcry'))}, "
            f"{escape_sql(ws.get('dragons_call'))}, {escape_sql(ts)}, {escape_sql(h)});"
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


def sync_useful_links(data, batch, now, stored_hashes, new_hashes):
    """Sync useful-links.json -> useful_links table."""
    old_ts = get_old_timestamps("useful_links", "name")
    table_hashes = stored_hashes.get("useful_links", {})
    batch.add("DELETE FROM useful_links;")
    batch.add("ALTER TABLE useful_links AUTO_INCREMENT = 1;")
    data = sorted(data, key=useful_link_sort_key)
    link_id = 0
    for link in data:
        if not link.get("name"):
            continue
        link_id += 1
        h = compute_hash(link)
        ts = resolve_timestamp(link["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("useful_links", {})[link["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO useful_links (id, icon, application, name, description, link, last_updated, data_hash) VALUES "
            f"({link_id}, {escape_sql(link.get('icon'))}, {escape_sql(link.get('application'))}, "
            f"{escape_sql(link['name'])}, {escape_sql(link.get('description'))}, "
            f"{escape_sql(link.get('link'))}, {escape_sql(ts)}, {escape_sql(h)});"
        )
    print(f"  Synced {link_id} useful links")


def sync_artifacts(data, batch, now, stored_hashes, new_hashes):
    """Sync artifacts.json -> artifacts + artifact_effects + artifact_treasures + artifact_treasure_effects tables."""
    old_ts = get_old_timestamps("artifacts", "name")
    table_hashes = stored_hashes.get("artifacts", {})
    batch.add("DELETE FROM artifact_treasure_effects;")
    batch.add("DELETE FROM artifact_effects;")
    batch.add("DELETE FROM artifact_treasures;")
    batch.add("DELETE FROM artifacts;")
    batch.add("ALTER TABLE artifact_treasure_effects AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE artifact_effects AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE artifact_treasures AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE artifacts AUTO_INCREMENT = 1;")
    data = sorted(data, key=artifact_sort_key)
    a_id = 0
    effect_id = 0
    treasure_id = 0
    treasure_effect_id = 0
    for a in data:
        if not a.get("name"):
            continue
        a_id += 1
        h = compute_hash(a)
        ts = resolve_timestamp(a["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("artifacts", {})[a["name"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO artifacts (id, name, is_global, lore, quality, columns, rows, last_updated, data_hash) VALUES "
            f"({a_id}, {escape_sql(a['name'])}, {'TRUE' if a.get('is_global') else 'FALSE'}, "
            f"{escape_sql(a.get('lore'))}, {escape_sql(a.get('quality', ''))}, "
            f"{escape_sql(a.get('columns', 0))}, {escape_sql(a.get('rows', 0))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )
        for eff in a.get("effect", []):
            effect_id += 1
            batch.add(
                f"INSERT INTO artifact_effects (id, artifact_id, level, description) VALUES "
                f"({effect_id}, {a_id}, {escape_sql(eff['level'])}, {escape_sql(eff.get('description'))});"
            )
        for t in a.get("treasures", []):
            if not t.get("name"):
                continue
            treasure_id += 1
            batch.add(
                f"INSERT INTO artifact_treasures (id, artifact_id, name, lore, character_class) VALUES "
                f"({treasure_id}, {a_id}, {escape_sql(t['name'])}, {escape_sql(t.get('lore'))}, "
                f"{escape_sql(t.get('character_class'))});"
            )
            for teff in t.get("effect", []):
                treasure_effect_id += 1
                batch.add(
                    f"INSERT INTO artifact_treasure_effects (id, treasure_id, level, description) VALUES "
                    f"({treasure_effect_id}, {treasure_id}, {escape_sql(teff['level'])}, {escape_sql(teff.get('description'))});"
                )
    print(f"  Synced {a_id} artifacts ({treasure_id} treasures)")


def sync_howlkins(data, batch, now, stored_hashes, new_hashes):
    """Sync howlkins.json -> howlkins + howlkin_stats + howlkin_passive_effects tables."""
    old_ts = get_old_timestamps("howlkins", "name")
    table_hashes = stored_hashes.get("howlkins", {})
    batch.add("DELETE FROM howlkin_passive_effects;")
    batch.add("DELETE FROM howlkin_stats;")
    batch.add("DELETE FROM howlkins;")
    batch.add("ALTER TABLE howlkin_passive_effects AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE howlkin_stats AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE howlkins AUTO_INCREMENT = 1;")
    data = sorted(data, key=howlkin_sort_key)
    h_id = 0
    stat_id = 0
    effect_id = 0
    for h in data:
        if not h.get("name"):
            continue
        h_id += 1
        h_hash = compute_hash(h)
        ts = resolve_timestamp(h["name"], h_hash, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("howlkins", {})[h["name"]] = {"hash": h_hash, "ts": int(ts)}
        batch.add(
            f"INSERT INTO howlkins (id, name, quality, last_updated, data_hash) VALUES "
            f"({h_id}, {escape_sql(h['name'])}, {escape_sql(h.get('quality'))}, "
            f"{escape_sql(ts)}, {escape_sql(h_hash)});"
        )

        raw_effects = h.get("passive_effects") or h.get("passive_effect")
        if isinstance(raw_effects, str):
            passive_effects = [raw_effects] if raw_effects else []
        elif isinstance(raw_effects, list):
            passive_effects = raw_effects
        else:
            passive_effects = []
        for sort_order, effect in enumerate(passive_effects):
            if not effect:
                continue
            effect_id += 1
            batch.add(
                f"INSERT INTO howlkin_passive_effects (id, howlkin_id, sort_order, effect) VALUES "
                f"({effect_id}, {h_id}, {sort_order}, {escape_sql(effect)});"
            )

        basic_stats = h.get("basic_stats") or {}
        if isinstance(basic_stats, dict):
            for stat_name, stat_value in sorted(
                basic_stats.items(), key=lambda item: str(item[0]).lower()
            ):
                if not stat_name:
                    continue
                stat_id += 1
                batch.add(
                    f"INSERT INTO howlkin_stats (id, howlkin_id, stat_name, stat_value) VALUES "
                    f"({stat_id}, {h_id}, {escape_sql(stat_name)}, {escape_sql(stat_value)});"
                )

    print(f"  Synced {h_id} howlkins")


def sync_golden_alliances(data, howlkins_data, batch, now, stored_hashes, new_hashes):
    """Sync golden_alliances.json -> golden_alliances + golden_alliance_howlkins + golden_alliance_effects tables."""
    quality_map = {h["name"]: h.get("quality", "") for h in howlkins_data if h.get("name")}
    old_ts = get_old_timestamps("golden_alliances", "name")
    table_hashes = stored_hashes.get("golden_alliances", {})
    batch.add("DELETE FROM golden_alliance_effects;")
    batch.add("DELETE FROM golden_alliance_howlkins;")
    batch.add("DELETE FROM golden_alliances;")
    batch.add("ALTER TABLE golden_alliance_effects AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE golden_alliance_howlkins AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE golden_alliances AUTO_INCREMENT = 1;")
    data = sorted(data, key=golden_alliance_sort_key)
    ga_id = 0
    howlkin_row_id = 0
    effect_id = 0
    for ga in data:
        if not ga.get("name"):
            continue
        ga_id += 1
        ga_hash = compute_hash(ga)
        ts = resolve_timestamp(ga["name"], ga_hash, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("golden_alliances", {})[ga["name"]] = {"hash": ga_hash, "ts": int(ts)}
        batch.add(
            f"INSERT INTO golden_alliances (id, name, last_updated, data_hash) VALUES "
            f"({ga_id}, {escape_sql(ga['name'])}, {escape_sql(ts)}, {escape_sql(ga_hash)});"
        )
        sorted_members = sorted(
            (n for n in ga.get("howlkins", []) if n),
            key=lambda n: (QUALITY_RANK.get(quality_map.get(n, ""), 999), n.lower()),
        )
        for sort_order, howlkin_name in enumerate(sorted_members):
            howlkin_row_id += 1
            batch.add(
                f"INSERT INTO golden_alliance_howlkins (id, alliance_id, sort_order, howlkin_name) VALUES "
                f"({howlkin_row_id}, {ga_id}, {sort_order}, {escape_sql(howlkin_name)});"
            )
        for effect in ga.get("effects", []):
            level = effect.get("level", 0)
            for sort_order, stat in enumerate(effect.get("stats", [])):
                if not stat:
                    continue
                effect_id += 1
                batch.add(
                    f"INSERT INTO golden_alliance_effects (id, alliance_id, level, sort_order, stat) VALUES "
                    f"({effect_id}, {ga_id}, {escape_sql(level)}, {sort_order}, {escape_sql(stat)});"
                )
    print(f"  Synced {ga_id} golden alliances")


def sync_noble_phantasms(data, batch, now, stored_hashes, new_hashes):
    """Sync noble_phantasm.json -> noble_phantasms + effects + skills tables."""
    old_ts = get_old_timestamps("noble_phantasms", "name")
    table_hashes = stored_hashes.get("noble_phantasms", {})
    batch.add("DELETE FROM noble_phantasm_effects;")
    batch.add("DELETE FROM noble_phantasm_skills;")
    batch.add("DELETE FROM noble_phantasms;")
    batch.add("ALTER TABLE noble_phantasm_effects AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE noble_phantasm_skills AUTO_INCREMENT = 1;")
    batch.add("ALTER TABLE noble_phantasms AUTO_INCREMENT = 1;")

    data = sorted(data, key=noble_phantasm_sort_key)
    np_id = 0
    effect_id = 0
    skill_id = 0

    for np in data:
        if not np.get("name"):
            continue

        np_id += 1
        h = compute_hash(np)
        ts = resolve_timestamp(np["name"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("noble_phantasms", {})[np["name"]] = {"hash": h, "ts": int(ts)}

        batch.add(
            f"INSERT INTO noble_phantasms (id, name, character_name, is_global, lore, last_updated, data_hash) VALUES "
            f"({np_id}, {escape_sql(np['name'])}, {escape_sql(np.get('character'))}, "
            f"{'TRUE' if np.get('is_global') else 'FALSE'}, {escape_sql(np.get('lore'))}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
        )

        for idx, effect in enumerate(np.get("effects", []), start=1):
            effect_id += 1
            batch.add(
                f"INSERT INTO noble_phantasm_effects (id, noble_phantasm_id, sort_order, tier, tier_level, description) VALUES "
                f"({effect_id}, {np_id}, {idx}, {escape_sql(effect.get('tier'))}, "
                f"{escape_sql(effect.get('tier_level'))}, {escape_sql(effect.get('description'))});"
            )

        for skill in np.get("skills", []):
            if skill.get("level") in (None, ""):
                continue
            skill_id += 1
            batch.add(
                f"INSERT INTO noble_phantasm_skills (id, noble_phantasm_id, level, tier, tier_level, description) VALUES "
                f"({skill_id}, {np_id}, {escape_sql(skill.get('level'))}, {escape_sql(skill.get('tier'))}, "
                f"{escape_sql(skill.get('tier_level'))}, {escape_sql(skill.get('description'))});"
            )

    print(f"  Synced {np_id} noble phantasms")


def sync_changelog(data, batch, now, stored_hashes, new_hashes):
    """Sync changelog.json -> changelog + changelog_changes tables."""
    old_ts = get_old_timestamps("changelog", "version")
    table_hashes = stored_hashes.get("changelog", {})
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
        h = compute_hash(entry)
        ts = resolve_timestamp(entry["version"], h, old_ts, now, table_hashes=table_hashes)
        new_hashes.setdefault("changelog", {})[entry["version"]] = {"hash": h, "ts": int(ts)}
        batch.add(
            f"INSERT INTO changelog (id, date, version, last_updated, data_hash) VALUES "
            f"({cl_id}, {escape_sql(entry.get('date'))}, {escape_sql(entry['version'])}, "
            f"{escape_sql(ts)}, {escape_sql(h)});"
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
        "--force", action="store_true", help="Force push to DoltHub (overwrite remote)"
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
            "noble-phantasms",
            "resources",
            "codes",
            "status-effects",
            "tier-lists",
            "teams",
            "useful-links",
            "artifacts",
            "howlkins",
            "golden-alliances",
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
        "noble-phantasms": ["noble_phantasm.json"],
        "resources": ["resources.json"],
        "codes": ["codes.json", "resources.json"],
        "status-effects": ["status-effects.json"],
        "tier-lists": ["tier-lists.json"],
        "teams": ["teams.json"],
        "useful-links": ["useful-links.json"],
        "artifacts": ["artifacts.json"],
        "howlkins": ["howlkins.json"],
        "golden-alliances": ["golden_alliances.json", "howlkins.json"],
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

    stored_hashes = load_hashes()
    new_hashes = {}

    print("Syncing to Dolt..." + (" (dry run)" if args.dry_run else ""))

    try:
        existing_tables = get_existing_tables()
        ensure_schema_extensions(existing_tables, dry_run=args.dry_run)
        existing_tables = get_existing_tables()
        resource_ids = build_resource_id_map(json_cache.get("resources.json", []))

        batch = SqlBatch(dry_run=args.dry_run)
        now = int(time.time())

        syncers = {
            "factions": lambda: sync_factions(
                json_cache["factions.json"], batch, now, stored_hashes, new_hashes
            ),
            "characters": lambda: sync_characters(
                json_cache["characters.json"], json_cache["factions.json"], batch, now, stored_hashes, new_hashes
            ),
            "wyrmspells": lambda: sync_wyrmspells(
                json_cache["wyrmspells.json"], batch, now, stored_hashes, new_hashes
            ),
            "noble-phantasms": lambda: sync_noble_phantasms(
                json_cache["noble_phantasm.json"], batch, now, stored_hashes, new_hashes
            ),
            "resources": lambda: sync_resources(
                json_cache["resources.json"], batch, existing_tables, now, stored_hashes, new_hashes
            ),
            "codes": lambda: sync_codes(
                json_cache["codes.json"], batch, existing_tables, resource_ids, now, stored_hashes, new_hashes
            ),
            "status-effects": lambda: sync_status_effects(
                json_cache["status-effects.json"], batch, now, stored_hashes, new_hashes
            ),
            "tier-lists": lambda: sync_tier_lists(
                json_cache["tier-lists.json"], batch, now, stored_hashes, new_hashes
            ),
            "teams": lambda: sync_teams(
                json_cache["teams.json"], batch, now, stored_hashes, new_hashes
            ),
            "useful-links": lambda: sync_useful_links(
                json_cache["useful-links.json"], batch, now, stored_hashes, new_hashes
            ),
            "artifacts": lambda: sync_artifacts(
                json_cache["artifacts.json"], batch, now, stored_hashes, new_hashes
            ),
            "howlkins": lambda: sync_howlkins(
                json_cache["howlkins.json"], batch, now, stored_hashes, new_hashes
            ),
            "golden-alliances": lambda: sync_golden_alliances(
                json_cache["golden_alliances.json"],
                json_cache.get("howlkins.json", []),
                batch, now, stored_hashes, new_hashes
            ),
            "changelog": lambda: sync_changelog(
                json_cache["changelog.json"], batch, now, stored_hashes, new_hashes
            ),
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

    # Persist updated hashes so future syncs on any device can detect unchanged data.
    # Merge into existing hashes so partial syncs (--target) don't discard other tables.
    merged = {**stored_hashes, **new_hashes}
    save_hashes(merged)
    print("Updated hashes.json")

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
        push_args = ["push", "--force"] if args.force else ["push"]
        print("Pushing to DoltHub..." + (" (force)" if args.force else ""))
        try:
            dolt_cmd(*push_args)
        except SyncError as exc:
            err = str(exc).lower()
            if "non-fast-forward" in err or "failed to push some refs" in err:
                print("  Remote is ahead; pulling latest changes and retrying push...")
                dolt_cmd("pull")
                dolt_cmd(*push_args)
            else:
                raise
        print("Pushed successfully.")

    print("Done!")


if __name__ == "__main__":
    main()
