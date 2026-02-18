from pydantic import BaseModel


class NoblePhantasmEffect(BaseModel):
    tier: str | None = None
    tier_level: int | None = None
    description: str


class NoblePhantasmSkill(BaseModel):
    level: int
    tier: str | None = None
    tier_level: int | None = None
    description: str


class NoblePhantasm(BaseModel):
    name: str
    character: str | None = None
    is_global: bool
    lore: str
    effects: list[NoblePhantasmEffect]
    skills: list[NoblePhantasmSkill]
