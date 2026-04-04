from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, QueryStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    admin_secret_key: Optional[str] = None
    role: Optional[UserRole] = None
    company_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    company_id: Optional[str] = None
    company_ids: Optional[List[str]] = None # For multi-assignment
    theme: Optional[str] = None

class UserOut(UserBase):
    id: str
    role: str
    is_active: bool
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    assigned_companies: Optional[List[dict]] = [] # List of {id, name}
    theme: Optional[str] = "system"
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: Optional[dict] = {}

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None

class CompanyOut(CompanyBase):
    id: str
    product_count: Optional[int] = 0
    user_count: Optional[int] = 0
    sales_rep_count: Optional[int] = 0
    manager_name: Optional[str] = None
    is_active: bool = True
    admin_suspended: bool = False
    manager_suspended: bool = False
    created_at: Optional[datetime] = None
    total_tokens: Optional[int] = 0
    weekly_tokens: Optional[int] = 0
    monthly_tokens: Optional[int] = 0
    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_companies: int
    total_products: int
    total_queries: int
    pending_queries: int
    resolved_queries: int

class OwnerStats(BaseModel):
    company_name: str
    total_products: int
    pending_queries: int
    resolved_queries: int
    total_team_members: int
    escalated_queries: int = 0
    products_missing_docs: int = 0
    high_priority_pending: int = 0

class SalesRepStats(BaseModel):
    resolved_count: int
    pending_count: int
    assigned_count: int
    avg_resolution_time: Optional[float] = 0.0

class QueryBulkAssign(BaseModel):
    query_ids: List[str]

class TeamMemberOut(BaseModel):
    id: str
    full_name: Optional[str]
    email: str
    role: str
    active_queries: int
    resolved_queries: int

class ManagerStats(BaseModel):
    company_name: str
    total_queries: int
    pending_queries: int
    resolved_queries: int
    positive_sentiment_pct: float
    team_count: int

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    base_price: Optional[int] = 0
    max_discount_pct: Optional[int] = 0
    manual_content: Optional[str] = None

class ProductDocumentOut(BaseModel):
    id: str
    filename: str
    content: Optional[str] = None
    file_type: str
    created_at: datetime
    class Config:
        from_attributes = True

class ProductCreate(ProductBase):
    company_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    base_price: Optional[int] = None
    max_discount_pct: Optional[int] = None
    manual_content: Optional[str] = None

class ProductOut(ProductBase):
    id: str
    company_id: str
    documents: List[ProductDocumentOut] = []
    class Config:
        from_attributes = True

class QueryBase(BaseModel):
    complainant_email: EmailStr
    query_text: str

class QueryCreate(QueryBase):
    company_id: str # Hashed ID
    complaint_id: Optional[str] = None # Optional, if Google Form doesn't send one

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
    tokens: int = 0
    class Config:
        from_attributes = True

class NegotiationAction(BaseModel):
    final_answer: str
    final_price: Optional[str] = None
    status: QueryStatus = QueryStatus.RESOLVED

class LeadStatCreate(BaseModel):
    company_id: str
    type: str # "Call" or "SMS"
    sentiment: str # "+ve" or "-ve"

class LeadStatOut(LeadStatCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class Msg(BaseModel):
    msg: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class ActivityLogOut(BaseModel):
    id: str
    action: str
    entity_name: str
    details: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True
