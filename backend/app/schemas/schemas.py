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

class CompanyOut(CompanyBase):
    id: str
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    manual_content: Optional[str] = None

class ProductCreate(ProductBase):
    company_id: Optional[str] = None

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
