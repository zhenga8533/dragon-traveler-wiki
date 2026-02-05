from enum import Enum

from pydantic import BaseModel


class StatusEffectState(str, Enum):
    BUFF = "Buff"
    DEBUFF = "Debuff"
    SPECIAL = "Special"


class StatusEffect(BaseModel):
    icon: str
    name: str
    state: StatusEffectState
    effect: str
    remark: str
