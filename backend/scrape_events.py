"""Scrape active in-app events from the App Store page for Dragon Traveler.

Behaviour:
- Upserts active events from the App Store page into data/events.json.
- Sets `start_date` (ISO date) when an event is first detected.
- Sets `end_date` (ISO date, or null while active) for every entry.
- Downloads the landscape event image to frontend/src/assets/event/<snake_case_name>.webp.
- Does NOT touch fields that haven't changed, so normalize_data.py only bumps
  `last_updated` for entries that actually differ from the committed version.

Usage:
    python -m backend.scrape_events
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

APP_STORE_URL = "https://apps.apple.com/us/app/dragon-traveler/id6751086804"

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
EVENTS_FILE = DATA_DIR / "events.json"
ASSETS_EVENT_DIR = ROOT_DIR / "frontend" / "src" / "assets" / "event"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------


def fetch_page() -> str:
    resp = requests.get(APP_STORE_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return resp.text


# ---------------------------------------------------------------------------
# Parse
# ---------------------------------------------------------------------------


def _largest_image_url(item: BeautifulSoup) -> str | None:
    """Return the URL of the largest landscape image in the event item."""
    source = item.select_one("picture source[srcset]")
    if not source:
        return None
    srcset = source.get("srcset", "")
    # Each entry: "<url> <width>w" — leading comma may be present
    pairs: list[tuple[int, str]] = []
    for m in re.finditer(r"([^\s,][^\s]*)\s+(\d+)w", srcset):
        pairs.append((int(m.group(2)), m.group(1)))
    if not pairs:
        return None
    pairs.sort(reverse=True)
    return pairs[0][1]


def _to_title_case(text: str) -> str:
    """Normalize display text to title case with collapsed whitespace."""
    normalized = " ".join(text.split())
    return normalized.title()


def _normalize_source_display(text: str) -> str:
    """Normalize a source label for display."""
    normalized = _normalize_source_key(text)
    if normalized == "appstore":
        return "App Store"
    return _to_title_case(text)


def _normalize_source_key(text: str | None) -> str:
    """Canonicalize a source string for internal comparisons."""
    if not text:
        return ""
    normalized = " ".join(text.split()).lower()
    return re.sub(r"[^a-z0-9]+", "", normalized)


def parse_events(html: str) -> list[dict]:
    """Extract event data from the static App Store HTML.

    Structure (Svelte SSR):
      .app-event-item
        a[href*=eventid]  — aria-label = name, href contains event ID
                    h4              — badge type (e.g. "Special Event")
          h3              — event name
          p               — truncated description
        picture source    — srcset with multiple landscape image sizes
    """
    soup = BeautifulSoup(html, "lxml")
    items = soup.select(".app-event-item")

    if not items:
        print(
            "  WARNING: No .app-event-item elements found. The page structure may "
            "have changed.",
            file=sys.stderr,
        )
        return []

    events = []
    for item in items:
        link = item.select_one("a[href*='eventid']")
        if not link:
            continue

        name = link.get("aria-label", "").strip()
        if not name:
            name_el = item.select_one("h3")
            name = name_el.get_text(strip=True) if name_el else ""
        if not name:
            continue

        href = link.get("href", "")
        event_id = (
            href.split("eventid=")[-1].split("&")[0] if "eventid=" in href else None
        )

        badge_el = item.select_one("h4")
        desc_el = item.select_one("p")
        image_url = _largest_image_url(item)

        event: dict = {"name": name, "active": True}
        if event_id:
            event["event_id"] = event_id
        if badge_el:
            badge = badge_el.get_text(strip=True)
            if badge:
                event["badge"] = _to_title_case(badge)
        if desc_el:
            event["description"] = desc_el.get_text(strip=True)
        if image_url:
            event["_image_url"] = image_url  # temp field, stripped before writing

        events.append(event)

    print(f"  Parsed {len(events)} event(s) from App Store page.")
    return events


# ---------------------------------------------------------------------------
# Image download
# ---------------------------------------------------------------------------


def _to_snake_case(name: str) -> str:
    """Convert an event name to a snake_case filename stem.

    Examples:
        "The Wedding Operation Event!" -> "the_wedding_operation_event"
        "The Gymnasium Locked-Room Case" -> "the_gymnasium_locked_room_case"
    """
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    slug = slug.strip("_")
    return slug


def download_image(name: str, url: str) -> None:
    """Download the event image, named by snake_case event name."""
    ASSETS_EVENT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{_to_snake_case(name)}.webp"
    dest = ASSETS_EVENT_DIR / filename

    if dest.exists():
        return

    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        print(f"    Downloaded image: {filename}")
    except Exception as e:
        print(
            f"    WARNING: Failed to download image for {name!r}: {e}", file=sys.stderr
        )


# ---------------------------------------------------------------------------
# Load / merge / write
# ---------------------------------------------------------------------------


def load_existing() -> list[dict]:
    if not EVENTS_FILE.exists():
        return []
    with open(EVENTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def merge_events(existing: list[dict], scraped: list[dict], today: str) -> list[dict]:
    """Merge scraped events into existing data.

    Rules:
    - Scraped events are upserted; scraped fields overwrite existing fields.
    - `start_date` is set on first detection and never overwritten.
        - `end_date` is set when an Appstore event disappears from the scrape,
      and cleared if the event reappears.
        - Manual entries (source != "Appstore") are never modified.
    - All entries (active and ended) are retained for history.
    """
    scraped_by_id: dict[str, dict] = {}
    scraped_by_name: dict[str, dict] = {}
    for e in scraped:
        if e.get("event_id"):
            scraped_by_id[e["event_id"]] = e
        scraped_by_name[e["name"]] = e

    existing_by_id: dict[str, dict] = {}
    existing_by_name: dict[str, dict] = {}
    for e in existing:
        if e.get("event_id"):
            existing_by_id[e["event_id"]] = e
        existing_by_name[e["name"]] = e

    result: list[dict] = []
    processed_ids: set[str] = set()

    # Process scraped events (active)
    for scraped_event in scraped:
        event_id = scraped_event.get("event_id")
        image_url = scraped_event.pop("_image_url", None)

        # Find existing entry by event_id first, then name
        existing_entry = (
            existing_by_id.get(event_id)
            if event_id
            else existing_by_name.get(scraped_event["name"])
        ) or {}

        merged = dict(existing_entry)

        # Upsert scraped fields
        for k, v in scraped_event.items():
            merged[k] = v

        merged["source"] = _normalize_source_display("appstore")
        merged["active"] = True

        # Set start_date on first detection
        if "start_date" not in merged:
            merged["start_date"] = today

        # Always present; null while active
        merged["end_date"] = None

        # Download image (named by snake_case event name)
        if image_url:
            download_image(scraped_event["name"], image_url)

        result.append(merged)
        if event_id:
            processed_ids.add(event_id)

    # Preserve existing entries not in this scrape
    for existing_entry in existing:
        event_id = existing_entry.get("event_id")
        name = existing_entry["name"]

        # Skip if already upserted above
        if event_id and event_id in processed_ids:
            continue
        if not event_id and name in scraped_by_name:
            continue

        is_manual = _normalize_source_key(existing_entry.get("source")) != "appstore"
        if is_manual:
            result.append(existing_entry)
            continue

        # Appstore entry that's gone — mark inactive and record end_date
        entry = dict(existing_entry)
        if entry.get("active"):
            entry["active"] = False
            entry["end_date"] = today
            print(f"    Event ended: {name}")
        elif entry.get("end_date") is None:
            # Was already inactive but end_date never set — fill it in
            entry["end_date"] = today
        result.append(entry)

    return result


def write_events(events: list[dict]) -> None:
    with open(EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    print(f"Fetching {APP_STORE_URL} ...")
    try:
        html = fetch_page()
    except Exception as e:
        print(f"Error fetching page: {e}", file=sys.stderr)
        return 1

    scraped = parse_events(html)
    if not scraped:
        print("No events scraped — existing data will not be modified.")
        return 0

    print("Events found:")
    for e in scraped:
        print(f"  [{e.get('badge', 'event')}] {e['name']}")

    today = date.today().isoformat()
    existing = load_existing()
    merged = merge_events(existing, scraped, today)
    write_events(merged)

    active = sum(1 for e in merged if e.get("active"))
    total = len(merged)
    print(
        f"Wrote {active} active / {total} total event(s) to {EVENTS_FILE.relative_to(ROOT_DIR)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
