from enum import Enum

from pydantic import BaseModel


class Tier(str, Enum):
    S_PLUS = "S+"
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class TierEntry(BaseModel):
    character_name: str
    tier: Tier


class TierList(BaseModel):
    name: str
    author: str
    content_type: str
    description: str
    entries: list[TierEntry]
