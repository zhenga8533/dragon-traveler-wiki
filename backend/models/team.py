from typing import Literal

from pydantic import BaseModel, field_validator

from backend.models.faction import FactionName

ContentType = Literal["All", "PvP", "PvE", "Boss"]


class TeamMember(BaseModel):
    character_name: str
    overdrive_order: int | None = None
    substitutes: list[str] | None = None
    note: str = ""


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
