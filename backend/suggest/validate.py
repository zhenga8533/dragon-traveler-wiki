"""Validation logic for GitHub Issue suggestion data."""

from ..sort_keys import (
    CLASS_ORDER,
    QUALITY_ORDER,
    RESOURCE_CATEGORY_ORDER,
    STATE_ORDER,
    TIER_ORDER,
)
from .normalize import _normalize_string_list

VALID_CHARACTER_QUALITIES = set(QUALITY_ORDER)
VALID_CHARACTER_CLASSES = set(CLASS_ORDER)
VALID_STATUS_EFFECT_TYPES = set(STATE_ORDER)
VALID_RESOURCE_CATEGORIES = set(RESOURCE_CATEGORY_ORDER)
DEFAULT_VALID_TIERS = set(TIER_ORDER)

VALID_WYRMSPELL_TYPES = {"Breach", "Refuge", "Wildcry", "Dragon's Call"}


def validate_data(label, data, required_fields, is_update=False, identity_key="name"):
    """Validate suggestion data for create or update operations."""
    if not isinstance(data, dict):
        raise ValueError("Suggestion JSON must be an object.")

    if is_update:
        required = [identity_key]
    else:
        required = required_fields.get(label, [])
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields for '{label}': {', '.join(missing)}")

    if label == "links":
        if "link" in data:
            from urllib.parse import urlparse
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
        if "tiers" in data:
            tiers_raw = data.get("tiers")
            if tiers_raw is not None:
                if not isinstance(tiers_raw, list):
                    raise ValueError("'tiers' must be an array.")
                for i, tier in enumerate(tiers_raw):
                    if isinstance(tier, dict):
                        if not str(tier.get("name", "")).strip():
                            raise ValueError(f"Tier definition {i} is missing 'name'.")
                    elif isinstance(tier, str):
                        if not tier.strip():
                            raise ValueError(f"Tier definition {i} has an empty name.")
                    else:
                        raise ValueError(
                            f"Tier definition {i} must be a string or object with 'name'."
                        )

        if "entries" in data:
            entries = data.get("entries", [])
            if not isinstance(entries, list) or len(entries) == 0:
                raise ValueError("Tier list must have at least one entry.")

            custom_tiers_raw = data.get("tiers")
            if custom_tiers_raw and isinstance(custom_tiers_raw, list):
                valid_tiers = set()
                for t in custom_tiers_raw:
                    if isinstance(t, dict):
                        name = str(t.get("name", "")).strip()
                        if name:
                            valid_tiers.add(name)
                    elif isinstance(t, str) and t.strip():
                        valid_tiers.add(t.strip())
                if not valid_tiers:
                    valid_tiers = DEFAULT_VALID_TIERS
            else:
                valid_tiers = DEFAULT_VALID_TIERS

            for i, entry in enumerate(entries):
                if not entry.get("character_name"):
                    raise ValueError(f"Entry {i} is missing 'character_name'.")
                if (
                    entry.get("character_quality")
                    and entry["character_quality"] not in VALID_CHARACTER_QUALITIES
                ):
                    raise ValueError(
                        f"Entry {i} has invalid character_quality '{entry['character_quality']}'. "
                        f"Expected one of: {', '.join(sorted(VALID_CHARACTER_QUALITIES))}"
                    )
                if not entry.get("tier"):
                    raise ValueError(f"Entry {i} is missing 'tier'.")
                if entry["tier"] not in valid_tiers:
                    raise ValueError(
                        f"Entry {i} has invalid tier '{entry['tier']}'. "
                        f"Expected one of: {', '.join(sorted(valid_tiers))}"
                    )

    if label == "team":
        if "members" in data:
            members = data.get("members", [])
            if not isinstance(members, list) or len(members) == 0:
                raise ValueError("Team must have at least one member.")
            for i, m in enumerate(members):
                if not m.get("character_name"):
                    raise ValueError(f"Member {i} is missing 'character_name'.")
                if (
                    m.get("character_quality")
                    and m["character_quality"] not in VALID_CHARACTER_QUALITIES
                ):
                    raise ValueError(
                        f"Member {i} has invalid character_quality '{m['character_quality']}'. "
                        f"Expected one of: {', '.join(sorted(VALID_CHARACTER_QUALITIES))}"
                    )

    if label == "faction" and "recommended_artifacts" in data:
        artifacts = _normalize_string_list(data.get("recommended_artifacts"))
        if len(artifacts) == 0:
            raise ValueError("Faction must include at least one recommended artifact.")

    if label == "subclass" and not is_update:
        if not (data.get("class") or data.get("character_class")):
            raise ValueError("Missing required fields for 'subclass': class")
