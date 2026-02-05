from pydantic import BaseModel


class Wyrmspell(BaseModel):
    name: str
    effect: str
