"""
Shared sort-order constants and sort-key functions used by both sync_dolt and export_dolt.
"""

QUALITY_ORDER = ["UR", "SSR EX", "SSR+", "SSR", "SR", "R", "N"]
QUALITY_RANK = {q: i for i, q in enumerate(QUALITY_ORDER)}

CLASS_ORDER = ["Guardian", "Priest", "Assassin", "Warrior", "Archer", "Mage"]
CLASS_RANK = {c: i for i, c in enumerate(CLASS_ORDER)}

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


def useful_link_sort_key(l):
    return (
        (l.get("application") or "").lower(),
        (l.get("name") or "").lower(),
    )


def artifact_sort_key(a):
    return (
        QUALITY_RANK.get(a.get("quality", ""), _FALLBACK),
        (a.get("name") or "").lower(),
    )


def noble_phantasm_sort_key(np):
    return (
        (np.get("character") or "").lower(),
        (np.get("name") or "").lower(),
    )


def faction_sort_key(f):
    return (f.get("name") or "").lower()


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
    "noble_phantasm.json": noble_phantasm_sort_key,
}
