"""Shared sort-order constants and sort-key helpers for JSON data tooling."""

QUALITY_ORDER = ["UR", "SSR EX", "SSR+", "SSR", "SR", "R", "N", "C"]
QUALITY_RANK = {q: i for i, q in enumerate(QUALITY_ORDER)}

CLASS_ORDER = ["Guardian", "Priest", "Assassin", "Warrior", "Archer", "Mage"]
CLASS_RANK = {c: i for i, c in enumerate(CLASS_ORDER)}

FACTION_ORDER = [
    "Elemental Echo",
    "Wild Spirit",
    "Arcane Wisdom",
    "Sanctum Glory",
    "Otherworld Return",
    "Illusion Veil",
]
FACTION_RANK = {f: i for i, f in enumerate(FACTION_ORDER)}

STATE_ORDER = [
    "Buff",
    "Debuff",
    "Special",
    "Control",
    "Elemental",
    "Blessing",
    "Exclusive",
]
STATE_RANK = {s: i for i, s in enumerate(STATE_ORDER)}

RESOURCE_CATEGORY_ORDER = ["Currency", "Gift", "Item", "Material", "Summoning", "Shard"]
RESOURCE_CATEGORY_RANK = {c: i for i, c in enumerate(RESOURCE_CATEGORY_ORDER)}

GEAR_TYPE_ORDER = [
    "Headgear",
    "Chestplate",
    "Bracers",
    "Boots",
    "Weapon",
    "Accessory",
]
GEAR_TYPE_RANK = {t: i for i, t in enumerate(GEAR_TYPE_ORDER)}

TIER_ORDER = ["S+", "S", "A", "B", "C", "D"]
TIER_RANK = {t: i for i, t in enumerate(TIER_ORDER)}

_FALLBACK = 999


def character_sort_key(c):
    return (
        CLASS_RANK.get(c.get("character_class", ""), _FALLBACK),
        QUALITY_RANK.get(c.get("quality", ""), _FALLBACK),
        (c.get("name") or "").lower(),
    )


def wyrmspell_sort_key(w):
    return (
        (w.get("type") or "").lower(),
        QUALITY_RANK.get(w.get("quality", ""), _FALLBACK),
        (w.get("name") or "").lower(),
    )


def resource_sort_key(r):
    return (
        RESOURCE_CATEGORY_RANK.get(r.get("category", ""), _FALLBACK),
        QUALITY_RANK.get(r.get("quality", ""), _FALLBACK),
        (r.get("name") or "").lower(),
    )


def status_effect_sort_key(se):
    return (
        STATE_RANK.get(se.get("type", ""), _FALLBACK),
        (se.get("name") or "").lower(),
    )


def useful_link_sort_key(link):
    return (
        (link.get("application") or "").lower(),
        (link.get("name") or "").lower(),
    )


def artifact_sort_key(a):
    return (
        QUALITY_RANK.get(a.get("quality", ""), _FALLBACK),
        (a.get("name") or "").lower(),
    )


def howlkin_sort_key(h):
    return (
        QUALITY_RANK.get(h.get("quality", ""), _FALLBACK),
        (h.get("name") or "").lower(),
    )


def noble_phantasm_sort_key(np):
    return (
        (np.get("character") or "").lower(),
        (np.get("name") or "").lower(),
    )


def subclass_sort_key(sc):
    return (
        CLASS_RANK.get(sc.get("class", ""), _FALLBACK),
        int(sc.get("tier", 0) or 0),
        (sc.get("name") or "").lower(),
    )


def faction_name_sort_key(name):
    normalized_name = (name or "").strip()
    return (FACTION_RANK.get(normalized_name, _FALLBACK), normalized_name.lower())


def faction_sort_key(f):
    return faction_name_sort_key(f.get("name") or "")


def golden_alliance_sort_key(ga):
    return (ga.get("name") or "").lower()


def gear_sort_key(g):
    return (
        GEAR_TYPE_RANK.get(g.get("type", ""), _FALLBACK),
        QUALITY_RANK.get(g.get("quality", ""), _FALLBACK),
        (g.get("name") or "").lower(),
    )


def gear_set_sort_key(gs):
    return (gs.get("name") or "").lower()


def code_sort_key(c):
    return (c.get("code") or "").lower()


# Canonical mapping: data file name → sort key function.
# Files absent from this mapping maintain stable insertion order.
FILE_SORT_KEY = {
    "factions.json": faction_sort_key,
    "characters.json": character_sort_key,
    "wyrmspells.json": wyrmspell_sort_key,
    "resources.json": resource_sort_key,
    "status-effects.json": status_effect_sort_key,
    "useful-links.json": useful_link_sort_key,
    "artifacts.json": artifact_sort_key,
    "howlkins.json": howlkin_sort_key,
    "gear.json": gear_sort_key,
    "gear_sets.json": gear_set_sort_key,
    "noble_phantasm.json": noble_phantasm_sort_key,
    "subclasses.json": subclass_sort_key,
    "golden_alliances.json": golden_alliance_sort_key,
}
