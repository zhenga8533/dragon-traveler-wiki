from pydantic import BaseModel


class StarLevelEntry(BaseModel):
    stars: int
    copies: int
    fodder: int
    divine_crystals: int


class StarTierData(BaseModel):
    name: str
    levels: list[StarLevelEntry]
