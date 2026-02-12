from pydantic import BaseModel, Field, model_validator


class CodeReward(BaseModel):
    name: str
    quantity: int = 0


class Code(BaseModel):
    code: str
    active: bool = True
    rewards: list[CodeReward] = Field(default_factory=list)
