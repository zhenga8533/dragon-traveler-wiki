"""Data normalization helpers for GitHub Issue suggestion payloads."""


# ---------------------------------------------------------------------------
# Primitive coercions
# ---------------------------------------------------------------------------


def parse_boolish(value, default=True):
    """Parse bool-like values from issue payloads with sane defaults."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "t", "yes", "y", "on"}:
            return True
        if normalized in {"0", "false", "f", "no", "n", "off", ""}:
            return False
        return default
    return bool(value)


def _coerce_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _coerce_optional_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# List / dict normalizers
# ---------------------------------------------------------------------------


def _split_csv_list(value):
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


def _normalize_string_list(value, item_key="name"):
    if isinstance(value, str):
        return _split_csv_list(value)
    if isinstance(value, list):
        normalized = []
        for item in value:
            if isinstance(item, dict):
                text = str(item.get(item_key, "") or "").strip()
            else:
                text = str(item or "").strip()
            if text:
                normalized.append(text)
        return normalized
    return []


def _normalize_stat_dict(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        result = {}
        for item in value:
            if not isinstance(item, dict):
                continue
            stat_name = str(item.get("stat") or item.get("name") or "").strip()
            if not stat_name:
                continue
            result[stat_name] = item.get("value")
        return result
    return {}


def _normalize_effect_list(value):
    if not isinstance(value, list):
        return []
    return [
        {
            "level": _coerce_int(item.get("level"), 0),
            "description": str(item.get("description") or ""),
        }
        for item in value
        if isinstance(item, dict)
    ]


def _normalize_artifact_treasures(value):
    if not isinstance(value, list):
        return []
    treasures = []
    for item in value:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        treasures.append(
            {
                "name": name,
                "lore": str(item.get("lore") or ""),
                "character_class": str(item.get("character_class") or ""),
                "effect": _normalize_effect_list(item.get("effect", [])),
            }
        )
    return treasures


def _normalize_golden_alliance_effects(value):
    if not isinstance(value, list):
        return []
    return [
        {
            "level": _coerce_int(item.get("level"), 0),
            "stats": _normalize_string_list(item.get("stats", [])),
        }
        for item in value
        if isinstance(item, dict)
    ]


# ---------------------------------------------------------------------------
# Per-label normalization
# ---------------------------------------------------------------------------


def normalize_for_json(label, data, is_update=False):
    """Normalize issue data into the shape expected by the JSON data files."""
    if label == "codes":
        rewards_input = data.get("rewards") if "rewards" in data else data.get("reward")
        if isinstance(rewards_input, list):
            rewards = {
                r["name"]: int(r.get("quantity", 0))
                for r in rewards_input
                if r.get("name")
            }
        elif isinstance(rewards_input, dict):
            rewards = {k: int(v) for k, v in rewards_input.items() if k}
        else:
            rewards = {}

        if is_update:
            result = {"code": data["code"]}
            if "rewards" in data or "reward" in data:
                result["rewards"] = rewards
            if "active" in data:
                result["active"] = parse_boolish(data.get("active"), default=True)
            return result

        return {
            "code": data["code"],
            "rewards": rewards,
            "active": parse_boolish(data.get("active"), default=True),
        }

    if label == "wyrmspell":
        if not is_update:
            return {
                "name": data["name"],
                "effect": data.get("effect", ""),
                "type": data.get("type", ""),
                "quality": data.get("quality", "") or "",
                "exclusive_faction": data.get("exclusive_faction") or None,
                "is_global": data.get("is_global", True),
            }

        result = {"name": data["name"]}
        if "effect" in data:
            result["effect"] = data.get("effect", "")
        if "type" in data:
            result["type"] = data.get("type", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "") or ""
        if "exclusive_faction" in data:
            result["exclusive_faction"] = data.get("exclusive_faction") or None
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        return result

    if label == "status-effect":
        if not is_update:
            return {
                "name": data["name"],
                "type": data.get("type", ""),
                "effect": data.get("effect", ""),
                "remark": data.get("remark", ""),
            }

        result = {"name": data["name"]}
        if "type" in data:
            result["type"] = data.get("type", "")
        if "effect" in data:
            result["effect"] = data.get("effect", "")
        if "remark" in data:
            result["remark"] = data.get("remark", "")
        return result

    if label == "noble-phantasm":
        if not is_update:
            return {
                "name": data["name"],
                "character": data.get("character") or None,
                "is_global": data.get("is_global", True),
                "lore": data.get("lore", ""),
                "effects": data.get("effects", []),
                "skills": data.get("skills", []),
            }

        result = {"name": data["name"]}
        if "character" in data:
            result["character"] = data.get("character") or None
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "effects" in data:
            result["effects"] = data.get("effects", [])
        if "skills" in data:
            result["skills"] = data.get("skills", [])
        return result

    if label == "howlkin":
        raw_stats = data.get("basic_stats") if "basic_stats" in data else {}
        stats = {}
        if isinstance(raw_stats, dict):
            stats = raw_stats
        elif isinstance(raw_stats, list):
            for entry in raw_stats:
                if not isinstance(entry, dict):
                    continue
                name = entry.get("stat") or entry.get("name") or ""
                value = entry.get("value")
                if not name:
                    continue
                try:
                    parsed = float(value)
                    value = int(parsed) if parsed.is_integer() else parsed
                except (TypeError, ValueError):
                    pass
                stats[name] = value

        raw_effects = (
            data.get("passive_effects")
            if "passive_effects" in data
            else data.get("passive_effect")
        )
        if isinstance(raw_effects, list):
            passive_effects = [str(e) for e in raw_effects if e]
        elif isinstance(raw_effects, str) and raw_effects:
            passive_effects = [
                line for line in (l.strip() for l in raw_effects.splitlines()) if line
            ]
        else:
            passive_effects = []

        if not is_update:
            return {
                "name": data["name"],
                "quality": data.get("quality", ""),
                "basic_stats": stats,
                "passive_effects": passive_effects,
            }

        result = {"name": data["name"]}
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "basic_stats" in data:
            result["basic_stats"] = stats
        if "passive_effects" in data or "passive_effect" in data:
            result["passive_effects"] = passive_effects
        return result

    if label == "resource":
        if not is_update:
            return {
                "name": data["name"],
                "quality": data.get("quality") or "",
                "description": data.get("description", ""),
                "category": data.get("category", ""),
            }

        result = {"name": data["name"]}
        if "quality" in data:
            result["quality"] = data.get("quality") or ""
        if "description" in data:
            result["description"] = data.get("description", "")
        if "category" in data:
            result["category"] = data.get("category", "")
        return result

    if label == "faction":
        if not is_update:
            return {
                "name": data["name"],
                "wyrm": data.get("wyrm", ""),
                "description": data.get("description", ""),
                "recommended_artifacts": _normalize_string_list(
                    data.get("recommended_artifacts", [])
                ),
            }

        result = {"name": data["name"]}
        if "wyrm" in data:
            result["wyrm"] = data.get("wyrm", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "recommended_artifacts" in data:
            result["recommended_artifacts"] = _normalize_string_list(
                data.get("recommended_artifacts", [])
            )
        return result

    if label == "artifact":
        if not is_update:
            return {
                "name": data["name"],
                "is_global": data.get("is_global", True),
                "lore": data.get("lore", ""),
                "quality": data.get("quality", ""),
                "effect": _normalize_effect_list(data.get("effect", [])),
                "columns": _coerce_int(data.get("columns"), 0),
                "rows": _coerce_int(data.get("rows"), 0),
                "treasures": _normalize_artifact_treasures(data.get("treasures", [])),
            }

        result = {"name": data["name"]}
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "effect" in data:
            result["effect"] = _normalize_effect_list(data.get("effect", []))
        if "columns" in data:
            result["columns"] = _coerce_int(data.get("columns"), 0)
        if "rows" in data:
            result["rows"] = _coerce_int(data.get("rows"), 0)
        if "treasures" in data:
            result["treasures"] = _normalize_artifact_treasures(
                data.get("treasures", [])
            )
        return result

    if label == "subclass":
        resolved_class = str(data.get("class") or data.get("character_class") or "")

        if not is_update:
            return {
                "name": data["name"],
                "class": resolved_class,
                "tier": _coerce_int(data.get("tier"), 0),
                "bonuses": _normalize_string_list(data.get("bonuses", [])),
                "effect": data.get("effect", ""),
            }

        result = {"name": data["name"]}
        if "class" in data or "character_class" in data:
            result["class"] = resolved_class
        if "tier" in data:
            result["tier"] = _coerce_int(data.get("tier"), 0)
        if "bonuses" in data:
            result["bonuses"] = _normalize_string_list(data.get("bonuses", []))
        if "effect" in data:
            result["effect"] = data.get("effect", "")
        return result

    if label == "golden-alliance":
        if not is_update:
            return {
                "name": data["name"],
                "howlkins": _normalize_string_list(data.get("howlkins", [])),
                "effects": _normalize_golden_alliance_effects(data.get("effects", [])),
            }

        result = {"name": data["name"]}
        if "howlkins" in data:
            result["howlkins"] = _normalize_string_list(data.get("howlkins", []))
        if "effects" in data:
            result["effects"] = _normalize_golden_alliance_effects(
                data.get("effects", [])
            )
        return result

    if label == "gear":
        if not is_update:
            return {
                "name": data["name"],
                "set": data.get("set", ""),
                "type": data.get("type", ""),
                "quality": data.get("quality", ""),
                "lore": data.get("lore", ""),
                "stats": _normalize_stat_dict(data.get("stats", {})),
            }

        result = {"name": data["name"]}
        if "set" in data:
            result["set"] = data.get("set", "")
        if "type" in data:
            result["type"] = data.get("type", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "stats" in data:
            result["stats"] = _normalize_stat_dict(data.get("stats", {}))
        return result

    if label == "gear-set":
        set_bonus_payload = data.get("set_bonus")
        quantity_from_flat = data.get("quantity")
        if quantity_from_flat is None:
            quantity_from_flat = data.get("bonus_quantity")
        description_from_flat = data.get("description")
        if description_from_flat is None:
            description_from_flat = data.get("bonus_description")

        if not is_update:
            return {
                "name": data["name"],
                "set_bonus": {
                    "quantity": _coerce_int(
                        (set_bonus_payload or {}).get("quantity", quantity_from_flat),
                        0,
                    ),
                    "description": str(
                        (set_bonus_payload or {}).get(
                            "description", description_from_flat
                        )
                        or ""
                    ),
                },
            }

        result = {"name": data["name"]}
        set_bonus_update = {}
        if "set_bonus" in data and isinstance(set_bonus_payload, dict):
            if "quantity" in set_bonus_payload:
                set_bonus_update["quantity"] = _coerce_int(
                    set_bonus_payload.get("quantity"), 0
                )
            if "description" in set_bonus_payload:
                set_bonus_update["description"] = str(
                    set_bonus_payload.get("description") or ""
                )
        if "quantity" in data or "bonus_quantity" in data:
            set_bonus_update["quantity"] = _coerce_int(quantity_from_flat, 0)
        if "description" in data or "bonus_description" in data:
            set_bonus_update["description"] = str(description_from_flat or "")
        if set_bonus_update:
            result["set_bonus"] = set_bonus_update
        return result

    if label == "links":
        if not is_update:
            return {
                "icon": data.get("icon", ""),
                "application": data.get("application", ""),
                "name": data["name"],
                "description": data.get("description", ""),
                "link": data["link"],
            }

        result = {"name": data["name"]}
        if "icon" in data:
            result["icon"] = data.get("icon", "")
        if "application" in data:
            result["application"] = data.get("application", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "link" in data:
            result["link"] = data.get("link")
        return result

    if label == "character":
        recommended_gear_input = data.get("recommended_gear")
        recommended_gear = None
        if isinstance(recommended_gear_input, dict):
            normalized_gear = {
                "headgear": str(
                    recommended_gear_input.get("headgear", "") or ""
                ).strip(),
                "chestplate": str(
                    recommended_gear_input.get("chestplate", "") or ""
                ).strip(),
                "bracers": str(recommended_gear_input.get("bracers", "") or "").strip(),
                "boots": str(recommended_gear_input.get("boots", "") or "").strip(),
                "weapon": str(recommended_gear_input.get("weapon", "") or "").strip(),
                "accessory": str(
                    recommended_gear_input.get("accessory", "") or ""
                ).strip(),
            }
            if any(normalized_gear.values()):
                recommended_gear = normalized_gear

        if not is_update:
            return {
                "name": data["name"],
                "title": data.get("title", ""),
                "quality": data.get("quality", ""),
                "character_class": data.get("character_class", ""),
                "factions": _split_csv_list(data.get("factions", [])),
                "is_global": data.get("is_global", True),
                "subclasses": _split_csv_list(data.get("subclasses", [])),
                "height": data.get("height", ""),
                "weight": data.get("weight", ""),
                "origin": data.get("origin", ""),
                "lore": data.get("lore", ""),
                "quote": data.get("quote", ""),
                "talent": data.get("talent"),
                "skills": data.get("skills", []),
                "noble_phantasm": data.get("noble_phantasm") or "",
                "recommended_gear": recommended_gear,
                "recommended_subclasses": _split_csv_list(
                    data.get("recommended_subclasses", [])
                ),
            }

        result = {"name": data["name"]}
        if "title" in data:
            result["title"] = data.get("title", "")
        if "quality" in data:
            result["quality"] = data.get("quality", "")
        if "character_class" in data:
            result["character_class"] = data.get("character_class", "")
        if "factions" in data:
            result["factions"] = _split_csv_list(data.get("factions", []))
        if "is_global" in data:
            result["is_global"] = data.get("is_global")
        if "subclasses" in data:
            result["subclasses"] = _split_csv_list(data.get("subclasses", []))
        if "height" in data:
            result["height"] = data.get("height", "")
        if "weight" in data:
            result["weight"] = data.get("weight", "")
        if "origin" in data:
            result["origin"] = data.get("origin", "")
        if "lore" in data:
            result["lore"] = data.get("lore", "")
        if "quote" in data:
            result["quote"] = data.get("quote", "")
        if "talent" in data:
            result["talent"] = data.get("talent")
        if "skills" in data:
            result["skills"] = data.get("skills", [])
        if "noble_phantasm" in data:
            result["noble_phantasm"] = data.get("noble_phantasm") or ""
        if "recommended_gear" in data:
            result["recommended_gear"] = recommended_gear
        if "recommended_subclasses" in data:
            result["recommended_subclasses"] = _split_csv_list(
                data.get("recommended_subclasses", [])
            )
        return result

    if label == "tier-list":

        def _normalize_tier_defs(raw):
            if not raw or not isinstance(raw, list):
                return None
            result = []
            for t in raw:
                if isinstance(t, dict):
                    name = str(t.get("name", "")).strip()
                    if name:
                        result.append(
                            {"name": name, "note": str(t.get("note", "") or "")}
                        )
                elif isinstance(t, str) and t.strip():
                    result.append({"name": t.strip(), "note": ""})
            return result if result else None

        if not is_update:
            normalized = {
                "name": data["name"],
                "author": data.get("author", ""),
                "content_type": data.get("content_type", ""),
                "description": data.get("description", ""),
                "entries": [
                    {
                        "character_name": e.get("character_name", ""),
                        "character_quality": e.get("character_quality") or None,
                        "tier": e.get("tier", ""),
                        "note": e.get("note", ""),
                    }
                    for e in data.get("entries", [])
                ],
            }
            tiers = _normalize_tier_defs(data.get("tiers"))
            if tiers is not None:
                normalized["tiers"] = tiers
            return normalized

        result = {"name": data["name"]}
        if "author" in data:
            result["author"] = data.get("author", "")
        if "content_type" in data:
            result["content_type"] = data.get("content_type", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "tiers" in data:
            tiers = _normalize_tier_defs(data.get("tiers"))
            if tiers is not None:
                result["tiers"] = tiers
        if "entries" in data:
            result["entries"] = [
                {
                    "character_name": e.get("character_name", ""),
                    "character_quality": e.get("character_quality") or None,
                    "tier": e.get("tier", ""),
                    "note": e.get("note", ""),
                }
                for e in data.get("entries", [])
            ]
        return result

    if label == "team":
        if not is_update:
            return {
                "name": data["name"],
                "author": data.get("author", ""),
                "content_type": data.get("content_type", ""),
                "description": data.get("description", ""),
                "faction": data.get("faction", ""),
                "members": [
                    {
                        "character_name": m.get("character_name", ""),
                        "character_quality": m.get("character_quality") or None,
                        "overdrive_order": _coerce_optional_int(
                            m.get("overdrive_order")
                        ),
                        "substitutes": _split_csv_list(m.get("substitutes", [])),
                        "note": m.get("note", ""),
                    }
                    for m in data.get("members", [])
                ],
                "wyrmspells": {
                    "breach": (data.get("wyrmspells") or {}).get("breach", "")
                    or str(data.get("breach_wyrmspell", "") or ""),
                    "refuge": (data.get("wyrmspells") or {}).get("refuge", "")
                    or str(data.get("refuge_wyrmspell", "") or ""),
                    "wildcry": (data.get("wyrmspells") or {}).get("wildcry", "")
                    or str(data.get("wildcry_wyrmspell", "") or ""),
                    "dragons_call": (data.get("wyrmspells") or {}).get(
                        "dragons_call", ""
                    )
                    or str(data.get("dragons_call_wyrmspell", "") or ""),
                },
            }

        result = {"name": data["name"]}
        if "author" in data:
            result["author"] = data.get("author", "")
        if "content_type" in data:
            result["content_type"] = data.get("content_type", "")
        if "description" in data:
            result["description"] = data.get("description", "")
        if "faction" in data:
            result["faction"] = data.get("faction", "")
        if "members" in data:
            result["members"] = [
                {
                    "character_name": m.get("character_name", ""),
                    "character_quality": m.get("character_quality") or None,
                    "overdrive_order": _coerce_optional_int(m.get("overdrive_order")),
                    "substitutes": _split_csv_list(m.get("substitutes", [])),
                    "note": m.get("note", ""),
                }
                for m in data.get("members", [])
            ]

        wyrmspell_updates = {}
        if "wyrmspells" in data and isinstance(data.get("wyrmspells"), dict):
            for key in ["breach", "refuge", "wildcry", "dragons_call"]:
                if key in data["wyrmspells"]:
                    wyrmspell_updates[key] = str(data["wyrmspells"].get(key, "") or "")
        if "breach_wyrmspell" in data:
            wyrmspell_updates["breach"] = str(data.get("breach_wyrmspell", "") or "")
        if "refuge_wyrmspell" in data:
            wyrmspell_updates["refuge"] = str(data.get("refuge_wyrmspell", "") or "")
        if "wildcry_wyrmspell" in data:
            wyrmspell_updates["wildcry"] = str(data.get("wildcry_wyrmspell", "") or "")
        if "dragons_call_wyrmspell" in data:
            wyrmspell_updates["dragons_call"] = str(
                data.get("dragons_call_wyrmspell", "") or ""
            )
        if wyrmspell_updates:
            result["wyrmspells"] = wyrmspell_updates
        return result

    raise ValueError(f"Unknown label: {label}")
