from enum import Enum

from pydantic import BaseModel


class StatusEffectType(str, Enum):
    BUFF = "Buff"
    DEBUFF = "Debuff"
    SPECIAL = "Special"
    CONTROL = "Control"
    ELEMENTAL = "Elemental"
    BLESSING = "Blessing"
    EXCLUSIVE = "Exclusive"


class StatusEffect(BaseModel):
    name: str
    type: StatusEffectType
    effect: str
    remark: str
