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

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    company_id: Optional[str] = None

class UserOut(UserBase):
    id: str
    role: UserRole
    is_active: bool
    company_id: Optional[str] = None
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
    total_queries: int
    pending_queries: int
    resolved_queries: int
    total_personnel: int

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
    manual_content: Optional[str] = None

class ProductCreate(ProductBase):
    company_id: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manual_content: Optional[str] = None

class ProductOut(ProductBase):
    id: str
    company_id: str
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
    class Config:
        from_attributes = True

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
