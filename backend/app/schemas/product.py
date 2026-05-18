from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    base_price: Optional[int] = 0
    max_discount_pct: Optional[int] = 0
    manual_content: Optional[str] = None


class ProductCreate(ProductBase):
    company_id: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    base_price: Optional[int] = None
    max_discount_pct: Optional[int] = None
    manual_content: Optional[str] = None


class ProductDocumentOut(BaseModel):
    id: str
    filename: str
    content: Optional[str] = None
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProductOut(ProductBase):
    id: str
    company_id: str
    documents: List[ProductDocumentOut] = []

    class Config:
        from_attributes = True
