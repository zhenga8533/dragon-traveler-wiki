from pydantic import BaseModel, field_validator

from backend.models.faction import FactionName


class TeamMember(BaseModel):
    character_name: str
    overdrive_order: int | None = None


class Team(BaseModel):
    name: str
    author: str
    content_type: str
    description: str
    faction: FactionName
    members: list[TeamMember]

    @field_validator("members")
    @classmethod
    def validate_members_count(cls, v: list[TeamMember]) -> list[TeamMember]:
        if len(v) < 1 or len(v) > 6:
            raise ValueError("A team must have between 1 and 6 members")
        return v
