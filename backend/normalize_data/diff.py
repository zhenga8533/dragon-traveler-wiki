"""Structured diff helpers for tracking field-level changes between JSON entries."""

from collections.abc import Callable

_SCALAR_TYPES = (str, int, float, bool)


def _character_entry_identity(item: dict) -> str:
    """Composite label for character entries: 'Name (Quality)' when quality is present."""
    name = item.get("character_name", "")
    quality = item.get("character_quality")
    return f"{name} ({quality})" if quality else name


def _noble_phantasm_effect_identity(item: dict) -> str:
    """Identity for NP effect rows: prefer tier_level, fall back to description prefix."""
    tier_level = item.get("tier_level")
    if tier_level is not None:
        return str(tier_level)
    return item.get("description", "")[:80]


# Per-file, per-field config for structured array diffing.
# "identity": callable or str key used to match items across old/new arrays.
# "value": optional field whose changes are shown as "old → new" per item.
_ARRAY_DIFF_CFG: dict[tuple[str, str], dict] = {
    # tier-lists.json
    ("tier-lists.json", "entries"): {"identity": _character_entry_identity, "value": "tier"},
    ("tier-lists.json", "tiers"): {"identity": "name", "value": "note"},
    # teams.json
    ("teams.json", "members"): {"identity": _character_entry_identity, "value": None},
    ("teams.json", "bench"): {"identity": _character_entry_identity, "value": None},
    # characters.json
    ("characters.json", "skills"): {"identity": "name", "value": None},
    ("characters.json", "talent_levels"): {"identity": "level", "value": "effect"},
    # artifacts.json
    ("artifacts.json", "effect"): {"identity": "level", "value": "description"},
    ("artifacts.json", "treasures"): {"identity": "name", "value": None},
    # golden_alliances.json
    ("golden_alliances.json", "effects"): {"identity": "level", "value": None},
    # noble_phantasm.json
    ("noble_phantasm.json", "effects"): {"identity": _noble_phantasm_effect_identity, "value": None},
    ("noble_phantasm.json", "skills"): {"identity": "level", "value": "description"},
}


def _array_field_diff(
    old_arr: list,
    new_arr: list,
    identity: str | Callable[[dict], str],
    value_key: str | None,
    filename: str = "",
) -> dict:
    """Return a structured diff for an array of dicts keyed by an identity field."""

    def get_id(item: dict) -> str:
        if callable(identity):
            return identity(item)
        return str(item.get(identity, ""))

    old_by_id = {get_id(item): item for item in old_arr if isinstance(item, dict)}
    new_by_id = {get_id(item): item for item in new_arr if isinstance(item, dict)}
    result: dict = {}
    added = sorted(set(new_by_id) - set(old_by_id))
    removed = sorted(set(old_by_id) - set(new_by_id))
    if added:
        result["added"] = added
    if removed:
        result["removed"] = removed
    shared = sorted(set(old_by_id) & set(new_by_id))
    if value_key:
        changed = {
            ident: {"old": old_by_id[ident].get(value_key), "new": new_by_id[ident].get(value_key)}
            for ident in shared
            if old_by_id[ident].get(value_key) is not None
            and old_by_id[ident].get(value_key) != new_by_id[ident].get(value_key)
        }
        if changed:
            result["changed"] = changed
    else:
        modified: dict = {}
        for ident in shared:
            old_item, new_item = old_by_id[ident], new_by_id[ident]
            if any(old_item.get(k) != new_item.get(k) for k in old_item):
                modified[ident] = _dict_field_diff(filename, old_item, new_item) if filename else {}
        if modified:
            result["modified"] = modified
    return result


def _dict_field_diff(filename: str, old_dict: dict, new_dict: dict) -> dict:
    """Recursively diff two dicts, capturing scalar leaf changes and known sub-arrays."""
    result: dict = {}
    all_keys = set(old_dict.keys()) | set(new_dict.keys())
    for key in sorted(all_keys):
        if key not in old_dict:
            continue  # genuinely new key — structural addition, not a change
        old_val = old_dict[key]
        new_val = new_dict.get(key)
        if old_val == new_val:
            continue
        if (old_val is None or isinstance(old_val, _SCALAR_TYPES)) and (new_val is None or isinstance(new_val, _SCALAR_TYPES)):
            diff: dict = {}
            if old_val is not None:
                diff["old"] = old_val
            if new_val is not None:
                diff["new"] = new_val
            result[key] = diff
        elif isinstance(old_val, dict) and isinstance(new_val, dict):
            sub = _dict_field_diff(filename, old_val, new_val)
            if sub:
                result[key] = sub
        elif isinstance(old_val, list) and isinstance(new_val, list):
            cfg = _ARRAY_DIFF_CFG.get((filename, key))
            if cfg and isinstance(old_val, list) and isinstance(new_val, list):
                sub = _array_field_diff(old_val, new_val, cfg["identity"], cfg.get("value"), filename)  # type: ignore[arg-type]
                if sub:
                    result[key] = sub
            elif all(isinstance(x, _SCALAR_TYPES) for x in old_val) and all(isinstance(x, _SCALAR_TYPES) for x in new_val):
                old_set, new_set = set(map(str, old_val)), set(map(str, new_val))
                sub = {}
                added = sorted(new_set - old_set)
                removed = sorted(old_set - new_set)
                if added:
                    sub["added"] = added
                if removed:
                    sub["removed"] = removed
                if sub:
                    result[key] = sub
        else:
            d: dict = {}
            if old_val is not None:
                d["old"] = old_val
            if new_val is not None:
                d["new"] = new_val
            if d:
                result[key] = d
    return result


def compute_field_diffs(filename: str, old: dict, new: dict, meta_keys: frozenset[str]) -> dict[str, dict]:
    """Return {field: diff_info} for fields that differ.

    - Scalar fields (str/int/float/bool): {"old": ..., "new": ...}
    - Known array fields: {"added": [...], "removed": [...], "changed"/"modified": {...}}
    - Dict fields: recursively diffed for scalar leaf changes
    - Removed/type-changed complex fields: {"old": ..., "new": ...} with the raw values
    """
    diffs: dict[str, dict] = {}
    all_keys = set(old.keys()) | set(new.keys())
    for key in sorted(all_keys - meta_keys):
        old_val = old.get(key)
        new_val = new.get(key)
        # Skip if field didn't exist before — new attributes are structural additions, not changes
        if old_val is not None and old_val != new_val:
            cfg = _ARRAY_DIFF_CFG.get((filename, key))
            if cfg and isinstance(old_val, list) and isinstance(new_val, list):
                diff = _array_field_diff(old_val, new_val, cfg["identity"], cfg.get("value"), filename)  # type: ignore[arg-type]
            elif (
                isinstance(old_val, list)
                and isinstance(new_val, list)
                and all(isinstance(x, _SCALAR_TYPES) for x in old_val)
                and all(isinstance(x, _SCALAR_TYPES) for x in new_val)
            ):
                old_set, new_set = set(map(str, old_val)), set(map(str, new_val))
                diff = {}
                added = sorted(new_set - old_set)
                removed = sorted(old_set - new_set)
                if added:
                    diff["added"] = added
                if removed:
                    diff["removed"] = removed
            elif isinstance(old_val, dict) and isinstance(new_val, dict):
                diff = _dict_field_diff(filename, old_val, new_val)
            else:
                diff = {}
                if old_val is not None:
                    diff["old"] = old_val
                if new_val is not None:
                    diff["new"] = new_val
            diffs[key] = diff
    return diffs
