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
    "faction": "factions.json",
    "wyrmspell": "wyrmspells.json",
    "noble-phantasm": "noble_phantasm.json",
    "status-effect": "status-effects.json",
    "links": "useful-links.json",
    "resource": "resources.json",
    "character": "characters.json",
    "howlkin": "howlkins.json",
    "tier-list": "tier-lists.json",
    "team": "teams.json",
}

REQUIRED_FIELDS = {
    "codes": ["code"],
    "faction": ["name", "wyrm", "description", "recommended_artifacts"],
    "wyrmspell": ["name"],
    "noble-phantasm": ["name"],
    "status-effect": ["name"],
    "links": ["name", "link"],
    "resource": ["name", "category", "description", "quality"],
    "character": ["name"],
    "howlkin": ["name", "quality", "basic_stats", "passive_effects"],
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


def validate_data(label, data, is_update=False):
    """Validate suggestion data for create or update operations."""
    if not isinstance(data, dict):
        raise ValueError("Suggestion JSON must be an object.")

    if is_update:
        required = [_get_identity_key(label)]
    else:
        required = REQUIRED_FIELDS.get(label, [])
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields for '{label}': {', '.join(missing)}")

    if label == "links":
        if "link" in data:
            link = str(data.get("link", "")).strip()
            parsed = urlparse(link)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Link must be a valid http/https URL.")

    if label == "resource":
        if "category" in data:
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

    if label == "howlkin" and data.get("quality"):
        if data["quality"] not in VALID_CHARACTER_QUALITIES:
            raise ValueError(
                "Invalid howlkin quality. "
                f"Expected one of: {', '.join(sorted(VALID_CHARACTER_QUALITIES))}"
            )

    if label == "tier-list":
        if "entries" in data:
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
        if "members" in data:
            members = data.get("members", [])
            if not isinstance(members, list) or len(members) == 0:
                raise ValueError("Team must have at least one member.")
            for i, m in enumerate(members):
                if not m.get("character_name"):
                    raise ValueError(f"Member {i} is missing 'character_name'.")

    if label == "faction" and "recommended_artifacts" in data:
        artifacts = _normalize_string_list(data.get("recommended_artifacts"))
        if len(artifacts) == 0:
            raise ValueError("Faction must include at least one recommended artifact.")


def _split_csv_list(value):
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


def _normalize_string_list(value, item_key="name"):
    if isinstance(value, str):
        return _split_csv_list(value)
    if isinstance(value, list):
        normalized = []
        for item in value:
            if isinstance(item, dict):
                text = str(item.get(item_key, "") or "").strip()
            else:
                text = str(item or "").strip()
            if text:
                normalized.append(text)
        return normalized
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


def normalize_for_json(label, data, is_update=False):
    """Normalize issue data into the shape expected by the JSON data files."""
    if label == "codes":
        rewards_input = data.get("rewards") if "rewards" in data else data.get("reward")
        if isinstance(rewards_input, list):
            rewards = {
                r["name"]: int(r.get("quantity", 0))
                for r in rewards_input
                if r.get("name")
            }
        elif isinstance(rewards_input, dict):
            rewards = {k: int(v) for k, v in rewards_input.items() if k}
        else:
            rewards = {}

        if is_update:
            result = {"code": data["code"]}
            if "rewards" in data or "reward" in data:
                result["rewards"] = rewards
            if "active" in data:
                result["active"] = data.get("active")
            return result

        return {
            "code": data["code"],
            "rewards": rewards,
            "active": data.get("active", True),
        }

    if label == "wyrmspell":
        if not is_update:
            return {
                "name": data["name"],
                "effect": data.get("effect", ""),
                "type": data.get("type", ""),
                "quality": data.get("quality", "") or "",
                "exclusive_faction": data.get("exclusive_faction") or None,
                "is_global": data.get("is_global", True),
            }

        result = {"name": data["name"]}
        if "effect" in data:
            result["effect"] = data.get("effect", "")
        if "type" in data:
            result["type"] = data.get("type", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "") or ""
        if "exclusive_faction" in data:
            result["exclusive_faction"] = data.get("exclusive_faction") or None
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        return result

    if label == "status-effect":
        if not is_update:
            return {
                "name": data["name"],
                "type": data.get("type", ""),
                "effect": data.get("effect", ""),
                "remark": data.get("remark", ""),
            }

        result = {"name": data["name"]}
        if "type" in data:
            result["type"] = data.get("type", "")
        if "effect" in data:
            result["effect"] = data.get("effect", "")
        if "remark" in data:
            result["remark"] = data.get("remark", "")
        return result

    if label == "noble-phantasm":
        if not is_update:
            return {
                "name": data["name"],
                "character": data.get("character") or None,
                "is_global": data.get("is_global", True),
                "lore": data.get("lore", ""),
                "effects": data.get("effects", []),
                "skills": data.get("skills", []),
            }

        result = {"name": data["name"]}
        if "character" in data:
            result["character"] = data.get("character") or None
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "effects" in data:
            result["effects"] = data.get("effects", [])
        if "skills" in data:
            result["skills"] = data.get("skills", [])
        return result

    if label == "howlkin":
        raw_stats = data.get("basic_stats") if "basic_stats" in data else {}
        stats = {}
        if isinstance(raw_stats, dict):
            stats = raw_stats
        elif isinstance(raw_stats, list):
            for entry in raw_stats:
                if not isinstance(entry, dict):
                    continue
                name = entry.get("stat") or entry.get("name") or ""
                value = entry.get("value")
                if not name:
                    continue
                try:
                    parsed = float(value)
                    value = int(parsed) if parsed.is_integer() else parsed
                except (TypeError, ValueError):
                    pass
                stats[name] = value

        raw_effects = (
            data.get("passive_effects")
            if "passive_effects" in data
            else data.get("passive_effect")
        )
        if isinstance(raw_effects, list):
            passive_effects = [str(e) for e in raw_effects if e]
        elif isinstance(raw_effects, str) and raw_effects:
            passive_effects = [raw_effects]
        else:
            passive_effects = []

        if not is_update:
            return {
                "name": data["name"],
                "quality": data.get("quality", ""),
                "basic_stats": stats,
                "passive_effects": passive_effects,
            }

        result = {"name": data["name"]}
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "basic_stats" in data:
            result["basic_stats"] = stats
        if "passive_effects" in data or "passive_effect" in data:
            result["passive_effects"] = passive_effects
        return result

    if label == "resource":
        if not is_update:
            return {
                "name": data["name"],
                "quality": data.get("quality") or "",
                "description": data.get("description", ""),
                "category": data.get("category", ""),
            }

        result = {"name": data["name"]}
        if "quality" in data:
            result["quality"] = data.get("quality") or ""
        if "description" in data:
            result["description"] = data.get("description", "")
        if "category" in data:
            result["category"] = data.get("category", "")
        return result

    if label == "faction":
        if not is_update:
            return {
                "name": data["name"],
                "wyrm": data.get("wyrm", ""),
                "description": data.get("description", ""),
                "recommended_artifacts": _normalize_string_list(
                    data.get("recommended_artifacts", [])
                ),
            }

        result = {"name": data["name"]}
        if "wyrm" in data:
            result["wyrm"] = data.get("wyrm", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "recommended_artifacts" in data:
            result["recommended_artifacts"] = _normalize_string_list(
                data.get("recommended_artifacts", [])
            )
        return result

    if label == "links":
        if not is_update:
            return {
                "icon": data.get("icon", ""),
                "application": data.get("application", ""),
                "name": data["name"],
                "description": data.get("description", ""),
                "link": data["link"],
            }

        result = {"name": data["name"]}
        if "icon" in data:
            result["icon"] = data.get("icon", "")
        if "application" in data:
            result["application"] = data.get("application", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "link" in data:
            result["link"] = data.get("link")
        return result

    if label == "character":
        recommended_gear_input = data.get("recommended_gear")
        recommended_gear = None
        if isinstance(recommended_gear_input, dict):
            normalized_gear = {
                "headgear": str(
                    recommended_gear_input.get("headgear", "") or ""
                ).strip(),
                "chestplate": str(
                    recommended_gear_input.get("chestplate", "") or ""
                ).strip(),
                "bracers": str(recommended_gear_input.get("bracers", "") or "").strip(),
                "boots": str(recommended_gear_input.get("boots", "") or "").strip(),
                "weapon": str(recommended_gear_input.get("weapon", "") or "").strip(),
                "accessory": str(
                    recommended_gear_input.get("accessory", "") or ""
                ).strip(),
            }
            if any(normalized_gear.values()):
                recommended_gear = normalized_gear

        if not is_update:
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
                "recommended_gear": recommended_gear,
                "recommended_subclasses": _split_csv_list(
                    data.get("recommended_subclasses", [])
                ),
            }

        result = {"name": data["name"]}
        if "title" in data:
            result["title"] = data.get("title", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "character_class" in data:
            result["character_class"] = data.get("character_class", "")
        if "factions" in data:
            result["factions"] = _split_csv_list(data.get("factions", []))
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        if "subclasses" in data:
            result["subclasses"] = _split_csv_list(data.get("subclasses", []))
        if "height" in data:
            result["height"] = data.get("height", "")
        if "weight" in data:
            result["weight"] = data.get("weight", "")
        if "origin" in data:
            result["origin"] = data.get("origin", "")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "quote" in data:
            result["quote"] = data.get("quote", "")
        if "talent" in data:
            result["talent"] = data.get("talent")
        if "skills" in data:
            result["skills"] = data.get("skills", [])
        if "noble_phantasm" in data:
            result["noble_phantasm"] = data.get("noble_phantasm") or ""
        if "recommended_gear" in data:
            result["recommended_gear"] = recommended_gear
        if "recommended_subclasses" in data:
            result["recommended_subclasses"] = _split_csv_list(
                data.get("recommended_subclasses", [])
            )
        return result

    if label == "tier-list":
        if not is_update:
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

        result = {"name": data["name"]}
        if "author" in data:
            result["author"] = data.get("author", "")
        if "content_type" in data:
            result["content_type"] = data.get("content_type", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "entries" in data:
            result["entries"] = [
                {
                    "character_name": e.get("character_name", ""),
                    "tier": e.get("tier", ""),
                    "note": e.get("note", ""),
                }
                for e in data.get("entries", [])
            ]
        return result

    if label == "team":
        if not is_update:
            return {
                "name": data["name"],
                "author": data.get("author", ""),
                "content_type": data.get("content_type", ""),
                "description": data.get("description", ""),
                "faction": data.get("faction", ""),
                "members": [
                    {
                        "character_name": m.get("character_name", ""),
                        "overdrive_order": _coerce_optional_int(
                            m.get("overdrive_order")
                        ),
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
                    "dragons_call": (data.get("wyrmspells") or {}).get(
                        "dragons_call", ""
                    )
                    or str(data.get("dragons_call_wyrmspell", "") or ""),
                },
            }

        result = {"name": data["name"]}
        if "author" in data:
            result["author"] = data.get("author", "")
        if "content_type" in data:
            result["content_type"] = data.get("content_type", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "faction" in data:
            result["faction"] = data.get("faction", "")
        if "members" in data:
            result["members"] = [
                {
                    "character_name": m.get("character_name", ""),
                    "overdrive_order": _coerce_optional_int(m.get("overdrive_order")),
                    "substitutes": _split_csv_list(m.get("substitutes", [])),
                    "note": m.get("note", ""),
                }
                for m in data.get("members", [])
            ]

        wyrmspell_updates = {}
        if "wyrmspells" in data and isinstance(data.get("wyrmspells"), dict):
            for key in ["breach", "refuge", "wildcry", "dragons_call"]:
                if key in data["wyrmspells"]:
                    wyrmspell_updates[key] = str(data["wyrmspells"].get(key, "") or "")
        if "breach_wyrmspell" in data:
            wyrmspell_updates["breach"] = str(data.get("breach_wyrmspell", "") or "")
        if "refuge_wyrmspell" in data:
            wyrmspell_updates["refuge"] = str(data.get("refuge_wyrmspell", "") or "")
        if "wildcry_wyrmspell" in data:
            wyrmspell_updates["wildcry"] = str(data.get("wildcry_wyrmspell", "") or "")
        if "dragons_call_wyrmspell" in data:
            wyrmspell_updates["dragons_call"] = str(
                data.get("dragons_call_wyrmspell", "") or ""
            )
        if wyrmspell_updates:
            result["wyrmspells"] = wyrmspell_updates
        return result

    raise ValueError(f"Unknown label: {label}")


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


def _get_identity_key(label):
    """Return the field used to detect duplicates for a given label."""
    if label == "codes":
        return "code"
    return "name"


def update_json_file(label, data):
    """Upsert normalized data into the corresponding JSON data file."""
    filename = LABEL_JSON_FILE[label]
    path = DATA_DIR / filename
    if not path.exists():
        raise RuntimeError(f"Data file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        existing = json.load(f)

    identity_key = _get_identity_key(label)
    new_value = data.get(identity_key, "")
    matched_index = None
    if new_value:
        for index, item in enumerate(existing):
            if item.get(identity_key) == new_value:
                matched_index = index
                break

    is_update = matched_index is not None
    validate_data(label, data, is_update=is_update)
    entry = normalize_for_json(label, data, is_update=is_update)

    if is_update:
        existing[matched_index] = _deep_merge(existing[matched_index], entry)
        action = "updated"
    else:
        existing.append(entry)
        action = "added"

    sort_key = FILE_SORT_KEY.get(filename)
    if sort_key:
        existing.sort(key=sort_key)

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

    # Detect label from title prefix
    prefix_to_label = {
        "[Code]": "codes",
        "[Faction]": "faction",
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
    print(
        "JSON extracted. Validation and update mode will be resolved in file update step."
    )

    # Update the JSON data file
    json_file = update_json_file(label, data)
    set_output("json_file", json_file)
    set_output("label", label)
    set_output("processed", "true")

    print("Done!")


if __name__ == "__main__":
    main()
