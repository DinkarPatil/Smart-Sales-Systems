from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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
    admin_suspended: Optional[bool] = None


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
