from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.models.query import QueryStatus


class QueryBase(BaseModel):
    complainant_email: EmailStr
    query_text: str


class QueryCreate(QueryBase):
    company_id: str
    complaint_id: Optional[str] = None


class QueryUpdate(BaseModel):
    final_answer: Optional[str] = None
    status: Optional[QueryStatus] = None


class QueryOut(QueryBase):
    id: str
    complaint_id: str
    company_id: str
    sales_rep_id: Optional[str] = None
    ai_generated_answer: Optional[str] = None
    final_answer: Optional[str] = None
    status: QueryStatus
    created_at: datetime
    is_escalated: bool = False
    escalated_at: Optional[datetime] = None
    deadline_at: Optional[datetime] = None
    priority: str = "normal"
    escalation_reason: Optional[str] = None
    tokens: int = 0

    class Config:
        from_attributes = True


class QueryBulkAssign(BaseModel):
    query_ids: List[str]


class EscalateRequest(BaseModel):
    priority: str = "normal"
    reason: str


class NegotiationAction(BaseModel):
    final_answer: str
    final_price: Optional[str] = None
    status: QueryStatus = QueryStatus.RESOLVED
