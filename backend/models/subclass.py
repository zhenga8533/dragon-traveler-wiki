from pydantic import BaseModel, Field

from backend.models.character import CharacterClass


class Subclass(BaseModel):
    name: str
    character_class: CharacterClass = Field(alias="class")
    tier: int
    bonuses: list[str]
    effect: str
