# Backend

Data management tools for the Dragon Traveler Wiki. Handles syncing JSON data into a Dolt database, exporting Dolt tables back to JSON, and validating data with Pydantic models.

## Setup

```bash
pip install -r requirements.txt
```

**Requirements:** Python 3.10+, [Dolt CLI](https://docs.dolthub.com/introduction/installation)

## Scripts

### Dolt Sync

Syncs JSON data files into the Dolt database at `dolt-db/`. JSON is the source of truth — tables are fully replaced on each run.

```bash
python -m backend.sync_dolt              # sync and commit
python -m backend.sync_dolt --push       # sync, commit, and push to DoltHub
python -m backend.sync_dolt --dry-run    # show SQL without executing
```

### Dolt Export

Exports Dolt tables back to JSON files. By default writes to `backend/exports/`; pass `--output-dir` to choose a different directory relative to the project root.

```bash
python -m backend.export_dolt --target all          # export everything to backend/exports/
python -m backend.export_dolt --target characters   # export characters only
python -m backend.export_dolt --output-dir data     # export everything to data/
```

The frontend build runs the export automatically before `dev` and `build` via npm pre-scripts (`npm run export`).

### Verification

```bash
cd dolt-db
dolt diff HEAD~1          # see what changed
dolt sql -q "SELECT * FROM characters;"
```

## Project Structure

```
backend/
├── sync_dolt.py         # JSON-to-Dolt sync script
├── export_dolt.py       # Dolt-to-JSON export script
├── requirements.txt     # Python dependencies
├── exports/             # Export output (git-ignored)
└── models/              # Pydantic data models
    ├── character.py     # Character, Skill, Talent, Quality, CharacterClass
    ├── code.py          # Code, CodeReward
    ├── faction.py       # Faction, FactionName, Wyrm
    ├── gear.py          # Gear, GearSetBonus
    ├── howlkin.py       # Howlkin
    ├── noble_phantasm.py# NoblePhantasm, NoblePhantasmEffect, NoblePhantasmSkill
    ├── resource.py      # Resource
    ├── status_effect.py # StatusEffect, StatusEffectType
    ├── team.py          # Team, TeamMember, TeamWyrmspells
    ├── tier_list.py     # TierList, TierEntry, Tier
    ├── useful_link.py   # UsefulLink
    └── wyrmspell.py     # Wyrmspell, WyrmspellType
```

## Data Files

The backend reads from and writes to `data/`:

| File                  | Description          |
| --------------------- | -------------------- |
| `characters.json`     | Character database   |
| `noble_phantasm.json` | Noble Phantasm data  |
| `factions.json`       | Faction definitions  |
| `wyrmspells.json`     | Wyrmspell database   |
| `resources.json`      | Resource definitions |
| `codes.json`          | Redemption codes     |
| `status-effects.json` | Status effects       |
| `gear.json`           | Gear database        |
| `gear_sets.json`      | Gear set bonuses     |
| `howlkins.json`       | Howlkin database     |
| `tier-lists.json`     | Community tier lists |
| `teams.json`          | Team compositions    |
| `useful-links.json`   | Community links      |
| `changelog.json`      | Site version history |

## Dolt Database

The Dolt database (`dolt-db/`) mirrors the JSON data in a normalized relational schema with 20 tables. Key relationships:

- `characters` has child tables: `character_factions`, `character_subclasses`, `talent_levels`, `skills`
- `tier_lists` has child table `tier_list_entries`
- `teams` has child table `team_members`
- `changelog` has child table `changelog_changes`

## Dependencies

- **pydantic** — Data validation and serialization
- **dolt** (CLI, not pip) — Database operations

## Roadmap

- Data sorting and normalization
- Data verification and integrity checks
- Add/remove operations for managing entries
