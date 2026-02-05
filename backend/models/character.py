from enum import Enum

from pydantic import BaseModel

from backend.models.faction import FactionName


class Quality(str, Enum):
    SSR_EX = "SSR EX"
    SSR_PLUS = "SSR+"
    SSR = "SSR"
    SR_PLUS = "SR+"
    R = "R"
    N = "N"


class CharacterClass(str, Enum):
    GUARDIAN = "Guardian"
    PRIEST = "Priest"
    ASSASSIN = "Assassin"
    WARRIOR = "Warrior"
    ARCHER = "Archer"
    MAGE = "Mage"


class TalentLevel(BaseModel):
    level: int
    effect: str


class Skill(BaseModel):
    name: str
    description: str
    cooldown: int


class Character(BaseModel):
    name: str
    quality: Quality
    character_class: CharacterClass
    factions: list[FactionName]
    is_global: bool
    subclasses: list[str]
    height: str
    weight: str
    lore: str
    quote: str
    origin: str
    talent: list[TalentLevel]
    skills: list[Skill]
    noble_phantasm: str
