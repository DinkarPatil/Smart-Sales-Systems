from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActivityLogOut(BaseModel):
    id: str
    action: str
    entity_name: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
