from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


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
    company_ids: Optional[List[str]] = None
    theme: Optional[str] = None


class UserOut(UserBase):
    id: str
    role: str
    is_active: bool
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    assigned_companies: Optional[List[dict]] = []
    theme: Optional[str] = "system"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
