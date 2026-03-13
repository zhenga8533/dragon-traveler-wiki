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
import time
from pathlib import Path

from ..sort_keys import FILE_SORT_KEY
from .normalize import normalize_for_json
from .validate import validate_data

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data"

LABEL_JSON_FILE = {
    "codes": "codes.json",
    "faction": "factions.json",
    "artifact": "artifacts.json",
    "wyrmspell": "wyrmspells.json",
    "noble-phantasm": "noble_phantasm.json",
    "status-effect": "status-effects.json",
    "links": "useful-links.json",
    "resource": "resources.json",
    "character": "characters.json",
    "subclass": "subclasses.json",
    "howlkin": "howlkins.json",
    "golden-alliance": "golden_alliances.json",
    "gear": "gear.json",
    "gear-set": "gear_sets.json",
    "tier-list": "tier-lists.json",
    "team": "teams.json",
}

REQUIRED_FIELDS = {
    "codes": ["code"],
    "faction": ["name", "wyrm", "description", "recommended_artifacts"],
    "artifact": ["name"],
    "wyrmspell": ["name"],
    "noble-phantasm": ["name"],
    "status-effect": ["name"],
    "links": ["name", "link"],
    "resource": ["name", "category", "description", "quality"],
    "character": ["name"],
    "subclass": ["name", "tier", "bonuses", "effect"],
    "howlkin": ["name", "quality", "basic_stats", "passive_effects"],
    "golden-alliance": ["name"],
    "gear": ["name"],
    "gear-set": ["name"],
    "tier-list": ["name", "entries"],
    "team": ["name", "members"],
}

# Labels whose JSON entries carry a last_updated Unix timestamp.
TIMESTAMPED_LABELS = {
    "artifact",
    "wyrmspell",
    "noble-phantasm",
    "resource",
    "character",
    "subclass",
    "howlkin",
    "golden-alliance",
    "gear",
    "gear-set",
    "team",
}

PREFIX_TO_LABEL = {
    "[Code]": "codes",
    "[Faction]": "faction",
    "[Artifact]": "artifact",
    "[Character]": "character",
    "[Subclass]": "subclass",
    "[Wyrmspell]": "wyrmspell",
    "[Noble Phantasm]": "noble-phantasm",
    "[Status Effect]": "status-effect",
    "[Link]": "links",
    "[Resource]": "resource",
    "[Howlkin]": "howlkin",
    "[Golden Alliance]": "golden-alliance",
    "[Gear]": "gear",
    "[Gear Set]": "gear-set",
    "[Tier List]": "tier-list",
    "[Team]": "team",
}


# ---------------------------------------------------------------------------
# GitHub Actions helpers
# ---------------------------------------------------------------------------


def set_output(name, value):
    """Write a value to $GITHUB_OUTPUT."""
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as f:
            f.write(f"{name}={value}\n")


# ---------------------------------------------------------------------------
# JSON extraction
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


# ---------------------------------------------------------------------------
# Identity helpers
# ---------------------------------------------------------------------------


def _get_identity_key(label):
    """Return the field used to detect duplicates for a given label."""
    if label == "codes":
        return "code"
    return "name"


def _entry_identity(label, data):
    """Return a stable identity value for matching existing entries."""
    if label == "character":
        name = str(data.get("name", "") or "").strip()
        quality = str(data.get("quality", "") or "").strip()
        if not name:
            return ""
        return f"{name}__{quality}" if quality else name

    identity_key = _get_identity_key(label)
    return str(data.get(identity_key, "") or "").strip()


def _deep_merge(existing, updates):
    """Recursively merge dict updates into existing dict."""
    if not isinstance(existing, dict) or not isinstance(updates, dict):
        return updates

    merged = dict(existing)
    for key, value in updates.items():
        if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _without_meta(entry):
    if not isinstance(entry, dict):
        return entry
    return {key: value for key, value in entry.items() if key != "last_updated"}


# ---------------------------------------------------------------------------
# File upsert
# ---------------------------------------------------------------------------


def update_json_file(label, data):
    """Upsert normalized data into the corresponding JSON data file."""
    filename = LABEL_JSON_FILE[label]
    path = DATA_DIR / filename
    if not path.exists():
        raise RuntimeError(f"Data file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        existing = json.load(f)
    original_existing = json.loads(json.dumps(existing))

    identity_key = _get_identity_key(label)
    new_value = _entry_identity(label, data)
    matched_index = None
    if new_value:
        for index, item in enumerate(existing):
            if _entry_identity(label, item) == new_value:
                matched_index = index
                break

    is_update = matched_index is not None
    validate_data(
        label, data, REQUIRED_FIELDS, is_update=is_update, identity_key=identity_key
    )
    entry = normalize_for_json(label, data, is_update=is_update)

    if is_update:
        merged_entry = _deep_merge(existing[matched_index], entry)
        changed = _without_meta(merged_entry) != _without_meta(existing[matched_index])
        if changed and label in TIMESTAMPED_LABELS:
            merged_entry["last_updated"] = int(time.time())
        existing[matched_index] = merged_entry
        action = "updated" if changed else "unchanged"
    else:
        if label in TIMESTAMPED_LABELS:
            entry["last_updated"] = int(time.time())
        existing.append(entry)
        action = "added"

    sort_key = FILE_SORT_KEY.get(filename)
    if sort_key:
        existing.sort(key=sort_key)

    if existing != original_existing:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print(
        f"Updated {filename} ({action} {identity_key} '{new_value}', total {len(existing)})"
    )
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

    # Special case: expired code reports — no JSON block, just mark code inactive
    EXPIRED_PREFIX = "[Code] Report expired:"
    if issue_title.startswith(EXPIRED_PREFIX):
        code = issue_title[len(EXPIRED_PREFIX) :].strip()
        if not code:
            set_output("label", "")
            set_output("processed", "false")
            set_output("manual_review", "false")
            print("Expired code report missing code name. Skipping.")
            sys.exit(0)
        data = {"code": code, "active": False}
        json_file = update_json_file("codes", data)
        set_output("json_file", json_file)
        set_output("label", "codes")
        set_output("processed", "true")
        set_output("manual_review", "false")
        print(f"Marked code '{code}' as inactive.")
        sys.exit(0)

    # Detect label from title prefix
    label = None
    for prefix, lbl in PREFIX_TO_LABEL.items():
        if issue_title.startswith(prefix):
            label = lbl
            break

    if not label:
        manual_review = bool(re.match(r"^\[.+\]", issue_title))
        set_output("manual_review", "true" if manual_review else "false")
        set_output("label", "")
        set_output("processed", "false")
        print("No known suggestion prefix found in title. Skipping.")
        sys.exit(0)

    set_output("manual_review", "false")
    print(f"Matched label: {label}")

    data = extract_json_from_body(issue_body)
    print(f"Extracted JSON: {json.dumps(data, indent=2)[:500]}")
    print(
        "JSON extracted. Validation and update mode will be resolved in file update step."
    )

    json_file = update_json_file(label, data)
    set_output("json_file", json_file)
    set_output("label", label)
    set_output("processed", "true")

    print("Done!")
