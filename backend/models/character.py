from enum import Enum

from pydantic import BaseModel


class Quality(str, Enum):
    MYTH = "Myth"
    LEGEND_PLUS = "Legend+"
    LEGEND = "Legend"
    EPIC = "Epic"
    ELITE = "Elite"


class CharacterClass(str, Enum):
    GUARDIAN = "Guardian"
    PRIEST = "Priest"
    ASSASSIN = "Assassin"
    WARRIOR = "Warrior"
    ARCHER = "Archer"
    MAGE = "Mage"


class Faction(str, Enum):
    ELEMENTAL_ECHO = "Elemental Echo"
    WILD_SPIRIT = "Wild Spirit"
    ARCANE_WISDOM = "Arcane Wisdom"
    SANCTUM_GLORY = "Sanctum Glory"
    OTHERWORLD_RETURN = "Otherworld Return"
    ILLUSION_VEIL = "Illusion Veil"


class Subclass(BaseModel):
    name: str
    icon: str


class Ability(BaseModel):
    name: str
    icon: str
    description: str


class Character(BaseModel):
    name: str
    quality: Quality
    character_class: CharacterClass
    factions: list[Faction]
    is_global: bool
    subclasses: list[Subclass]
    portraits: list[str]
    illustrations: list[str]
    height: str
    weight: str
    lore: str
    abilities: list[Ability]
