from typing import Dict

from pydantic import BaseModel, Field

from backend.models.character import Quality


class Howlkin(BaseModel):
    name: str
    quality: Quality
    basic_stats: Dict[str, float] = Field(default_factory=dict)
    passive_effect: str = ""
