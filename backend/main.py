"""Dragon Traveler Wiki - Scraper Entry Point"""

import argparse
import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def scrape_characters() -> list[dict[str, Any]]:
    """Scrape character data from source databases."""
    # TODO: Implement character scraping
    return []


def scrape_tier_lists() -> list[dict[str, Any]]:
    """Scrape tier list data from source databases."""
    # TODO: Implement tier list scraping
    return []


def scrape_teams() -> list[dict[str, Any]]:
    """Scrape team composition data from source databases."""
    # TODO: Implement team scraping
    return []


def scrape_status_effects() -> list[dict[str, Any]]:
    """Scrape status effect data from source databases."""
    # TODO: Implement status effect scraping
    return []


def scrape_wyrmspells() -> list[dict[str, Any]]:
    """Scrape wyrmspell data from source databases."""
    # TODO: Implement wyrmspell scraping
    return []


def scrape_codes() -> list[dict[str, Any]]:
    """Scrape redemption codes from source databases."""
    # TODO: Implement code scraping
    return []


def write_json(filename: str, data: list[dict[str, Any]]) -> None:
    """Write data to a JSON file in the data directory.

    Args:
        filename: The name of the JSON file (must be a simple filename, no paths).
        data: The data to write as a JSON array.

    Raises:
        ValueError: If filename contains path traversal characters.
    """
    # Validate filename to prevent path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise ValueError(
            f"Invalid filename: {filename}. Must be a simple filename without path separators."
        )

    filepath = DATA_DIR / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(data)} entries to {filepath}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Dragon Traveler Wiki Scraper")
    parser.add_argument(
        "--target",
        choices=[
            "characters",
            "tier-lists",
            "teams",
            "status-effects",
            "dragon-spells",
            "codes",
            "all",
        ],
        default="all",
        help="Which data to scrape (default: all)",
    )
    args = parser.parse_args()

    scrapers = {
        "characters": ("characters.json", scrape_characters),
        "tier-lists": ("tier-lists.json", scrape_tier_lists),
        "teams": ("teams.json", scrape_teams),
        "status-effects": ("status-effects.json", scrape_status_effects),
        "wyrmspells": ("wyrmspells.json", scrape_wyrmspells),
        "codes": ("codes.json", scrape_codes),
    }

    targets = scrapers.keys() if args.target == "all" else [args.target]

    for target in targets:
        filename, scraper_fn = scrapers[target]
        print(f"Scraping {target}...")
        data = scraper_fn()
        write_json(filename, data)

    print("Done.")


if __name__ == "__main__":
    main()
