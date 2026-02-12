from enum import Enum

from pydantic import BaseModel


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
    DIVINE_SKILL = "Divine Skill"


class Skill(BaseModel):
    name: str
    type: SkillType | str | None = None
    description: str
    cooldown: int = 0


class Character(BaseModel):
    name: str
    title: str
    quality: Quality
    character_class: CharacterClass
    factions: list[str]
    is_global: bool
    subclasses: list[str]
    height: str
    weight: str
    lore: str
    quote: str
    origin: str
    talent: Talent | None = None
    skills: list[Skill]
    noble_phantasm: str
