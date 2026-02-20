from pydantic import BaseModel


class GearSetBonus(BaseModel):
    quantity: int
    description: str


class Gear(BaseModel):
    name: str
    set: str
    type: str
    lore: str
    stats: dict[str, int | float | str]
    set_bonus: GearSetBonus
