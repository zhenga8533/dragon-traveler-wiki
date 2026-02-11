"""
Process a GitHub Issue suggestion and update the JSON data file.

Reads the GitHub event JSON from $GITHUB_EVENT_PATH, extracts JSON data
from the issue body, validates it, and appends it to the appropriate data file.

Usage (inside GitHub Actions):
    python -m backend.suggest
"""

import json
import os
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DATA_DIR = ROOT_DIR / "data"

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

    print(f"Processing issue #{issue_number}: {issue_title}")

    # Detect label from title prefix
    prefix_to_label = {
        "[Code]": "codes",
        "[Character]": "character",
        "[Wyrmspell]": "wyrmspell",
        "[Status Effect]": "status-effect",
        "[Link]": "links",
        "[Tier List]": "tier-list",
        "[Team]": "team",
    }

    label = None
    for prefix, lbl in prefix_to_label.items():
        if issue_title.startswith(prefix):
            label = lbl
            break

    if not label:
        print(f"No suggestion prefix found in title. Skipping.")
        sys.exit(0)

    print(f"Matched label: {label}")

    # Extract and validate JSON from issue body
    data = extract_json_from_body(issue_body)
    print(f"Extracted JSON: {json.dumps(data, indent=2)[:500]}")
    validate_data(label, data)
    print("Validation passed.")

    # Update the JSON data file
    json_file = update_json_file(label, data)
    set_output("json_file", json_file)
    set_output("label", label)

    print("Done!")


if __name__ == "__main__":
    main()
