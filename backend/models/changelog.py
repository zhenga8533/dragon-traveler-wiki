from typing import Literal

from pydantic import BaseModel


class ChangelogChange(BaseModel):
    type: Literal["added", "updated", "fixed", "removed"]
    category: str
    description: str


class ChangelogEntry(BaseModel):
    date: str
    version: str | None = None
    changes: list[ChangelogChange]
    last_updated: int | None = None
