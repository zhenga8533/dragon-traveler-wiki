from enum import Enum

from pydantic import BaseModel


class WyrmspellType(str, Enum):
    BREACH = "Breach"
    REFUGE = "Refuge"
    WILDCRY = "Wildcry"
    DRAGONS_CALL = "Dragon's Call"


class Wyrmspell(BaseModel):
    name: str
    effect: str
    type: WyrmspellType
    quality: str = ""
    exclusive_faction: str | None = None
    is_global: bool = True
