from pydantic import BaseModel, Field


class Code(BaseModel):
    code: str
    active: bool = True
    rewards: dict[str, int] = Field(default_factory=dict)
    last_updated: int | None = None
