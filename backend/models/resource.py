from typing import Optional

from pydantic import BaseModel


class Resource(BaseModel):
    name: str
    description: str = ""
    category: str = ""
    quality: Optional[str] = None
