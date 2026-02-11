"""
Process a GitHub Issue suggestion and create a DoltHub pull request.

Reads the GitHub event JSON from $GITHUB_EVENT_PATH, extracts JSON data
from the issue body, generates SQL INSERTs, and creates a DoltHub PR.

Usage (inside GitHub Actions):
    python -m backend.suggest_dolt
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
DOLT_DIR = SCRIPT_DIR.parent / "dolt-db"

DOLTHUB_OWNER = "zhenga8533"
DOLTHUB_REPO = "dragon-traveler-db"
DOLTHUB_API = "https://www.dolthub.com/api/v1alpha1"

ROOT_DIR = SCRIPT_DIR.parent
DATA_DIR = ROOT_DIR / "data"

LABEL_TABLE_MAP = {
    "codes": ["codes"],
    "wyrmspell": ["wyrmspells"],
    "status-effect": ["status_effects"],
    "links": ["useful_links"],
    "character": ["characters", "character_factions", "character_subclasses"],
    "tier-list": ["tier_lists", "tier_list_entries"],
    "team": ["teams", "team_members", "team_member_substitutes"],
}

LABEL_JSON_FILE = {
    "codes": "codes.json",
    "wyrmspell": "wyrmspells.json",
    "status-effect": "status-effects.json",
    "links": "useful-links.json",
    "character": "characters.json",
    "tier-list": "tier-lists.json",
    "team": "teams.json",
}

REQUIRED_FIELDS = {
    "codes": ["code"],
    "wyrmspell": ["name"],
    "status-effect": ["name"],
    "links": ["name", "link"],
    "character": ["name"],
    "tier-list": ["name", "entries"],
    "team": ["name", "members"],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def escape_sql(value):
    """Escape a value for safe SQL insertion (reuses logic from sync_dolt)."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    s = s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
    return f"'{s}'"


def dolt_cmd(*args):
    """Run a dolt CLI command. Raises RuntimeError on failure."""
    result = subprocess.run(
        ["dolt", *args],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"dolt {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout


def dolt_sql(query):
    """Run a SQL query via dolt sql. Raises RuntimeError on failure."""
    result = subprocess.run(
        ["dolt", "sql", "-r", "csv", "-q", query],
        cwd=DOLT_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(f"SQL failed: {query[:200]}\n{result.stderr.strip()}")
    return result.stdout.strip()


def dolt_sql_exec(query):
    """Run a SQL statement via dolt sql (no result needed). Raises RuntimeError on failure."""
    result = subprocess.run(
        ["dolt", "sql"],
        cwd=DOLT_DIR,
        input=query,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(f"SQL exec failed: {query[:200]}\n{result.stderr.strip()}")
    return result.stdout


def get_next_id(table):
    """Get the next available ID for a table using SELECT MAX(id)."""
    output = dolt_sql(f"SELECT COALESCE(MAX(id), 0) FROM {table};")
    lines = output.strip().split("\n")
    if len(lines) >= 2:
        return int(lines[-1]) + 1
    return 1


def set_output(name, value):
    """Write a value to $GITHUB_OUTPUT."""
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(f"{name}={value}\n")


# ---------------------------------------------------------------------------
# JSON extraction & validation
# ---------------------------------------------------------------------------

def extract_json_from_body(body):
    """Extract JSON from a ```json code block in the issue body."""
    match = re.search(r"```json\s*\n(.*?)\n\s*```", body, re.DOTALL)
    if not match:
        raise ValueError("No ```json code block found in the issue body.")
    raw = match.group(1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in issue body: {e}") from e


def validate_data(label, data):
    """Light validation: check required fields exist and have non-empty values."""
    required = REQUIRED_FIELDS.get(label, [])
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields for '{label}': {', '.join(missing)}")

    if label == "tier-list":
        entries = data.get("entries", [])
        if not isinstance(entries, list) or len(entries) == 0:
            raise ValueError("Tier list must have at least one entry.")
        for i, entry in enumerate(entries):
            if not entry.get("character_name"):
                raise ValueError(f"Entry {i} is missing 'character_name'.")
            if not entry.get("tier"):
                raise ValueError(f"Entry {i} is missing 'tier'.")

    if label == "team":
        members = data.get("members", [])
        if not isinstance(members, list) or len(members) == 0:
            raise ValueError("Team must have at least one member.")
        for i, m in enumerate(members):
            if not m.get("character_name"):
                raise ValueError(f"Member {i} is missing 'character_name'.")


# ---------------------------------------------------------------------------
# JSON data file updates
# ---------------------------------------------------------------------------

def normalize_for_json(label, data):
    """Normalize issue data into the shape expected by the JSON data files."""
    if label == "codes":
        return {"code": data["code"], "active": data.get("active", True)}

    if label == "wyrmspell":
        return {
            "name": data["name"],
            "effect": data.get("effect", ""),
            "type": data.get("type", ""),
        }

    if label == "status-effect":
        return {
            "name": data["name"],
            "type": data.get("type", ""),
            "effect": data.get("effect", ""),
            "remark": data.get("remark", ""),
        }

    if label == "links":
        return {
            "icon": data.get("icon", ""),
            "application": data.get("application", ""),
            "name": data["name"],
            "description": data.get("description", ""),
            "link": data["link"],
        }

    if label == "character":
        return {
            "name": data["name"],
            "title": data.get("title", ""),
            "quality": data.get("quality", ""),
            "character_class": data.get("character_class", ""),
            "factions": data.get("factions", []),
            "is_global": data.get("is_global", True),
            "subclasses": data.get("subclasses", []),
            "height": data.get("height", ""),
            "weight": data.get("weight", ""),
            "origin": data.get("origin", ""),
            "lore": data.get("lore", ""),
            "quote": data.get("quote", ""),
            "talent": data.get("talent"),
            "skills": data.get("skills", []),
            "noble_phantasm": data.get("noble_phantasm"),
        }

    if label == "tier-list":
        return {
            "name": data["name"],
            "author": data.get("author", ""),
            "content_type": data.get("content_type", ""),
            "description": data.get("description", ""),
            "entries": [
                {
                    "character_name": e.get("character_name", ""),
                    "tier": e.get("tier", ""),
                    "note": e.get("note", ""),
                }
                for e in data.get("entries", [])
            ],
        }

    if label == "team":
        return {
            "name": data["name"],
            "author": data.get("author", ""),
            "content_type": data.get("content_type", ""),
            "description": data.get("description", ""),
            "faction": data.get("faction", ""),
            "members": [
                {
                    "character_name": m.get("character_name", ""),
                    "overdrive_order": m.get("overdrive_order"),
                    "substitutes": m.get("substitutes", []),
                    "note": m.get("note", ""),
                }
                for m in data.get("members", [])
            ],
            "wyrmspells": {
                "breach": (data.get("wyrmspells") or {}).get("breach", ""),
                "refuge": (data.get("wyrmspells") or {}).get("refuge", ""),
                "wildcry": (data.get("wyrmspells") or {}).get("wildcry", ""),
                "dragons_call": (data.get("wyrmspells") or {}).get("dragons_call", ""),
            },
        }

    raise ValueError(f"Unknown label: {label}")


def update_json_file(label, data):
    """Append normalized data to the corresponding JSON data file."""
    filename = LABEL_JSON_FILE[label]
    path = DATA_DIR / filename
    if not path.exists():
        raise RuntimeError(f"Data file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        existing = json.load(f)

    entry = normalize_for_json(label, data)
    existing.append(entry)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Updated {filename} (+1 entry, total {len(existing)})")
    return filename


# ---------------------------------------------------------------------------
# SQL generation per label type
# ---------------------------------------------------------------------------

def generate_codes_sql(data):
    """Generate INSERT SQL for a codes suggestion."""
    next_id = get_next_id("codes")
    return (
        f"INSERT INTO codes (id, code, active) VALUES "
        f"({next_id}, {escape_sql(data['code'])}, {escape_sql(data.get('active', True))});"
    )


def generate_wyrmspell_sql(data):
    """Generate INSERT SQL for a wyrmspell suggestion."""
    next_id = get_next_id("wyrmspells")
    return (
        f"INSERT INTO wyrmspells (id, name, effect, type) VALUES "
        f"({next_id}, {escape_sql(data['name'])}, {escape_sql(data.get('effect'))}, "
        f"{escape_sql(data.get('type'))});"
    )


def generate_status_effect_sql(data):
    """Generate INSERT SQL for a status effect suggestion."""
    next_id = get_next_id("status_effects")
    return (
        f"INSERT INTO status_effects (id, name, type, effect, remark) VALUES "
        f"({next_id}, {escape_sql(data['name'])}, {escape_sql(data.get('type'))}, "
        f"{escape_sql(data.get('effect'))}, {escape_sql(data.get('remark'))});"
    )


def generate_links_sql(data):
    """Generate INSERT SQL for a useful link suggestion."""
    next_id = get_next_id("useful_links")
    return (
        f"INSERT INTO useful_links (id, icon, application, name, description, link) VALUES "
        f"({next_id}, {escape_sql(data.get('icon'))}, {escape_sql(data.get('application'))}, "
        f"{escape_sql(data['name'])}, {escape_sql(data.get('description'))}, "
        f"{escape_sql(data['link'])});"
    )


def generate_character_sql(data):
    """Generate INSERT SQL for a character suggestion."""
    stmts = []
    char_id = get_next_id("characters")
    stmts.append(
        f"INSERT INTO characters (id, name, title, quality, character_class, is_global, "
        f"height, weight, origin, lore, quote, talent_name, noble_phantasm) VALUES "
        f"({char_id}, {escape_sql(data['name'])}, {escape_sql(data.get('title'))}, "
        f"{escape_sql(data.get('quality'))}, {escape_sql(data.get('character_class'))}, "
        f"{escape_sql(data.get('is_global', True))}, {escape_sql(data.get('height'))}, "
        f"{escape_sql(data.get('weight'))}, {escape_sql(data.get('origin'))}, "
        f"{escape_sql(data.get('lore'))}, {escape_sql(data.get('quote'))}, "
        f"{escape_sql(data.get('talent_name'))}, {escape_sql(data.get('noble_phantasm'))});"
    )

    for sort_order, fname in enumerate(data.get("factions", [])):
        if not fname:
            continue
        # Look up faction ID by name
        output = dolt_sql(f"SELECT id FROM factions WHERE name = {escape_sql(fname)};")
        lines = output.strip().split("\n")
        if len(lines) >= 2:
            fid = int(lines[-1])
            stmts.append(
                f"INSERT INTO character_factions (character_id, faction_id, sort_order) VALUES "
                f"({char_id}, {fid}, {sort_order});"
            )

    for sc in data.get("subclasses", []):
        if sc:
            sc_id = get_next_id("character_subclasses")
            stmts.append(
                f"INSERT INTO character_subclasses (id, character_id, subclass_name) VALUES "
                f"({sc_id}, {char_id}, {escape_sql(sc)});"
            )

    return "\n".join(stmts)


def generate_tier_list_sql(data):
    """Generate INSERT SQL for a tier list suggestion."""
    stmts = []
    tl_id = get_next_id("tier_lists")
    stmts.append(
        f"INSERT INTO tier_lists (id, name, author, content_type, description) VALUES "
        f"({tl_id}, {escape_sql(data['name'])}, {escape_sql(data.get('author'))}, "
        f"{escape_sql(data.get('content_type'))}, {escape_sql(data.get('description'))});"
    )

    entry_id = get_next_id("tier_list_entries")
    for entry in data.get("entries", []):
        stmts.append(
            f"INSERT INTO tier_list_entries (id, tier_list_id, character_name, tier, note) VALUES "
            f"({entry_id}, {tl_id}, {escape_sql(entry.get('character_name'))}, "
            f"{escape_sql(entry.get('tier'))}, {escape_sql(entry.get('note', ''))});"
        )
        entry_id += 1

    return "\n".join(stmts)


def generate_team_sql(data):
    """Generate INSERT SQL for a team suggestion."""
    stmts = []
    team_id = get_next_id("teams")
    ws = data.get("wyrmspells") or {}
    stmts.append(
        f"INSERT INTO teams (id, name, author, content_type, description, faction, "
        f"breach_wyrmspell, refuge_wyrmspell, wildcry_wyrmspell, dragons_call_wyrmspell) VALUES "
        f"({team_id}, {escape_sql(data['name'])}, {escape_sql(data.get('author'))}, "
        f"{escape_sql(data.get('content_type'))}, {escape_sql(data.get('description'))}, "
        f"{escape_sql(data.get('faction'))}, {escape_sql(ws.get('breach'))}, "
        f"{escape_sql(ws.get('refuge'))}, {escape_sql(ws.get('wildcry'))}, "
        f"{escape_sql(ws.get('dragons_call'))});"
    )

    member_id = get_next_id("team_members")
    sub_id = get_next_id("team_member_substitutes")
    for m in data.get("members", []):
        current_member_id = member_id
        stmts.append(
            f"INSERT INTO team_members (id, team_id, character_name, overdrive_order, note) VALUES "
            f"({member_id}, {team_id}, {escape_sql(m.get('character_name'))}, "
            f"{escape_sql(m.get('overdrive_order'))}, {escape_sql(m.get('note', ''))});"
        )
        member_id += 1

        for sub in m.get("substitutes", []):
            if sub:
                stmts.append(
                    f"INSERT INTO team_member_substitutes (id, team_member_id, character_name) VALUES "
                    f"({sub_id}, {current_member_id}, {escape_sql(sub)});"
                )
                sub_id += 1

    return "\n".join(stmts)


SQL_GENERATORS = {
    "codes": generate_codes_sql,
    "wyrmspell": generate_wyrmspell_sql,
    "status-effect": generate_status_effect_sql,
    "links": generate_links_sql,
    "character": generate_character_sql,
    "tier-list": generate_tier_list_sql,
    "team": generate_team_sql,
}


# ---------------------------------------------------------------------------
# DoltHub PR creation
# ---------------------------------------------------------------------------

def create_dolthub_pr(branch, title, description):
    """Create a pull request on DoltHub via REST API."""
    token = os.environ.get("DOLTHUB_TOKEN")
    if not token:
        raise RuntimeError("DOLTHUB_TOKEN environment variable is not set.")

    url = f"{DOLTHUB_API}/{DOLTHUB_OWNER}/{DOLTHUB_REPO}/pulls"
    payload = {
        "title": title,
        "description": description,
        "fromBranchName": branch,
        "toBranchName": "main",
    }
    headers = {"authorization": f"token {token}"}
    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"DoltHub PR creation failed ({resp.status_code}): {resp.text}")
    pr_data = resp.json()
    # Build the PR URL from the response
    pr_url = f"https://www.dolthub.com/repositories/{DOLTHUB_OWNER}/{DOLTHUB_REPO}/pulls/{pr_data.get('pull_id', '')}"
    return pr_url


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        print("Error: GITHUB_EVENT_PATH not set. Run inside GitHub Actions.", file=sys.stderr)
        sys.exit(1)

    with open(event_path, "r", encoding="utf-8") as f:
        event = json.load(f)

    issue = event.get("issue", {})
    issue_number = issue.get("number")
    issue_title = issue.get("title", "")
    issue_body = issue.get("body", "")
    labels = [lbl.get("name", "") for lbl in issue.get("labels", [])]

    print(f"Processing issue #{issue_number}: {issue_title}")
    print(f"Labels: {labels}")

    # Find the matching suggestion label
    label = None
    for lbl in labels:
        if lbl in LABEL_TABLE_MAP:
            label = lbl
            break

    if not label:
        print(f"No matching suggestion label found in {labels}. Skipping.")
        sys.exit(0)

    print(f"Matched label: {label}")

    # Extract and validate JSON from issue body
    data = extract_json_from_body(issue_body)
    print(f"Extracted JSON: {json.dumps(data, indent=2)[:500]}")
    validate_data(label, data)
    print("Validation passed.")

    # Update the JSON data file (for GitHub PR)
    json_file = update_json_file(label, data)
    set_output("json_file", json_file)

    # Generate SQL
    generator = SQL_GENERATORS[label]
    sql = generator(data)
    print(f"Generated SQL:\n{sql}")

    # Create Dolt branch, apply SQL, commit, push
    branch = f"suggestion/issue-{issue_number}"
    print(f"Creating branch: {branch}")
    dolt_cmd("checkout", "main")
    try:
        dolt_cmd("branch", "-D", branch)
    except RuntimeError:
        pass  # Branch doesn't exist yet, that's fine
    dolt_cmd("checkout", "-b", branch)

    print("Executing SQL...")
    dolt_sql_exec(sql)

    print("Committing...")
    dolt_cmd("add", ".")
    dolt_cmd("commit", "-m", f"Suggestion from issue #{issue_number}: {issue_title}")

    print("Pushing to DoltHub...")
    dolt_cmd("push", "origin", branch)

    # Create DoltHub PR
    print("Creating DoltHub PR...")
    pr_title = f"Suggestion: {issue_title} (#{issue_number})"
    pr_description = (
        f"Auto-generated from GitHub issue #{issue_number}.\n\n"
        f"**Label:** {label}\n\n"
        f"**Data:**\n```json\n{json.dumps(data, indent=2)}\n```"
    )
    pr_url = create_dolthub_pr(branch, pr_title, pr_description)
    print(f"DoltHub PR created: {pr_url}")

    set_output("pr_url", pr_url)
    print("Done!")


if __name__ == "__main__":
    main()
