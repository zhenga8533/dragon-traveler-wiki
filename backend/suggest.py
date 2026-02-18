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
from urllib.parse import urlparse

from .sort_keys import FILE_SORT_KEY

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DATA_DIR = ROOT_DIR / "data"

LABEL_JSON_FILE = {
    "codes": "codes.json",
    "wyrmspell": "wyrmspells.json",
    "noble-phantasm": "noble_phantasm.json",
    "status-effect": "status-effects.json",
    "links": "useful-links.json",
    "resource": "resources.json",
    "character": "characters.json",
    "tier-list": "tier-lists.json",
    "team": "teams.json",
}

REQUIRED_FIELDS = {
    "codes": ["code"],
    "wyrmspell": ["name"],
    "noble-phantasm": ["name"],
    "status-effect": ["name"],
    "links": ["name", "link"],
    "resource": ["name", "category", "description", "quality"],
    "character": ["name"],
    "tier-list": ["name", "entries"],
    "team": ["name", "members"],
}

VALID_RESOURCE_CATEGORIES = {
    "Currency",
    "Gift",
    "Item",
    "Material",
    "Summoning",
    "Shard",
}

VALID_STATUS_EFFECT_TYPES = {
    "Buff",
    "Debuff",
    "Special",
    "Control",
    "Elemental",
    "Blessing",
    "Exclusive",
}

VALID_WYRMSPELL_TYPES = {"Breach", "Refuge", "Wildcry", "Dragon's Call"}
VALID_CHARACTER_QUALITIES = {"UR", "SSR EX", "SSR+", "SSR", "SR", "R", "N"}
VALID_CHARACTER_CLASSES = {
    "Guardian",
    "Priest",
    "Assassin",
    "Warrior",
    "Archer",
    "Mage",
}
VALID_TIERS = {"S+", "S", "A", "B", "C", "D"}


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
    if not isinstance(data, dict):
        raise ValueError("Suggestion JSON must be an object.")

    required = REQUIRED_FIELDS.get(label, [])
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields for '{label}': {', '.join(missing)}")

    if label == "links":
        link = str(data.get("link", "")).strip()
        parsed = urlparse(link)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Link must be a valid http/https URL.")

    if label == "resource":
        category = str(data.get("category", "")).strip()
        if category not in VALID_RESOURCE_CATEGORIES:
            raise ValueError(
                "Invalid resource category. "
                f"Expected one of: {', '.join(sorted(VALID_RESOURCE_CATEGORIES))}"
            )
        if data.get("quality") and data["quality"] not in VALID_CHARACTER_QUALITIES:
            raise ValueError(
                "Invalid resource quality. "
                f"Expected one of: {', '.join(sorted(VALID_CHARACTER_QUALITIES))}"
            )

    if label == "wyrmspell" and data.get("type"):
        if data["type"] not in VALID_WYRMSPELL_TYPES:
            raise ValueError(
                f"Invalid wyrmspell type. Expected one of: {', '.join(sorted(VALID_WYRMSPELL_TYPES))}"
            )

    if label == "status-effect" and data.get("type"):
        if data["type"] not in VALID_STATUS_EFFECT_TYPES:
            raise ValueError(
                "Invalid status effect type. "
                f"Expected one of: {', '.join(sorted(VALID_STATUS_EFFECT_TYPES))}"
            )

    if label == "character":
        if data.get("quality") and data["quality"] not in VALID_CHARACTER_QUALITIES:
            raise ValueError(
                "Invalid character quality. "
                f"Expected one of: {', '.join(sorted(VALID_CHARACTER_QUALITIES))}"
            )
        if (
            data.get("character_class")
            and data["character_class"] not in VALID_CHARACTER_CLASSES
        ):
            raise ValueError(
                "Invalid character class. "
                f"Expected one of: {', '.join(sorted(VALID_CHARACTER_CLASSES))}"
            )

    if label == "tier-list":
        entries = data.get("entries", [])
        if not isinstance(entries, list) or len(entries) == 0:
            raise ValueError("Tier list must have at least one entry.")
        for i, entry in enumerate(entries):
            if not entry.get("character_name"):
                raise ValueError(f"Entry {i} is missing 'character_name'.")
            if not entry.get("tier"):
                raise ValueError(f"Entry {i} is missing 'tier'.")
            if entry["tier"] not in VALID_TIERS:
                raise ValueError(
                    f"Entry {i} has invalid tier '{entry['tier']}'. "
                    f"Expected one of: {', '.join(sorted(VALID_TIERS))}"
                )

    if label == "team":
        members = data.get("members", [])
        if not isinstance(members, list) or len(members) == 0:
            raise ValueError("Team must have at least one member.")
        for i, m in enumerate(members):
            if not m.get("character_name"):
                raise ValueError(f"Member {i} is missing 'character_name'.")


def _split_csv_list(value):
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


def _coerce_optional_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# JSON data file updates
# ---------------------------------------------------------------------------


def normalize_for_json(label, data):
    """Normalize issue data into the shape expected by the JSON data files."""
    if label == "codes":
        rewards_input = data.get("rewards")
        if rewards_input is None:
            rewards_input = data.get("reward", [])

        rewards = [
            {
                "name": r.get("name", ""),
                "quantity": r.get("quantity", 0),
            }
            for r in rewards_input
            if r.get("name")
        ]
        return {
            "code": data["code"],
            "rewards": rewards,
            "active": data.get("active", True),
        }

    if label == "wyrmspell":
        return {
            "name": data["name"],
            "effect": data.get("effect", ""),
            "type": data.get("type", ""),
            "quality": data.get("quality", "") or "",
            "exclusive_faction": data.get("exclusive_faction") or None,
            "is_global": data.get("is_global", True),
        }

    if label == "status-effect":
        return {
            "name": data["name"],
            "type": data.get("type", ""),
            "effect": data.get("effect", ""),
            "remark": data.get("remark", ""),
        }

    if label == "noble-phantasm":
        return {
            "name": data["name"],
            "character": data.get("character") or None,
            "is_global": data.get("is_global", True),
            "lore": data.get("lore", ""),
            "effects": data.get("effects", []),
            "skills": data.get("skills", []),
        }

    if label == "resource":
        return {
            "name": data["name"],
            "quality": data.get("quality") or "",
            "description": data.get("description", ""),
            "category": data.get("category", ""),
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
            "factions": _split_csv_list(data.get("factions", [])),
            "is_global": data.get("is_global", True),
            "subclasses": _split_csv_list(data.get("subclasses", [])),
            "height": data.get("height", ""),
            "weight": data.get("weight", ""),
            "origin": data.get("origin", ""),
            "lore": data.get("lore", ""),
            "quote": data.get("quote", ""),
            "talent": data.get("talent"),
            "skills": data.get("skills", []),
            "noble_phantasm": data.get("noble_phantasm") or "",
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
                    "overdrive_order": _coerce_optional_int(m.get("overdrive_order")),
                    "substitutes": _split_csv_list(m.get("substitutes", [])),
                    "note": m.get("note", ""),
                }
                for m in data.get("members", [])
            ],
            "wyrmspells": {
                "breach": (data.get("wyrmspells") or {}).get("breach", "")
                or str(data.get("breach_wyrmspell", "") or ""),
                "refuge": (data.get("wyrmspells") or {}).get("refuge", "")
                or str(data.get("refuge_wyrmspell", "") or ""),
                "wildcry": (data.get("wyrmspells") or {}).get("wildcry", "")
                or str(data.get("wildcry_wyrmspell", "") or ""),
                "dragons_call": (data.get("wyrmspells") or {}).get("dragons_call", "")
                or str(data.get("dragons_call_wyrmspell", "") or ""),
            },
        }

    raise ValueError(f"Unknown label: {label}")


def _get_identity_key(label):
    """Return the field used to detect duplicates for a given label."""
    if label == "codes":
        return "code"
    return "name"


def update_json_file(label, data):
    """Append normalized data to the corresponding JSON data file."""
    filename = LABEL_JSON_FILE[label]
    path = DATA_DIR / filename
    if not path.exists():
        raise RuntimeError(f"Data file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        existing = json.load(f)

    entry = normalize_for_json(label, data)

    identity_key = _get_identity_key(label)
    new_value = entry.get(identity_key, "")
    if new_value:
        for item in existing:
            if item.get(identity_key) == new_value:
                raise ValueError(
                    f"Duplicate {identity_key} '{new_value}' already exists in {filename}"
                )

    existing.append(entry)

    sort_key = FILE_SORT_KEY.get(filename)
    if sort_key:
        existing.sort(key=sort_key)

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
        print(
            "Error: GITHUB_EVENT_PATH not set. Run inside GitHub Actions.",
            file=sys.stderr,
        )
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
        "[Noble Phantasm]": "noble-phantasm",
        "[Status Effect]": "status-effect",
        "[Link]": "links",
        "[Resource]": "resource",
        "[Tier List]": "tier-list",
        "[Team]": "team",
    }

    label = None
    for prefix, lbl in prefix_to_label.items():
        if issue_title.startswith(prefix):
            label = lbl
            break

    if not label:
        set_output("label", "")
        set_output("processed", "false")
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
    set_output("processed", "true")

    print("Done!")


if __name__ == "__main__":
    main()
