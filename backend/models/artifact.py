from pydantic import BaseModel

from backend.models.character import CharacterClass, Quality


class ArtifactEffect(BaseModel):
    level: int
    description: str


class ArtifactTreasure(BaseModel):
    name: str
    lore: str
    character_class: CharacterClass
    effect: list[ArtifactEffect]


class Artifact(BaseModel):
    name: str
    is_global: bool
    lore: str
    quality: Quality
    effect: list[ArtifactEffect]
    width: int
    height: int
    treasures: list[ArtifactTreasure]
