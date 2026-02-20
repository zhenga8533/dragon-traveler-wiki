from enum import Enum

from pydantic import BaseModel, Field


class FactionName(str, Enum):
    ELEMENTAL_ECHO = "Elemental Echo"
    WILD_SPIRIT = "Wild Spirit"
    ARCANE_WISDOM = "Arcane Wisdom"
    SANCTUM_GLORY = "Sanctum Glory"
    OTHERWORLD_RETURN = "Otherworld Return"
    ILLUSION_VEIL = "Illusion Veil"


class Wyrm(str, Enum):
    FIRE_WHELP = "Fire Whelp"
    BUTTERFLY_WHELP = "Butterfly Whelp"
    EMERALD_WHELP = "Emerald Whelp"
    SHADOW_WHELP = "Shadow Whelp"
    LIGHT_WHELP = "Light Whelp"
    DARK_WHELP = "Dark Whelp"


class Faction(BaseModel):
    name: FactionName
    wyrm: Wyrm
    description: str
    recommended_artifacts: list[str] = Field(default_factory=list)
