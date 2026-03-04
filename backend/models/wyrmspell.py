from enum import Enum

from pydantic import BaseModel

from backend.models.character import Quality


class WyrmspellType(str, Enum):
    BREACH = "Breach"
    REFUGE = "Refuge"
    WILDCRY = "Wildcry"
    DRAGONS_CALL = "Dragon's Call"


class Wyrmspell(BaseModel):
    name: str
    effect: str
    type: WyrmspellType
    quality: Quality
    exclusive_faction: str | None = None
    is_global: bool = True
    last_updated: int | None = None
