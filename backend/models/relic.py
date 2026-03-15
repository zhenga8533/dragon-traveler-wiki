from pydantic import BaseModel


class Relic(BaseModel):
    name: str
    oracle_sroll: str | None = None
    lore: str
    type: str
    quality: str
    last_updated: int | None = None
