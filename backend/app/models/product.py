import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    price = Column(String)
    base_price = Column(Integer, default=0)
    max_discount_pct = Column(Integer, default=0)
    manual_content = Column(Text)

    company = relationship("Company", back_populates="products")
    documents = relationship(
        "ProductDocument", back_populates="product", cascade="all, delete-orphan"
    )


class ProductDocument(Base):
    __tablename__ = "product_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    filename = Column(String)
    content = Column(Text)
    file_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="documents")
