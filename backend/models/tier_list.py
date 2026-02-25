from typing import Literal

from pydantic import BaseModel, field_validator

ContentType = Literal["All", "PvP", "PvE", "Boss"]

DEFAULT_TIERS = ["S+", "S", "A", "B", "C", "D"]


class TierDefinition(BaseModel):
    name: str
    note: str = ""


class TierEntry(BaseModel):
    character_name: str
    tier: str  # Any string; validated against TierList.tiers or DEFAULT_TIERS
    note: str = ""


class TierList(BaseModel):
    name: str
    author: str
    content_type: ContentType
    description: str
    tiers: list[TierDefinition] | None = None  # optional; defaults to DEFAULT_TIERS if absent
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
