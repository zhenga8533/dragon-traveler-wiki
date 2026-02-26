# Backend

JSON data tooling for the Dragon Traveler Wiki.

The backend is responsible for validating, sorting, and updating files in `data/`.

## Setup

```bash
pip install -r requirements.txt
```

**Requirements:** Python 3.10+

## Scripts

### Suggestion Automation

Processes GitHub Issue payloads and upserts entries into the appropriate JSON file.
Automatically sets `last_updated` to the current Unix timestamp on every create or update.

```bash
python -m backend.suggest
```

### Normalize Data (Sort + Timestamps)

After manually editing data files, run this to apply deterministic sorting (where
configured) and refresh `last_updated` only for entries that actually changed
relative to the last git commit.

```bash
# Sort + bump all JSON data files:
python -m backend.normalize_data

# Sort + bump specific files only:
python -m backend.normalize_data characters.json artifacts.json

# Only bump timestamps:
python -m backend.normalize_data --timestamps-only

# Only sort:
python -m backend.normalize_data --sort-only
```

### Key Utilities

- `sort_keys.py` — shared deterministic sorting helpers
- `models/` — Pydantic models used for data validation

## Project Structure

```
backend/
├── suggest.py             # Issue suggestion processor (auto-sets last_updated)
├── normalize_data.py      # Sort data and refresh last_updated in one pass
├── sort_keys.py           # Deterministic sort-key helpers
├── requirements.txt       # Python dependencies
└── models/                # Pydantic data models
    ├── artifact.py
    ├── character.py
    ├── code.py
    ├── faction.py
    ├── gear.py
    ├── golden_alliance.py
    ├── howlkin.py
    ├── noble_phantasm.py
    ├── resource.py
    ├── subclass.py
    ├── status_effect.py
    ├── team.py
    ├── tier_list.py
    ├── useful_link.py
    └── wyrmspell.py
```

## Data Files

The backend reads from and writes to `data/`:

| File                    | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `characters.json`       | Character database                                          |
| `subclasses.json`       | Subclass definitions                                        |
| `noble_phantasm.json`   | Noble Phantasm data                                         |
| `factions.json`         | Faction definitions                                         |
| `artifacts.json`        | Artifact database                                           |
| `wyrmspells.json`       | Wyrmspell database                                          |
| `resources.json`        | Resource definitions                                        |
| `codes.json`            | Redemption codes                                            |
| `status-effects.json`   | Status effects                                              |
| `gear.json`             | Gear database                                               |
| `gear_sets.json`        | Gear set bonuses                                            |
| `howlkins.json`         | Howlkin database                                            |
| `golden_alliances.json` | Golden alliance sets                                        |
| `tier-lists.json`       | Community tier lists (supports custom tiers and tier notes) |
| `teams.json`            | Team compositions                                           |
| `useful-links.json`     | Community links                                             |
| `changelog.json`        | Site version history                                        |

## Issue Suggestion Automation

`python -m backend.suggest` supports these issue title prefixes:

- `[Code]`
- `[Faction]`
- `[Artifact]`
- `[Character]`
- `[Subclass]`
- `[Wyrmspell]`
- `[Noble Phantasm]`
- `[Status Effect]`
- `[Link]`
- `[Resource]`
- `[Howlkin]`
- `[Golden Alliance]`
- `[Gear]`
- `[Gear Set]`
- `[Tier List]`
- `[Team]`

## Tier List Schema

Tier lists support an optional `tiers` field that defines a custom ordered set of tiers with optional notes. If `tiers` is omitted, the default `S+/S/A/B/C/D` order is assumed.

```json
{
  "name": "My Tier List",
  "author": "username",
  "content_type": "All",
  "description": "Optional description",
  "tiers": [
    { "name": "S+", "note": "Best of the best" },
    { "name": "S", "note": "Strong in most content" },
    { "name": "A" },
    { "name": "B" },
    { "name": "C" },
    { "name": "D" },
    { "name": "F", "note": "Avoid" }
  ],
  "entries": [
    {
      "character_name": "Athena",
      "tier": "S+",
      "note": "Optional per-character note"
    }
  ]
}
```

- **`tiers`** _(optional)_: Ordered array of tier definitions. Tiers may have a `note` to describe what the tier means. When absent, defaults to `S+/S/A/B/C/D`.
- **`tiers[].name`** _(required)_: Tier label (any non-empty string).
- **`tiers[].note`** _(optional)_: Human-readable description of the tier.
- **`entries[].tier`**: Must match one of the names defined in `tiers` (or one of the defaults if `tiers` is absent).

## Dependencies

- **pydantic** — Data validation and serialization
