"""Bump last_updated timestamps for data files after manual edits or model migrations.

Compares each entry against the committed version in git and only bumps
last_updated for entries where something actually changed (ignoring
last_updated itself). New entries (not yet committed) are always bumped.

Usage:
    # Bump all timestamped files:
    python -m backend.bump_timestamps

    # Bump specific files only:
    python -m backend.bump_timestamps characters.json artifacts.json
"""

import json
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"

# Files that carry last_updated timestamps on their entries.
TIMESTAMPED_FILES = {
    "artifacts.json",
    "wyrmspells.json",
    "noble_phantasm.json",
    "resources.json",
    "characters.json",
    "subclasses.json",
    "howlkins.json",
    "golden_alliances.json",
    "gear.json",
    "gear_sets.json",
    "teams.json",
    "changelog.json",
}

# Identity key used to match entries across current vs. committed versions.
IDENTITY_KEY: dict[str, str] = {
    "changelog.json": "version",
    "codes.json": "code",
}
_DEFAULT_IDENTITY = "name"


def _identity_key(filename: str) -> str:
    return IDENTITY_KEY.get(filename, _DEFAULT_IDENTITY)


def _without_timestamp(entry: dict) -> dict:
    """Return entry with last_updated stripped, for comparison purposes."""
    return {k: v for k, v in entry.items() if k != "last_updated"}


def _load_committed(filename: str) -> dict[str, dict]:
    """Load the HEAD-committed version of a data file as {identity: entry}.

    Returns an empty dict if the file isn't tracked or git isn't available.
    """
    git_path = f"data/{filename}"
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{git_path}"],
            capture_output=True,
            cwd=ROOT_DIR,
        )
    except FileNotFoundError:
        return {}  # git not available

    if result.returncode != 0:
        return {}  # file not committed yet

    try:
        entries = json.loads(result.stdout.decode("utf-8"))
    except json.JSONDecodeError:
        return {}

    key = _identity_key(filename)
    return {entry.get(key): entry for entry in entries if isinstance(entry, dict)}


def bump_file(filename: str, now: int) -> int:
    path = DATA_DIR / filename
    if not path.exists():
        print(f"  SKIP {filename}: file not found")
        return 0

    with open(path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    committed = _load_committed(filename)
    id_key = _identity_key(filename)

    count = 0
    for entry in entries:
        if not isinstance(entry, dict):
            continue

        identity = entry.get(id_key)
        committed_entry = committed.get(identity)

        if committed_entry is None:
            # New entry not yet in git — always bump.
            changed = True
        elif "last_updated" not in entry:
            # Entry exists in git but has no timestamp field — skip.
            continue
        else:
            changed = _without_timestamp(entry) != _without_timestamp(committed_entry)

        if changed:
            entry["last_updated"] = now
            count += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
        f.write("\n")

    skipped = sum(1 for e in entries if isinstance(e, dict) and "last_updated" in e) - count
    parts = [f"bumped {count}"]
    if skipped:
        parts.append(f"skipped {skipped} unchanged")
    print(f"  {filename}: {', '.join(parts)}")
    return count


def main() -> None:
    targets = sys.argv[1:] or sorted(TIMESTAMPED_FILES)
    now = int(time.time())
    ts_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(now))
    print(f"Bumping timestamps to {now} ({ts_str})")

    total = 0
    for filename in targets:
        total += bump_file(filename, now)

    print(f"Done. Updated {total} entr{'y' if total == 1 else 'ies'}.")


if __name__ == "__main__":
    main()
