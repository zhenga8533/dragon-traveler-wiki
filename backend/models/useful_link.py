from pydantic import BaseModel


class UsefulLink(BaseModel):
    icon: str
    application: str
    name: str
    description: str
    link: str
