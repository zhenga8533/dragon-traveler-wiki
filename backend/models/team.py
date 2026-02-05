from pydantic import BaseModel

from backend.models.faction import FactionName


class Team(BaseModel):
    name: str
    author: str
    content_type: str
    description: str
    faction: FactionName
    characters: list[str]
