from enum import Enum
from typing import Literal

from pydantic import BaseModel, field_validator

ContentType = Literal["All", "PvP", "PvE", "Boss"]


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
    note: str = ""


class TierList(BaseModel):
    name: str
    author: str
    content_type: ContentType
    description: str
    entries: list[TierEntry]

    @staticmethod
    def _normalize_content_type(value: str) -> ContentType:
        raw = str(value or "").strip().lower()
        if raw == "all":
            return "All"
        if raw in {"pvp", "arena", "duel"}:
            return "PvP"
        if raw in {"pve", "raid", "tower", "campaign"}:
            return "PvE"
        if raw in {"boss", "bosses"}:
            return "Boss"
        raise ValueError("content_type must be one of: All, PvP, PvE, Boss")

    @field_validator("content_type", mode="before")
    @classmethod
    def normalize_content_type(cls, v: str) -> ContentType:
        return cls._normalize_content_type(v)
