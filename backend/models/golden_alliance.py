from pydantic import BaseModel, Field


class GoldenAllianceEffect(BaseModel):
    level: int
    stats: list[str] = Field(default_factory=list)


class GoldenAlliance(BaseModel):
    name: str
    howlkins: list[str] = Field(default_factory=list)
    effects: list[GoldenAllianceEffect] = Field(default_factory=list)
