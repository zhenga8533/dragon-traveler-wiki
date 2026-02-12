from pydantic import BaseModel, Field


class CodeReward(BaseModel):
    name: str
    resource_id: int | None = None
    quantity: int = 0


class Code(BaseModel):
    code: str
    active: bool = True
    rewards: list[CodeReward] = Field(default_factory=list)
