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
from pathlib import Path

from .sort_keys import FILE_SORT_KEY

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"

# Identity key used to match entries across current vs. committed versions.
IDENTITY_KEY: dict[str, str] = {
    "changelog.json": "version",
    "codes.json": "code",
}
_DEFAULT_IDENTITY = "name"


def _identity_key(filename: str) -> str:
    return IDENTITY_KEY.get(filename, _DEFAULT_IDENTITY)


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


def _compute_field_diffs(old: dict, new: dict) -> dict[str, dict]:
    """Return {field: {"old": ..., "new": ...}} for fields that differ."""
    diffs: dict[str, dict] = {}
    all_keys = set(old.keys()) | set(new.keys())
    for key in sorted(all_keys - _META_KEYS):
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val:
            diff: dict = {}
            if old_val is not None:
                diff["old"] = old_val
            if new_val is not None:
                diff["new"] = new_val
            diffs[key] = diff
    return diffs


def _has_any_object_entries(entries: list) -> bool:
    return any(isinstance(entry, dict) for entry in entries)


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
        entries = json.loads(result.stdout.decode("utf-8"))
    except json.JSONDecodeError:
        return {}

    key = _identity_key(filename)
    committed: dict[str, dict] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        identity = entry.get(key)
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
        entries = json.load(f)

    if not isinstance(entries, list):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return result

    should_timestamp = do_timestamps and _has_any_object_entries(entries)

    if should_timestamp:
        result["timestamped"] = True
        committed = _load_committed(filename)
        id_key = _identity_key(filename)

        for entry in entries:
            if not isinstance(entry, dict):
                continue

            identity = entry.get(id_key)
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
            identity = entry.get(id_key)
            if identity is not None:
                current_identities.add(identity)

        # Detect removals: in committed (or previously tracked) but not in current
        for identity in set(committed.keys()) | set(changes_data.keys()):
            if identity in current_identities:
                continue
            if identity not in changes_data:
                # Was in committed but never tracked — initialise with removal
                changes_data[identity] = {
                    "added": committed[identity].get("last_updated", now)
                    if identity in committed
                    else now,
                    "changes": [{"timestamp": now, "type": "removed"}],
                }
            else:
                # Already tracked — only record removal if not already removed
                prev_changes = changes_data[identity]["changes"]
                already_removed = prev_changes and prev_changes[-1].get("type") == "removed"
                if not already_removed:
                    prev_changes.append({"timestamp": now, "type": "removed"})

        # Process current entries: additions, re-additions, and field changes
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            identity = entry.get(id_key)
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
                    field_diffs = _compute_field_diffs(committed_entry, entry)
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

    with open(path, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
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
