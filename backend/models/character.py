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


class Talent(BaseModel):
    name: str
    talent_levels: list[TalentLevel]


class SkillType(str, Enum):
    OVERDRIVE = "Overdrive"
    ULTIMATE_SKILL = "Ultimate Skill"
    SECRET_SKILL = "Secret Skill"
    SPECIAL_SKILL = "Special Skill"


class Skill(BaseModel):
    name: str
    type: SkillType
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
    talent: Talent
    skills: list[Skill]
    noble_phantasm: str
