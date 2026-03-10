from pydantic import BaseModel


class TwEvent(BaseModel):
    name: str
    type: str  # "Release" | "Skin" | "Mythic Ascension" | "Rerun"
    characters: list[str] = []
    start_date: str
    end_date: str
    last_updated: int | None = None
