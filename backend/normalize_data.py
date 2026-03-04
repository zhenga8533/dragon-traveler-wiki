"""Normalize data files by sorting entries and bumping last_updated timestamps.

This script combines deterministic entry sorting (where a sort key exists),
timestamp updates for changed entries (relative to HEAD), and external
change history tracking in data/changes/.

Usage:
    # Sort + bump + track changes for all data files:
    python -m backend.normalize_data

    # Sort + bump specific files:
    python -m backend.normalize_data characters.json artifacts.json

    # Only bump timestamps:
    python -m backend.normalize_data --timestamps-only

    # Only sort:
    python -m backend.normalize_data --sort-only
"""

import argparse
import json
import subprocess
import time
from collections.abc import Callable
from pathlib import Path

from .sort_keys import FILE_SORT_KEY

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"

# Identity selector used to match entries across current vs. committed versions.
IdentitySelector = str | Callable[[dict], str | None]


def _character_identity(entry: dict) -> str | None:
    name = entry.get("name")
    quality = entry.get("quality")
    if name is None or quality is None:
        return None
    return f"{name}__{quality}"


IDENTITY_KEY: dict[str, IdentitySelector] = {
    "changelog.json": "version",
    "codes.json": "code",
    "characters.json": _character_identity,
}
_DEFAULT_IDENTITY = "name"


def _identity_value(filename: str, entry: dict) -> str | None:
    selector = IDENTITY_KEY.get(filename, _DEFAULT_IDENTITY)
    if isinstance(selector, str):
        identity = entry.get(selector)
        return str(identity) if identity is not None else None
    return selector(entry)


_META_KEYS = {"last_updated"}

CHANGES_DIR = DATA_DIR / "changes"


def _load_changes_file(filename: str) -> dict:
    """Load existing changes file from data/changes/<filename> or return {}."""
    path = CHANGES_DIR / filename
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_changes_file(filename: str, data: dict) -> None:
    """Write changes data to data/changes/<filename>, creating dir if needed."""
    CHANGES_DIR.mkdir(parents=True, exist_ok=True)
    path = CHANGES_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _without_meta(entry: dict) -> dict:
    return {k: v for k, v in entry.items() if k not in _META_KEYS}


_SCALAR_TYPES = (str, int, float, bool)


def _character_entry_identity(item: dict) -> str:
    """Composite label for character entries: 'Name (Quality)' when quality is present."""
    name = item.get("character_name", "")
    quality = item.get("character_quality")
    return f"{name} ({quality})" if quality else name


# Per-file, per-field config for structured array diffing.
# "identity": callable or str key used to match items across old/new arrays.
# "value": optional field whose changes are shown as "old → new" per item.
_ARRAY_DIFF_CFG: dict[tuple[str, str], dict] = {
    ("tier-lists.json", "entries"): {"identity": _character_entry_identity, "value": "tier"},
    ("teams.json", "members"): {"identity": _character_entry_identity, "value": None},
    ("teams.json", "bench"): {"identity": _character_entry_identity, "value": None},
}


def _array_field_diff(
    old_arr: list,
    new_arr: list,
    identity: str | Callable[[dict], str],
    value_key: str | None,
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
            # Only track if the field existed before (not a new attribute)
            if old_by_id[ident].get(value_key) is not None
            and old_by_id[ident].get(value_key) != new_by_id[ident].get(value_key)
        }
        if changed:
            result["changed"] = changed
    else:
        # Only flag modified if a field that existed in the OLD item changed value
        modified = [
            ident for ident in shared
            if any(
                old_by_id[ident].get(k) != new_by_id[ident].get(k)
                for k in old_by_id[ident]
            )
        ]
        if modified:
            result["modified"] = modified
    return result


def _compute_field_diffs(filename: str, old: dict, new: dict) -> dict[str, dict]:
    """Return {field: diff_info} for fields that differ.

    - Scalar fields (str/int/float/bool): {"old": ..., "new": ...}
    - Known array fields: {"added": [...], "removed": [...], "changed"/"modified": {...}}
    - Other complex fields: {} (changed but values not stored)
    """
    diffs: dict[str, dict] = {}
    all_keys = set(old.keys()) | set(new.keys())
    for key in sorted(all_keys - _META_KEYS):
        old_val = old.get(key)
        new_val = new.get(key)
        # Skip if field didn't exist before — new attributes are structural additions, not changes
        if old_val is not None and old_val != new_val:
            cfg = _ARRAY_DIFF_CFG.get((filename, key))
            if cfg and isinstance(old_val, list) and isinstance(new_val, list):
                diff = _array_field_diff(old_val, new_val, cfg["identity"], cfg.get("value"))  # type: ignore[arg-type]
            elif (
                isinstance(old_val, list)
                and isinstance(new_val, list)
                and all(isinstance(x, _SCALAR_TYPES) for x in old_val)
                and all(isinstance(x, _SCALAR_TYPES) for x in new_val)
            ):
                # Primitive string/number arrays: set-based diff
                old_set, new_set = set(map(str, old_val)), set(map(str, new_val))
                diff = {}
                added = sorted(new_set - old_set)
                removed = sorted(old_set - new_set)
                if added:
                    diff["added"] = added
                if removed:
                    diff["removed"] = removed
            else:
                diff = {}
                if isinstance(old_val, _SCALAR_TYPES):
                    diff["old"] = old_val
                if isinstance(new_val, _SCALAR_TYPES):
                    diff["new"] = new_val
            diffs[key] = diff
    return diffs


def _has_any_object_entries(entries: list) -> bool:
    return any(isinstance(entry, dict) for entry in entries)


def _extract_entries(
    payload: object,
) -> tuple[list | None, Callable[[list], None] | None]:
    """Extract a mutable entries list and updater from supported payload shapes.

    Supported forms:
    - Top-level list
    - Top-level object with one of: entries/items/data/records/values (as list)
    """
    if isinstance(payload, list):
        return payload, None

    if isinstance(payload, dict):
        for key in ("entries", "items", "data", "records", "values"):
            value = payload.get(key)
            if isinstance(value, list):
                return value, lambda updated, k=key: payload.__setitem__(k, updated)

    return None, None


def _load_committed(filename: str) -> dict[str, dict]:
    """Load HEAD-committed version of a file as {identity: entry}."""
    git_path = f"data/{filename}"
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{git_path}"],
            capture_output=True,
            cwd=ROOT_DIR,
        )
    except FileNotFoundError:
        return {}

    if result.returncode != 0:
        return {}

    try:
        payload = json.loads(result.stdout.decode("utf-8"))
    except json.JSONDecodeError:
        return {}

    entries, _ = _extract_entries(payload)
    if entries is None:
        return {}

    committed: dict[str, dict] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        identity = _identity_value(filename, entry)
        if identity is None:
            continue
        committed[identity] = entry
    return committed


def _resolve_targets(files: list[str]) -> list[str]:
    if files:
        return files

    return sorted(path.name for path in DATA_DIR.glob("*.json"))


def normalize_file(filename: str, now: int, do_sort: bool, do_timestamps: bool) -> dict:
    path = DATA_DIR / filename
    result = {
        "filename": filename,
        "exists": False,
        "sorted": False,
        "timestamped": False,
        "bumped": 0,
        "skipped_unchanged": 0,
    }

    if not path.exists():
        return result

    result["exists"] = True

    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    entries, update_entries = _extract_entries(payload)
    if entries is None:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return result

    should_timestamp = do_timestamps and _has_any_object_entries(entries)

    if should_timestamp:
        result["timestamped"] = True
        committed = _load_committed(filename)
        for entry in entries:
            if not isinstance(entry, dict):
                continue

            identity = _identity_value(filename, entry)
            committed_entry = committed.get(identity) if identity is not None else None

            if committed_entry is None:
                changed = True
            else:
                changed = _without_meta(entry) != _without_meta(committed_entry)

            if changed or "last_updated" not in entry:
                entry["last_updated"] = now
                result["bumped"] += 1

        # Write external changes file
        changes_data = _load_changes_file(filename)

        # Build set of current identities
        current_identities: set[str] = set()
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            identity = _identity_value(filename, entry)
            if identity is not None:
                current_identities.add(identity)

        # Detect removals: in committed (or previously tracked) but not in current
        for identity in set(committed.keys()) | set(changes_data.keys()):
            if identity in current_identities:
                continue
            if identity not in changes_data:
                # Was in committed but never tracked — initialise with removal
                changes_data[identity] = {
                    "added": (
                        committed[identity].get("last_updated", now)
                        if identity in committed
                        else now
                    ),
                    "changes": [{"timestamp": now, "type": "removed"}],
                }
            else:
                # Already tracked — only record removal if not already removed
                prev_changes = changes_data[identity]["changes"]
                already_removed = (
                    prev_changes and prev_changes[-1].get("type") == "removed"
                )
                if not already_removed:
                    prev_changes.append({"timestamp": now, "type": "removed"})

        # Process current entries: additions, re-additions, and field changes
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            identity = _identity_value(filename, entry)
            if identity is None:
                continue

            if identity not in changes_data:
                # Brand new entity
                changes_data[identity] = {"added": now, "changes": []}
            else:
                # Existing history — check if last event was a removal (re-addition)
                prev_changes = changes_data[identity]["changes"]
                was_removed = prev_changes and prev_changes[-1].get("type") == "removed"
                if was_removed:
                    prev_changes.append({"timestamp": now, "type": "readded"})

            committed_entry = committed.get(identity)
            if committed_entry is not None:
                if _without_meta(entry) != _without_meta(committed_entry):
                    field_diffs = _compute_field_diffs(filename, committed_entry, entry)
                    if field_diffs:
                        changes_data[identity]["changes"].append(
                            {"timestamp": now, "fields": field_diffs}
                        )

        _save_changes_file(filename, changes_data)

        timestamped_in_file = sum(
            1
            for entry in entries
            if isinstance(entry, dict) and "last_updated" in entry
        )
        result["skipped_unchanged"] = max(0, timestamped_in_file - result["bumped"])

    if do_sort:
        sort_key = FILE_SORT_KEY.get(filename)
        if sort_key:
            entries.sort(key=sort_key)
            result["sorted"] = True

    if update_entries is not None:
        update_entries(entries)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return result


def run(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Sort data files and/or bump last_updated timestamps."
    )
    parser.add_argument("files", nargs="*", help="JSON files under data/")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--timestamps-only",
        action="store_true",
        help="Only update last_updated fields (no sorting)",
    )
    mode.add_argument(
        "--sort-only",
        action="store_true",
        help="Only sort files with configured sort keys",
    )
    args = parser.parse_args(argv)

    do_sort = not args.timestamps_only
    do_timestamps = not args.sort_only

    targets = _resolve_targets(args.files)
    now = int(time.time())
    ts_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(now))
    print(f"Normalizing data at {now} ({ts_str})")
    print(
        "Mode: "
        + (
            "sort + timestamps"
            if do_sort and do_timestamps
            else "sort only" if do_sort else "timestamps only"
        )
    )

    total_bumped = 0
    total_sorted = 0

    for filename in targets:
        result = normalize_file(
            filename, now, do_sort=do_sort, do_timestamps=do_timestamps
        )
        if not result["exists"]:
            print(f"  SKIP {filename}: file not found")
            continue

        total_bumped += result["bumped"]
        total_sorted += 1 if result["sorted"] else 0

        parts = []
        if result["sorted"]:
            parts.append("sorted")
        if result["timestamped"]:
            parts.append(f"bumped {result['bumped']}")
            if result["skipped_unchanged"]:
                parts.append(f"skipped {result['skipped_unchanged']} unchanged")
        if not parts:
            parts.append("no-op")

        print(f"  {filename}: {', '.join(parts)}")

    print(
        f"Done. Sorted {total_sorted} file{'s' if total_sorted != 1 else ''}; "
        f"updated {total_bumped} timestamp entr{'ies' if total_bumped != 1 else 'y'}."
    )
    return 0


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
