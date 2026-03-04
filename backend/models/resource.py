from typing import Literal

from pydantic import BaseModel

from backend.models.character import Quality

ResourceCategory = Literal["Currency", "Gift", "Item", "Material", "Summoning", "Shard"]


class Resource(BaseModel):
    name: str
    description: str
    category: ResourceCategory
    quality: Quality
    last_updated: int | None = None
