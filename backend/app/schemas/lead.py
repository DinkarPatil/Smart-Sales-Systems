from datetime import datetime

from pydantic import BaseModel


class LeadStatCreate(BaseModel):
    company_id: str
    type: str  # "Call" or "SMS"
    sentiment: str  # "+ve" or "-ve"


class LeadStatOut(LeadStatCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
