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

from ..sort_keys import FILE_SORT_KEY
from .diff import compute_field_diffs

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data"
CHANGES_DIR = DATA_DIR / "changes"

# Identity selector used to match entries across current vs. committed versions.
IdentitySelector = str | Callable[[dict], str | None]

_META_KEYS = frozenset({"last_updated"})


def _change_signature(change: dict) -> dict:
    return {key: value for key, value in change.items() if key != "timestamp"}


def _changes_equivalent(left: dict, right: dict) -> bool:
    return _change_signature(left) == _change_signature(right)


def _dedupe_change_list(changes: list[dict]) -> list[dict]:
    deduped: list[dict] = []
    for change in changes:
        if not isinstance(change, dict):
            continue
        if deduped and _changes_equivalent(deduped[-1], change):
            continue
        deduped.append(change)
    return deduped


def _dedupe_changes_data(data: dict) -> dict:
    normalized: dict = {}
    for identity, payload in data.items():
        if not isinstance(payload, dict):
            continue
        deduped_payload = dict(payload)
        raw_changes = payload.get("changes", [])
        if isinstance(raw_changes, list):
            deduped_payload["changes"] = _dedupe_change_list(raw_changes)
        else:
            deduped_payload["changes"] = []
        normalized[identity] = deduped_payload
    return normalized


def _append_change(changes: list[dict], change: dict) -> bool:
    if changes and _changes_equivalent(changes[-1], change):
        return False
    changes.append(change)
    return True


def _character_identity(entry: dict) -> str | None:
    name = entry.get("name")
    quality = entry.get("quality")
    if name is None or quality is None:
        return None
    return f"{name}__{quality}"


def _normalize_entry_for_compare(filename: str, entry: dict) -> dict:
    normalized = dict(entry)
    if filename == "events.json":
        if "tag" not in normalized and "badge" in normalized:
            normalized["tag"] = normalized["badge"]
        for deprecated_key in ("badge", "source", "tag", "active"):
            normalized.pop(deprecated_key, None)
    return normalized


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


# ---------------------------------------------------------------------------
# Changes file I/O
# ---------------------------------------------------------------------------


def _load_changes_file(filename: str) -> dict:
    """Load existing changes file from data/changes/<filename> or return {}."""
    path = CHANGES_DIR / filename
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return _dedupe_changes_data(json.load(f))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_changes_file(filename: str, data: dict) -> None:
    """Write changes data to data/changes/<filename>, creating dir if needed."""
    CHANGES_DIR.mkdir(parents=True, exist_ok=True)
    path = CHANGES_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_dedupe_changes_data(data), f, indent=2, ensure_ascii=False)
        f.write("\n")


# ---------------------------------------------------------------------------
# Entry helpers
# ---------------------------------------------------------------------------


def _without_meta(filename: str, entry: dict) -> dict:
    normalized = _normalize_entry_for_compare(filename, entry)
    return {k: v for k, v in normalized.items() if k not in _META_KEYS}


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


# ---------------------------------------------------------------------------
# Core normalization
# ---------------------------------------------------------------------------


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

    try:
        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {filename}: {exc}") from exc

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
                changed = _without_meta(filename, entry) != _without_meta(
                    filename, committed_entry
                )

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
                changes_data[identity] = {
                    "added": (
                        committed[identity].get("last_updated", now)
                        if identity in committed
                        else now
                    ),
                    "changes": [{"timestamp": now, "type": "removed"}],
                }
            else:
                prev_changes = changes_data[identity]["changes"]
                already_removed = (
                    prev_changes and prev_changes[-1].get("type") == "removed"
                )
                if not already_removed:
                    _append_change(prev_changes, {"timestamp": now, "type": "removed"})

        # Process current entries: additions, re-additions, and field changes
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            identity = _identity_value(filename, entry)
            if identity is None:
                continue

            if identity not in changes_data:
                changes_data[identity] = {"added": now, "changes": []}
            else:
                prev_changes = changes_data[identity]["changes"]
                was_removed = prev_changes and prev_changes[-1].get("type") == "removed"
                if was_removed:
                    _append_change(prev_changes, {"timestamp": now, "type": "readded"})

            committed_entry = committed.get(identity)
            if committed_entry is not None:
                if _without_meta(filename, entry) != _without_meta(
                    filename, committed_entry
                ):
                    field_diffs = compute_field_diffs(
                        filename,
                        _normalize_entry_for_compare(filename, committed_entry),
                        _normalize_entry_for_compare(filename, entry),
                        _META_KEYS,
                    )
                    if field_diffs:
                        _append_change(
                            changes_data[identity]["changes"],
                            {"timestamp": now, "fields": field_diffs},
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


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


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
