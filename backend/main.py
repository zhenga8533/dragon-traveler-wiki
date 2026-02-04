"""Dragon Traveler Wiki - Scraper Entry Point"""

import argparse
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def scrape_characters() -> list:
    """Scrape character data from source databases."""
    # TODO: Implement character scraping
    return []


def scrape_tier_lists() -> list:
    """Scrape tier list data from source databases."""
    # TODO: Implement tier list scraping
    return []


def scrape_teams() -> list:
    """Scrape team composition data from source databases."""
    # TODO: Implement team scraping
    return []


def scrape_effects() -> list:
    """Scrape effect data from source databases."""
    # TODO: Implement effect scraping
    return []


def scrape_dragon_spells() -> list:
    """Scrape dragon spell data from source databases."""
    # TODO: Implement dragon spell scraping
    return []


def scrape_codes() -> list:
    """Scrape redemption codes from source databases."""
    # TODO: Implement code scraping
    return []


def scrape_news() -> list:
    """Scrape news/updates from source databases."""
    # TODO: Implement news scraping
    return []


def write_json(filename: str, data: list) -> None:
    """Write data to a JSON file in the data directory."""
    filepath = DATA_DIR / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(data)} entries to {filepath}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Dragon Traveler Wiki Scraper")
    parser.add_argument(
        "--target",
        choices=["characters", "tier-lists", "teams", "effects", "dragon-spells", "codes", "news", "all"],
        default="all",
        help="Which data to scrape (default: all)",
    )
    args = parser.parse_args()

    scrapers = {
        "characters": ("characters.json", scrape_characters),
        "tier-lists": ("tier-lists.json", scrape_tier_lists),
        "teams": ("teams.json", scrape_teams),
        "effects": ("effects.json", scrape_effects),
        "dragon-spells": ("dragon-spells.json", scrape_dragon_spells),
        "codes": ("codes.json", scrape_codes),
        "news": ("news.json", scrape_news),
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
