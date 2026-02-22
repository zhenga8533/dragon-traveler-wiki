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
python -m backend.export_dolt --output-dir data     # overwrite data/ from Dolt
python -m backend.export_dolt --output-dir data --merge  # merge: add Dolt-only records, keep local changes
```

`--merge` behaviour (used by the build):

- Records present only in Dolt → added to `data/`
- Records present only in `data/` → kept as-is
- Records present in both → `data/` version wins (local is source of truth)

The frontend `prebuild` step runs `export_dolt --output-dir data --merge` automatically before every `npm run build`, so local edits are never overwritten while new records from Dolt are still pulled in. The plain `npm run export` does a full overwrite (useful when you explicitly want to reset `data/` from Dolt).

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
    ├── artifact.py      # Artifact, ArtifactEffect, ArtifactTreasure
    ├── character.py     # Character, Skill, Talent, Quality, CharacterClass
    ├── code.py          # Code, CodeReward
    ├── faction.py       # Faction, FactionName, Wyrm
    ├── gear.py          # Gear, GearSetBonus
    ├── golden_alliance.py # GoldenAlliance, GoldenAllianceEffect
    ├── howlkin.py       # Howlkin
    ├── noble_phantasm.py# NoblePhantasm, NoblePhantasmEffect, NoblePhantasmSkill
    ├── resource.py      # Resource
    ├── subclass.py      # Subclass
    ├── status_effect.py # StatusEffect, StatusEffectType
    ├── team.py          # Team, TeamMember, TeamWyrmspells
    ├── tier_list.py     # TierList, TierEntry, Tier
    ├── useful_link.py   # UsefulLink
    └── wyrmspell.py     # Wyrmspell, WyrmspellType
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

## Dolt Database

The Dolt database (`dolt-db/`) mirrors the JSON data in a normalized relational schema. Key relationships:

- `characters` has child tables: `character_factions`, `character_subclasses`, `character_recommended_subclasses`, `character_recommended_gear`, `talent_levels`, `skills`
- `subclasses` has child/link tables: `subclass_bonuses`, `subclass_character_classes`
- `character_subclasses.subclass_id` links character subclass assignments to `subclasses.id`
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
