# Backend

Python tools for scraping game data, validating it with Pydantic models, and syncing it into a Dolt database.

## Setup

```bash
pip install -r requirements.txt
```

**Requirements:** Python 3.10+, [Dolt CLI](https://docs.dolthub.com/introduction/installation) (for database sync)

## Scripts

### Scraping

```bash
python -m backend.main --target all          # scrape everything
python -m backend.main --target characters   # scrape characters only
python -m backend.main --target codes        # scrape codes only
```

Supported targets: `characters`, `tier-lists`, `teams`, `status-effects`, `wyrmspells`, `codes`, `all`

Scraped data is written to `data/` as JSON files.

### Dolt Sync

Syncs JSON data files into the Dolt database at `dolt-db/`. JSON is the source of truth — tables are fully replaced on each run.

```bash
python -m backend.sync_dolt              # sync and commit
python -m backend.sync_dolt --push       # sync, commit, and push to DoltHub
python -m backend.sync_dolt --dry-run    # show SQL without executing
```

To verify after syncing:

```bash
cd dolt-db
dolt diff HEAD~1          # see what changed
dolt sql -q "SELECT * FROM characters;"
```

## Project Structure

```
backend/
├── main.py              # Scraper entry point
├── sync_dolt.py         # JSON-to-Dolt sync script
├── requirements.txt     # Python dependencies
├── models/              # Pydantic data models
│   ├── character.py     # Character, Skill, Talent, Quality, CharacterClass
│   ├── faction.py       # Faction, FactionName, Wyrm
│   ├── status_effect.py # StatusEffect, StatusEffectType
│   ├── team.py          # Team, TeamMember, TeamWyrmspells
│   ├── tier_list.py     # TierList, TierEntry, Tier
│   ├── useful_link.py   # UsefulLink
│   └── wyrmspell.py     # Wyrmspell, WyrmspellType
├── scrapers/            # Scraper implementations (WIP)
└── translators/         # AI translation utilities (WIP)
```

## Data Files

The backend reads from and writes to `data/`:

| File                  | Description                |
| --------------------- | -------------------------- |
| `characters.json`     | Character database         |
| `factions.json`       | Faction definitions        |
| `wyrmspells.json`     | Wyrmspell database         |
| `codes.json`          | Redemption codes           |
| `status-effects.json` | Status effects             |
| `tier-lists.json`     | Community tier lists       |
| `teams.json`          | Team compositions          |
| `useful-links.json`   | Community links            |
| `changelog.json`      | Site version history       |

## Dolt Database

The Dolt database (`dolt-db/`) mirrors the JSON data in a normalized relational schema with 16 tables. Key relationships:

- `characters` has child tables: `character_factions`, `character_subclasses`, `talent_levels`, `skills`
- `tier_lists` has child table `tier_list_entries`
- `teams` has child table `team_members`
- `changelog` has child table `changelog_changes`

## Dependencies

- **requests** — HTTP client for scraping
- **beautifulsoup4** — HTML parsing
- **pydantic** — Data validation and serialization
- **dolt** (CLI, not pip) — Database operations via `sync_dolt.py`
