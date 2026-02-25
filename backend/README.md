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

Processes issue payloads and updates the appropriate JSON file.

```bash
python -m backend.suggest
```

### Key Utilities

- `sort_keys.py` — shared deterministic sorting helpers
- `models/` — Pydantic models used for data validation

## Project Structure

```
backend/
├── suggest.py          # Issue suggestion processor
├── sort_keys.py        # Deterministic sort-key helpers
├── requirements.txt    # Python dependencies
├── exports/            # Generated exports (if used externally)
└── models/             # Pydantic data models
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

| File                    | Description          |
| ----------------------- | -------------------- |
| `characters.json`       | Character database   |
| `subclasses.json`       | Subclass definitions |
| `noble_phantasm.json`   | Noble Phantasm data  |
| `factions.json`         | Faction definitions  |
| `artifacts.json`        | Artifact database    |
| `wyrmspells.json`       | Wyrmspell database   |
| `resources.json`        | Resource definitions |
| `codes.json`            | Redemption codes     |
| `status-effects.json`   | Status effects       |
| `gear.json`             | Gear database        |
| `gear_sets.json`        | Gear set bonuses     |
| `howlkins.json`         | Howlkin database     |
| `golden_alliances.json` | Golden alliance sets |
| `tier-lists.json`       | Community tier lists |
| `teams.json`            | Team compositions    |
| `useful-links.json`     | Community links      |
| `changelog.json`        | Site version history |

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

## Dependencies

- **pydantic** — Data validation and serialization

## Roadmap

- Data sorting and normalization
- Data verification and integrity checks
- Add/remove operations for managing entries
