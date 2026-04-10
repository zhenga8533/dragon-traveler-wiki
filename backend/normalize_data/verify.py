"""Cross-reference verification checks across data files."""

import json
from collections.abc import Callable
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT_DIR / "data"


def _load_json(filename: str) -> list | dict | None:
    path = DATA_DIR / filename
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return None


def _names(data: list | dict | None, key: str = "name") -> set[str]:
    """Extract a set of name values from a list of dicts."""
    if not isinstance(data, list):
        return set()
    return {e[key] for e in data if isinstance(e, dict) and e.get(key)}


def _check_duplicates(
    errors: list[str],
    entries: list,
    keyfn: "Callable[[dict], str | None]",
    label: str,
) -> None:
    """Append an error for each duplicate key found in entries."""
    seen: dict[str, int] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        key = keyfn(entry)
        if key is None:
            continue
        seen[key] = seen.get(key, 0) + 1
    for key, count in seen.items():
        if count > 1:
            errors.append(f"{label}: duplicate entry '{key}' appears {count} times")


def verify_data() -> list[str]:
    """Cross-reference checks across data files. Returns a list of error messages."""
    errors: list[str] = []

    # Load all files up front
    characters_data = _load_json("characters.json")
    factions_data = _load_json("factions.json")
    subclasses_data = _load_json("subclasses.json")
    gear_data = _load_json("gear.json")
    gear_sets_data = _load_json("gear-sets.json")
    artifacts_data = _load_json("artifacts.json")
    noble_phantasm_data = _load_json("noble-phantasm.json")
    wyrmspells_data = _load_json("wyrmspells.json")
    howlkins_data = _load_json("howlkins.json")
    golden_alliances_data = _load_json("golden-alliances.json")
    teams_data = _load_json("teams.json")
    tier_lists_data = _load_json("tier-lists.json")
    events_data = _load_json("events.json")
    codes_data = _load_json("codes.json")
    resources_data = _load_json("resources.json")

    char_names = _names(characters_data)
    faction_names = _names(factions_data)
    subclass_names = _names(subclasses_data)
    gear_names = _names(gear_data)
    gear_set_names = _names(gear_sets_data)
    artifact_names = _names(artifacts_data)
    np_names = _names(noble_phantasm_data)
    wyrmspell_names = _names(wyrmspells_data)
    howlkin_names = _names(howlkins_data)
    resource_names = _names(resources_data)

    def _warn_load(filename: str) -> None:
        errors.append(f"verify: could not load {filename} — skipping related checks")

    # -----------------------------------------------------------------------
    # Duplicate checks
    # -----------------------------------------------------------------------
    _name_key: Callable[[dict], str | None] = lambda e: e.get("name")

    for filename, data, keyfn in [
        ("characters.json",      characters_data,      lambda e: f"{e.get('name')}|{e.get('quality')}"),
        ("subclasses.json",      subclasses_data,      _name_key),
        ("gear.json",            gear_data,            _name_key),
        ("gear-sets.json",       gear_sets_data,       _name_key),
        ("artifacts.json",       artifacts_data,       _name_key),
        ("noble-phantasm.json",  noble_phantasm_data,  _name_key),
        ("wyrmspells.json",      wyrmspells_data,      _name_key),
        ("howlkins.json",        howlkins_data,        _name_key),
        ("golden-alliances.json",golden_alliances_data,_name_key),
        ("factions.json",        factions_data,        _name_key),
        ("teams.json",           teams_data,           _name_key),
        ("resources.json",       resources_data,       _name_key),
        ("status-effects.json",  _load_json("status-effects.json"), _name_key),
        ("events.json",          events_data,          lambda e: f"{e.get('name')}|{e.get('is_global')}"),
        ("codes.json",           codes_data,           lambda e: e.get("code")),
        ("changelog.json",       _load_json("changelog.json"), lambda e: e.get("version")),
    ]:
        if isinstance(data, list):
            _check_duplicates(errors, data, keyfn, filename)

    if not isinstance(characters_data, list):
        _warn_load("characters.json")
        return errors

    # -----------------------------------------------------------------------
    # characters.json
    # -----------------------------------------------------------------------
    if not faction_names:
        _warn_load("factions.json")
    if not subclass_names:
        _warn_load("subclasses.json")
    if not gear_names:
        _warn_load("gear.json")

    for char in characters_data:
        if not isinstance(char, dict):
            continue
        name = char.get("name", "<unnamed>")
        quality = char.get("quality", "")
        label = f"{name} ({quality})" if quality else name

        char_subclasses: list = char.get("subclasses") or []
        char_subclass_set = set(char_subclasses)

        # duplicate skill names within this character
        _check_duplicates(errors, char.get("skills") or [], _name_key, f"{label} skills")

        # duplicate talent levels within this character
        talent_levels = (char.get("talent") or {}).get("talent_levels") or []
        _check_duplicates(errors, talent_levels, lambda e: str(e.get("level")), f"{label} talent_levels")

        # factions must exist in factions.json
        if faction_names:
            for faction in char.get("factions") or []:
                if faction not in faction_names:
                    errors.append(f"{label}: faction '{faction}' not found in factions.json")

        # subclasses must exist in subclasses.json
        if subclass_names:
            for sc in char_subclasses:
                if sc not in subclass_names:
                    errors.append(f"{label}: subclass '{sc}' not found in subclasses.json")

        # recommended_subclasses must be a subset of the character's own subclasses
        for sc in char.get("recommended_subclasses") or []:
            if sc not in char_subclass_set:
                errors.append(
                    f"{label}: recommended_subclass '{sc}' not in subclasses {char_subclasses}"
                )

        # recommended_gear values must exist in gear.json
        if gear_names:
            for slot, gear_name in (char.get("recommended_gear") or {}).items():
                if gear_name and gear_name not in gear_names:
                    errors.append(
                        f"{label}: recommended_gear[{slot}] '{gear_name}' not found in gear.json"
                    )

        # noble_phantasm name must exist in noble-phantasm.json
        if np_names:
            np_val = char.get("noble_phantasm")
            if np_val and np_val not in np_names:
                errors.append(
                    f"{label}: noble_phantasm '{np_val}' not found in noble-phantasm.json"
                )

    # -----------------------------------------------------------------------
    # noble-phantasm.json
    # -----------------------------------------------------------------------
    if isinstance(noble_phantasm_data, list):
        for np in noble_phantasm_data:
            if not isinstance(np, dict):
                continue
            np_name = np.get("name", "<unnamed>")
            character = np.get("character")
            if character and character not in char_names:
                errors.append(
                    f"noble_phantasm '{np_name}': character '{character}' not found in characters.json"
                )

    # -----------------------------------------------------------------------
    # artifacts.json — duplicate treasure names within each artifact
    # -----------------------------------------------------------------------
    if isinstance(artifacts_data, list):
        for artifact in artifacts_data:
            if not isinstance(artifact, dict):
                continue
            art_label = f"artifact '{artifact.get('name', '<unnamed>')}'"
            _check_duplicates(errors, artifact.get("treasures") or [], _name_key, f"{art_label} treasures")

    # -----------------------------------------------------------------------
    # factions.json — recommended_artifacts
    # -----------------------------------------------------------------------
    if isinstance(factions_data, list) and artifact_names:
        for faction in factions_data:
            if not isinstance(faction, dict):
                continue
            fname = faction.get("name", "<unnamed>")
            for art in faction.get("recommended_artifacts") or []:
                if art not in artifact_names:
                    errors.append(
                        f"faction '{fname}': recommended_artifact '{art}' not found in artifacts.json"
                    )

    # -----------------------------------------------------------------------
    # gear.json — set must exist in gear-sets.json
    # -----------------------------------------------------------------------
    if isinstance(gear_data, list) and gear_set_names:
        for item in gear_data:
            if not isinstance(item, dict):
                continue
            item_name = item.get("name", "<unnamed>")
            set_name = item.get("set")
            if set_name and set_name not in gear_set_names:
                errors.append(
                    f"gear '{item_name}': set '{set_name}' not found in gear-sets.json"
                )

    # -----------------------------------------------------------------------
    # wyrmspells.json — exclusive_faction must exist in factions.json
    # -----------------------------------------------------------------------
    if isinstance(wyrmspells_data, list) and faction_names:
        for ws in wyrmspells_data:
            if not isinstance(ws, dict):
                continue
            ws_name = ws.get("name", "<unnamed>")
            ef = ws.get("exclusive_faction")
            if ef and ef not in faction_names:
                errors.append(
                    f"wyrmspell '{ws_name}': exclusive_faction '{ef}' not found in factions.json"
                )

    # -----------------------------------------------------------------------
    # golden-alliances.json — howlkins must exist in howlkins.json
    # -----------------------------------------------------------------------
    if isinstance(golden_alliances_data, list) and howlkin_names:
        for ga in golden_alliances_data:
            if not isinstance(ga, dict):
                continue
            ga_name = ga.get("name", "<unnamed>")
            for hk in ga.get("howlkins") or []:
                if hk not in howlkin_names:
                    errors.append(
                        f"golden_alliance '{ga_name}': howlkin '{hk}' not found in howlkins.json"
                    )

    # -----------------------------------------------------------------------
    # teams.json
    # -----------------------------------------------------------------------
    if isinstance(teams_data, list):
        for team in teams_data:
            if not isinstance(team, dict):
                continue
            team_name = team.get("name", "<unnamed>")

            # faction
            if faction_names:
                faction = team.get("faction")
                if faction and faction not in faction_names:
                    errors.append(
                        f"team '{team_name}': faction '{faction}' not found in factions.json"
                    )

            # members, bench, and placeholder character names
            if char_names:
                for role in ("members", "bench", "placeholders"):
                    for member in team.get(role) or []:
                        if not isinstance(member, dict):
                            continue
                        cname = member.get("character_name")
                        if cname and cname not in char_names:
                            errors.append(
                                f"team '{team_name}': {role} character '{cname}' not found in characters.json"
                            )

            # wyrmspells values
            if wyrmspell_names:
                for slot, ws_name in (team.get("wyrmspells") or {}).items():
                    if ws_name and ws_name not in wyrmspell_names:
                        errors.append(
                            f"team '{team_name}': wyrmspells[{slot}] '{ws_name}' not found in wyrmspells.json"
                        )

    # -----------------------------------------------------------------------
    # tier-lists.json — entries reference character names and defined tiers
    # -----------------------------------------------------------------------
    if isinstance(tier_lists_data, list):
        for tl in tier_lists_data:
            if not isinstance(tl, dict):
                continue
            tl_name = tl.get("name", "<unnamed>")
            valid_tiers = {t["name"] for t in (tl.get("tiers") or []) if isinstance(t, dict) and t.get("name")}

            for entry in tl.get("entries") or []:
                if not isinstance(entry, dict):
                    continue
                cname = entry.get("character_name")
                tier = entry.get("tier")

                if char_names and cname and cname not in char_names:
                    errors.append(
                        f"tier-list '{tl_name}': character '{cname}' not found in characters.json"
                    )
                if valid_tiers and tier and tier not in valid_tiers:
                    errors.append(
                        f"tier-list '{tl_name}': entry for '{cname}' has unknown tier '{tier}' (valid: {sorted(valid_tiers)})"
                    )

    # -----------------------------------------------------------------------
    # events.json — characters must exist in characters.json
    # -----------------------------------------------------------------------
    if isinstance(events_data, list) and char_names:
        for event in events_data:
            if not isinstance(event, dict):
                continue
            event_name = event.get("name", "<unnamed>")
            for cname in event.get("characters") or []:
                if cname not in char_names:
                    errors.append(
                        f"event '{event_name}': character '{cname}' not found in characters.json"
                    )

    # -----------------------------------------------------------------------
    # codes.json — reward keys must exist in resources.json
    # -----------------------------------------------------------------------
    if isinstance(codes_data, list) and resource_names:
        for code_entry in codes_data:
            if not isinstance(code_entry, dict):
                continue
            code = code_entry.get("code", "<unknown>")
            for res_name in (code_entry.get("rewards") or {}):
                if res_name not in resource_names:
                    errors.append(
                        f"code '{code}': reward resource '{res_name}' not found in resources.json"
                    )

    # -----------------------------------------------------------------------
    # sort_keys.py — hardcoded order lists must stay in sync with data
    # -----------------------------------------------------------------------
    from ..sort_keys import (
        CLASS_ORDER,
        FACTION_ORDER,
        GEAR_TYPE_ORDER,
        RELIC_TYPE_ORDER,
        STATE_ORDER,
    )

    def _check_order_list(
        order: list[str],
        actual: set[str],
        order_name: str,
        data_source: str,
    ) -> None:
        for val in order:
            if val not in actual:
                errors.append(
                    f"sort_keys.{order_name}: '{val}' not found in {data_source} — stale entry"
                )
        for val in actual:
            if val not in order:
                errors.append(
                    f"sort_keys.{order_name}: '{val}' from {data_source} is missing — add to order list"
                )

    if faction_names:
        _check_order_list(FACTION_ORDER, faction_names, "FACTION_ORDER", "factions.json")

    if isinstance(characters_data, list):
        actual_classes = {c.get("character_class") for c in characters_data if isinstance(c, dict) and c.get("character_class")}
        _check_order_list(CLASS_ORDER, actual_classes, "CLASS_ORDER", "characters.json")

    if isinstance(gear_data, list):
        actual_gear_types = {g.get("type") for g in gear_data if isinstance(g, dict) and g.get("type")}
        _check_order_list(GEAR_TYPE_ORDER, actual_gear_types, "GEAR_TYPE_ORDER", "gear.json")

    status_effects_data = _load_json("status-effects.json")
    if isinstance(status_effects_data, list):
        actual_states = {s.get("type") for s in status_effects_data if isinstance(s, dict) and s.get("type")}
        _check_order_list(STATE_ORDER, actual_states, "STATE_ORDER", "status-effects.json")

    relics_data = _load_json("relic.json")
    if isinstance(relics_data, list):
        actual_relic_types = {r.get("type") for r in relics_data if isinstance(r, dict) and r.get("type")}
        _check_order_list(RELIC_TYPE_ORDER, actual_relic_types, "RELIC_TYPE_ORDER", "relic.json")

    return errors
