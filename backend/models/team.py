from typing import Literal

from pydantic import BaseModel, field_validator

from backend.models.character import Quality
from backend.models.faction import FactionName

ContentType = Literal["All", "PvP", "PvE", "Boss"]


class TeamMemberPosition(BaseModel):
    row: int  # 0 = Front, 1 = Middle, 2 = Back
    col: int  # 0 = Left, 1 = Center, 2 = Right


class TeamMember(BaseModel):
    character_name: str
    character_quality: Quality | None = None
    overdrive_order: int | None = None
    note: str = ""
    position: TeamMemberPosition | None = None


class TeamBenchMember(BaseModel):
    character_name: str
    character_quality: Quality | None = None
    note: str | None = None


class TeamWyrmspells(BaseModel):
    breach: str | None = None
    refuge: str | None = None
    wildcry: str | None = None
    dragons_call: str | None = None


class Team(BaseModel):
    name: str
    author: str
    content_type: ContentType
    description: str
    faction: FactionName
    members: list[TeamMember]
    bench: list[TeamBenchMember] | None = None
    wyrmspells: TeamWyrmspells | None = None

    @field_validator("content_type", mode="before")
    @classmethod
    def normalize_content_type(cls, v: str) -> ContentType:
        raw = str(v or "").strip().lower()
        if raw == "all":
            return "All"
        if raw in {"pvp", "arena", "duel"}:
            return "PvP"
        if raw in {"pve", "raid", "tower", "campaign"}:
            return "PvE"
        if raw in {"boss", "bosses"}:
            return "Boss"
        raise ValueError("content_type must be one of: All, PvP, PvE, Boss")

    @field_validator("members")
    @classmethod
    def validate_members_count(cls, v: list[TeamMember]) -> list[TeamMember]:
        if len(v) < 1 or len(v) > 6:
            raise ValueError("A team must have between 1 and 6 members")
        return v

    @field_validator("bench", mode="before")
    @classmethod
    def normalize_bench_entries(cls, v):
        if v is None:
            return None
        if not isinstance(v, list):
            raise ValueError("bench must be an array")

        normalized = []
        for entry in v:
            if isinstance(entry, str):
                normalized.append({"character_name": entry})
                continue
            normalized.append(entry)

        return normalized
